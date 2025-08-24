import { supabase } from '../lib/supabase';
import { Assignment, AssignmentSubmission } from '../types';
import { FileUploadService, UploadResult } from './fileUploadService';

export class AssignmentService {
  /**
   * Get all assignments for a course
   */
  static async getAssignments(courseId?: string): Promise<Assignment[]> {
    try {
      let query = supabase
        .from('assignments')
        .select(`
          *,
          course:courses!assignments_course_id_fkey(
            id,
            title,
            code,
            instructor_name
          )
        `)
        .order('created_at', { ascending: false });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get assignments:', error);
      throw error;
    }
  }

  /**
   * Get a single assignment by ID
   */
  static async getAssignment(assignmentId: string): Promise<Assignment | null> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          course:courses!assignments_course_id_fkey(
            id,
            title,
            code,
            instructor_name
          ),
          submissions:assignment_submissions!assignment_submissions_assignment_id_fkey(
            id,
            student_id,
            submitted_at,
            status,
            grade,
            feedback,
            files,
            student:users!assignment_submissions_student_id_fkey(
              id,
              name,
              email
            )
          )
        `)
        .eq('id', assignmentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Failed to get assignment:', error);
      throw error;
    }
  }

  /**
   * Create a new assignment
   */
  static async createAssignment(assignmentData: {
    courseId: string;
    title: string;
    description: string;
    dueDate: string;
    totalPoints: number;
    instructions?: string;
    attachments?: File[];
    rubric?: any;
    allowLateSubmissions?: boolean;
    maxFileSize?: number;
    allowedFileTypes?: string[];
  }, instructorId: string): Promise<Assignment> {
    try {
      // Upload attachment files if provided
      let attachmentUrls: UploadResult[] = [];
      if (assignmentData.attachments && assignmentData.attachments.length > 0) {
        const attachmentPath = `assignments/${assignmentData.courseId}/${Date.now()}/attachments`;
        attachmentUrls = await FileUploadService.uploadMultipleFiles(
          assignmentData.attachments,
          attachmentPath,
          instructorId,
          {
            allowedTypes: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
            maxSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5
          }
        );
      }

      const { data, error } = await supabase
        .from('assignments')
        .insert({
          course_id: assignmentData.courseId,
          title: assignmentData.title,
          description: assignmentData.description,
          instructions: assignmentData.instructions,
          due_date: assignmentData.dueDate,
          total_points: assignmentData.totalPoints,
          created_by: instructorId,
          attachments: attachmentUrls,
          rubric: assignmentData.rubric,
          settings: {
            allow_late_submissions: assignmentData.allowLateSubmissions ?? false,
            max_file_size: assignmentData.maxFileSize ?? 25 * 1024 * 1024,
            allowed_file_types: assignmentData.allowedFileTypes ?? ['.pdf', '.doc', '.docx'],
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create assignment:', error);
      throw error;
    }
  }

  /**
   * Update an assignment
   */
  static async updateAssignment(
    assignmentId: string,
    updateData: Partial<{
      title: string;
      description: string;
      instructions: string;
      dueDate: string;
      totalPoints: number;
      rubric: any;
      settings: any;
    }>,
    instructorId: string
  ): Promise<Assignment> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .eq('created_by', instructorId) // Ensure only the creator can update
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update assignment:', error);
      throw error;
    }
  }

  /**
   * Delete an assignment
   */
  static async deleteAssignment(assignmentId: string, instructorId: string): Promise<boolean> {
    try {
      // First, get assignment details to clean up files
      const assignment = await this.getAssignment(assignmentId);
      
      if (assignment && assignment.attachments) {
        // Delete attachment files
        for (const attachment of assignment.attachments as UploadResult[]) {
          await FileUploadService.deleteFile(attachment.path, instructorId);
        }
      }

      // Delete all submissions and their files
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('files')
        .eq('assignment_id', assignmentId);

      if (submissions) {
        for (const submission of submissions) {
          if (submission.files) {
            for (const file of submission.files as UploadResult[]) {
              await FileUploadService.deleteFile(file.path, instructorId);
            }
          }
        }
      }

      // Delete the assignment (cascade will handle submissions)
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)
        .eq('created_by', instructorId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      throw error;
    }
  }

  /**
   * Submit an assignment
   */
  static async submitAssignment(
    assignmentId: string,
    studentId: string,
    submissionData: {
      content?: string;
      files?: File[];
      comments?: string;
    }
  ): Promise<AssignmentSubmission> {
    try {
      // Check if assignment exists and is still accepting submissions
      const assignment = await this.getAssignment(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      const dueDate = new Date(assignment.dueDate);
      const now = new Date();
      const isLate = now > dueDate;

      if (isLate && !assignment.settings?.allow_late_submissions) {
        throw new Error('Assignment is past due and late submissions are not allowed');
      }

      // Upload submission files
      let fileUploads: UploadResult[] = [];
      if (submissionData.files && submissionData.files.length > 0) {
        const submissionPath = `assignments/${assignment.courseId}/submissions/${assignmentId}/${studentId}/${Date.now()}`;
        
        fileUploads = await FileUploadService.uploadMultipleFiles(
          submissionData.files,
          submissionPath,
          studentId,
          {
            allowedTypes: assignment.settings?.allowed_file_types || ['.pdf', '.doc', '.docx'],
            maxSize: assignment.settings?.max_file_size || 25 * 1024 * 1024,
            maxFiles: 10
          }
        );
      }

      // Check if student already has a submission
      const { data: existingSubmission } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .single();

      let submissionResult;

      if (existingSubmission) {
        // Update existing submission
        const { data, error } = await supabase
          .from('assignment_submissions')
          .update({
            content: submissionData.content,
            files: fileUploads,
            comments: submissionData.comments,
            status: isLate ? 'late' : 'submitted',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubmission.id)
          .select()
          .single();

        if (error) throw error;
        submissionResult = data;
      } else {
        // Create new submission
        const { data, error } = await supabase
          .from('assignment_submissions')
          .insert({
            assignment_id: assignmentId,
            student_id: studentId,
            content: submissionData.content,
            files: fileUploads,
            comments: submissionData.comments,
            status: isLate ? 'late' : 'submitted',
            submitted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        submissionResult = data;
      }

      return submissionResult;
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      throw error;
    }
  }

  /**
   * Get submissions for an assignment
   */
  static async getSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          student:users!assignment_submissions_student_id_fkey(
            id,
            name,
            email,
            student_id
          )
        `)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get submissions:', error);
      throw error;
    }
  }

  /**
   * Get student's submission for an assignment
   */
  static async getStudentSubmission(
    assignmentId: string, 
    studentId: string
  ): Promise<AssignmentSubmission | null> {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Failed to get student submission:', error);
      throw error;
    }
  }

  /**
   * Grade a submission
   */
  static async gradeSubmission(
    submissionId: string,
    gradeData: {
      grade: number;
      feedback: string;
      rubricScores?: Record<string, number>;
    },
    instructorId: string
  ): Promise<AssignmentSubmission> {
    try {
      const { data, error } = await supabase
        .from('assignment_submissions')
        .update({
          grade: gradeData.grade,
          feedback: gradeData.feedback,
          rubric_scores: gradeData.rubricScores,
          graded_by: instructorId,
          graded_at: new Date().toISOString(),
          status: 'graded',
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to grade submission:', error);
      throw error;
    }
  }

  /**
   * Get assignments for a student
   */
  static async getStudentAssignments(studentId: string): Promise<Array<Assignment & {
    submission?: AssignmentSubmission;
    isOverdue?: boolean;
  }>> {
    try {
      // Get enrolled courses for the student
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const courseIds = enrollments.map(e => e.course_id);

      // Get assignments for enrolled courses
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          *,
          course:courses!assignments_course_id_fkey(
            id,
            title,
            code
          )
        `)
        .in('course_id', courseIds)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Get submissions for these assignments
      const assignmentIds = assignments?.map(a => a.id) || [];
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('*')
        .in('assignment_id', assignmentIds)
        .eq('student_id', studentId);

      // Combine assignments with submissions
      const now = new Date();
      return (assignments || []).map(assignment => {
        const submission = submissions?.find(s => s.assignment_id === assignment.id);
        const dueDate = new Date(assignment.due_date);
        
        return {
          ...assignment,
          submission,
          isOverdue: now > dueDate && !submission
        };
      });
    } catch (error) {
      console.error('Failed to get student assignments:', error);
      throw error;
    }
  }

  /**
   * Get assignment statistics
   */
  static async getAssignmentStats(assignmentId: string) {
    try {
      const { data: submissions, error } = await supabase
        .from('assignment_submissions')
        .select('grade, status')
        .eq('assignment_id', assignmentId);

      if (error) throw error;

      const total = submissions?.length || 0;
      const graded = submissions?.filter(s => s.grade !== null).length || 0;
      const submitted = submissions?.filter(s => s.status === 'submitted' || s.status === 'late' || s.status === 'graded').length || 0;
      const late = submissions?.filter(s => s.status === 'late').length || 0;

      const grades = submissions?.filter(s => s.grade !== null).map(s => s.grade) || [];
      const averageGrade = grades.length > 0 ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0;

      return {
        total,
        submitted,
        graded,
        late,
        pending: total - graded,
        averageGrade,
        submissionRate: total > 0 ? (submitted / total) * 100 : 0
      };
    } catch (error) {
      console.error('Failed to get assignment stats:', error);
      throw error;
    }
  }

  /**
   * Export assignment grades to CSV
   */
  static async exportGrades(assignmentId: string): Promise<string> {
    try {
      const submissions = await this.getSubmissions(assignmentId);
      
      // Create CSV headers
      const headers = ['Student Name', 'Student ID', 'Email', 'Grade', 'Status', 'Submitted At', 'Feedback'];
      
      // Create CSV rows
      const rows = submissions.map(submission => [
        (submission.student as any)?.name || '',
        (submission.student as any)?.student_id || '',
        (submission.student as any)?.email || '',
        submission.grade?.toString() || '',
        submission.status || '',
        submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : '',
        (submission.feedback || '').replace(/"/g, '""') // Escape quotes
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Failed to export grades:', error);
      throw error;
    }
  }
}
