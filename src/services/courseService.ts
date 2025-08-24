import { supabase } from '../lib/supabase';
import { Course } from '../types';

export class CourseService {
  static async getAllCourses(): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(name),
          enrollments(student_id)
        `);

      if (error) throw error;

      return data.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        instructorId: course.instructor_id || '',
        instructorName: course.instructor_name || course.instructor?.name || 'Unknown',
        startDate: new Date(course.start_date),
        endDate: new Date(course.end_date),
        enrolledStudents: course.enrollments.map((e: { student_id: string }) => e.student_id),
        maxStudents: course.max_students,
        credits: course.credits,
        category: course.category,
        features: course.features ? JSON.parse(course.features) : [],
      }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }

  static async createCourse(courseData: {
    title: string;
    description: string;
    instructorId: string;
    startDate: Date;
    endDate: Date;
    maxStudents: number;
    credits: number;
    category: string;
  }): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: courseData.title,
          description: courseData.description,
          instructor_id: courseData.instructorId,
          start_date: courseData.startDate.toISOString().split('T')[0],
          end_date: courseData.endDate.toISOString().split('T')[0],
          max_students: courseData.maxStudents,
          credits: courseData.credits,
          category: courseData.category,
        })
        .select()
        .single();

      if (error) throw error;

      // Get instructor name
      const { data: instructor } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', courseData.instructorId)
        .single();

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        instructorId: data.instructor_id || '',
        instructorName: instructor?.name || 'Unknown',
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        enrolledStudents: [],
        maxStudents: data.max_students,
        credits: data.credits,
        category: data.category,
        features: [],
      };
    } catch (error) {
      console.error('Error creating course:', error);
      return null;
    }
  }

  static async enrollStudent(studentId: string, courseId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error enrolling student:', error);
      return false;
    }
  }

  static async getStudentEnrollments(studentId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', studentId);

      if (error) throw error;
      return data.map(enrollment => enrollment.course_id || '');
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      return [];
    }
  }

  static async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    try {
      console.log('Fetching courses for instructor:', instructorId);
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(name),
          enrollments(student_id)
        `)
        .eq('instructor_id', instructorId);

      if (error) {
        console.warn('Database query failed, using mock instructor courses:', error);
        return this.getMockInstructorCourses(instructorId);
      }

      const courses = (data || []).map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        instructorId: course.instructor_id || '',
        instructorName: course.instructor_name || course.instructor?.name || 'Unknown',
        startDate: new Date(course.start_date),
        endDate: new Date(course.end_date),
        enrolledStudents: course.enrollments.map((e: { student_id: string }) => e.student_id),
        maxStudents: course.max_students,
        credits: course.credits,
        category: course.category,
        features: course.features ? JSON.parse(course.features) : [],
      }));

      // If no courses found in database, return mock courses
      if (courses.length === 0) {
        console.log('No courses found in database, returning mock courses');
        return this.getMockInstructorCourses(instructorId);
      }

      console.log('Instructor courses loaded:', courses.length);
      return courses;
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
      return this.getMockInstructorCourses(instructorId);
    }
  }

  private static getMockInstructorCourses(instructorId: string): Course[] {
    // Mock courses for demo purposes
    const mockCourses = [
      {
        id: 'course-001',
        title: 'Advanced Web Development',
        description: 'Learn modern web development with React, Node.js, and databases. Full-stack development with hands-on projects.',
        instructorId: instructorId,
        instructorName: 'Dr. Sarah Johnson',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-15'),
        enrolledStudents: ['student-001', 'student-002', 'student-003', 'student-004', 'student-005'],
        maxStudents: 25,
        credits: 4,
        category: 'Computer Science',
        features: [
          { type: 'certificate' as const, name: 'Web Development Certificate', description: 'Completion certificate', enabled: true },
          { type: 'peer-review' as const, name: 'Code Reviews', description: 'Peer code review system', enabled: true }
        ],
      },
      {
        id: 'course-002',
        title: 'Software Engineering Principles',
        description: 'Introduction to software engineering methodologies, project management, and agile development practices.',
        instructorId: instructorId,
        instructorName: 'Dr. Emily Rodriguez',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-06-01'),
        enrolledStudents: ['student-001', 'student-003', 'student-004'],
        maxStudents: 20,
        credits: 3,
        category: 'Engineering',
        features: [
          { type: 'badge' as const, name: 'Agile Practitioner', description: 'Agile development badge', enabled: true }
        ],
      }
    ];

    console.log('Returning mock courses for instructor:', mockCourses.length);
    return mockCourses;
  }

  static async getCourseById(courseId: string): Promise<Course | null> {
    try {
      console.log('Fetching course with ID:', courseId);
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(name),
          enrollments(student_id)
        `)
        .eq('id', courseId)
        .single();

      console.log('Course query result:', { data, error });

      if (error) throw error;

      const course = {
        id: data.id,
        title: data.title,
        description: data.description,
        instructorId: data.instructor_id || '',
        instructorName: data.instructor_name || data.instructor?.name || 'Unknown',
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        enrolledStudents: data.enrollments.map((e: { student_id: string }) => e.student_id),
        maxStudents: data.max_students,
        credits: data.credits,
        category: data.category,
        features: data.features ? JSON.parse(data.features) : [],
      };
      
      console.log('Processed course:', course);
      return course;
    } catch (error) {
      console.error('Error fetching course:', error);
      return null;
    }
  }
}