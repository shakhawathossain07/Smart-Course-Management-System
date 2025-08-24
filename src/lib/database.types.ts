export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assignments: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string
          instructions: string | null
          due_date: string
          total_points: number
          max_grade: number
          grading_strategy: 'percentage' | 'letter-grade' | 'pass-fail'
          attachments: Json
          rubric: Json
          settings: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description: string
          instructions?: string | null
          due_date: string
          total_points?: number
          max_grade?: number
          grading_strategy?: 'percentage' | 'letter-grade' | 'pass-fail'
          attachments?: Json
          rubric?: Json
          settings?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string
          instructions?: string | null
          due_date?: string
          total_points?: number
          max_grade?: number
          grading_strategy?: 'percentage' | 'letter-grade' | 'pass-fail'
          attachments?: Json
          rubric?: Json
          settings?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          course_id: string
          student_id: string
          date: string
          status: 'present' | 'absent' | 'late'
          marked_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          student_id: string
          date?: string
          status?: 'present' | 'absent' | 'late'
          marked_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          student_id?: string
          date?: string
          status?: 'present' | 'absent' | 'late'
          marked_by?: string | null
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          code: string | null
          instructor_id: string | null
          instructor_name: string | null
          start_date: string
          end_date: string
          max_students: number
          credits: number
          category: string
          features: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          code?: string | null
          instructor_id?: string | null
          instructor_name?: string | null
          start_date: string
          end_date: string
          max_students?: number
          credits?: number
          category: string
          features?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          code?: string | null
          instructor_id?: string | null
          instructor_name?: string | null
          start_date?: string
          end_date?: string
          max_students?: number
          credits?: number
          category?: string
          features?: Json
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          student_id: string | null
          course_id: string | null
          enrolled_at: string
        }
        Insert: {
          id?: string
          student_id?: string | null
          course_id?: string | null
          enrolled_at?: string
        }
        Update: {
          id?: string
          student_id?: string | null
          course_id?: string | null
          enrolled_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: 'assignment' | 'announcement' | 'attendance' | 'grade'
          title: string
          message: string
          recipient_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          type: 'assignment' | 'announcement' | 'attendance' | 'grade'
          title: string
          message: string
          recipient_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'assignment' | 'announcement' | 'attendance' | 'grade'
          title?: string
          message?: string
          recipient_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string | null
          role: 'admin' | 'instructor' | 'student'
          avatar_url: string | null
          student_id: string | null
          department: string | null
          gpa: number | null
          permissions: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email?: string | null
          role?: 'admin' | 'instructor' | 'student'
          avatar_url?: string | null
          student_id?: string | null
          department?: string | null
          gpa?: number | null
          permissions?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          role?: 'admin' | 'instructor' | 'student'
          avatar_url?: string | null
          student_id?: string | null
          department?: string | null
          gpa?: number | null
          permissions?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string | null
          student_id: string | null
          student_name: string | null
          content: string | null
          grade: number | null
          feedback: string | null
          status: 'draft' | 'submitted' | 'late' | 'graded' | null
          files: Json
          comments: string | null
          rubric_scores: Json
          graded_by: string | null
          submitted_at: string
          graded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id?: string | null
          student_id?: string | null
          student_name?: string | null
          content?: string | null
          grade?: number | null
          feedback?: string | null
          status?: 'draft' | 'submitted' | 'late' | 'graded' | null
          files?: Json
          comments?: string | null
          rubric_scores?: Json
          graded_by?: string | null
          submitted_at?: string
          graded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string | null
          student_id?: string | null
          student_name?: string | null
          content?: string | null
          grade?: number | null
          feedback?: string | null
          status?: 'draft' | 'submitted' | 'late' | 'graded' | null
          files?: Json
          comments?: string | null
          rubric_scores?: Json
          graded_by?: string | null
          submitted_at?: string
          graded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      file_uploads: {
        Row: {
          id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string | null
          entity_type: string
          entity_id: string
          public_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by?: string | null
          entity_type: string
          entity_id: string
          public_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string | null
          entity_type?: string
          entity_id?: string
          public_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attendance_status: 'present' | 'absent' | 'late'
      grading_strategy: 'percentage' | 'letter-grade' | 'pass-fail'
      notification_type: 'assignment' | 'announcement' | 'attendance' | 'grade'
      submission_status: 'draft' | 'submitted' | 'late' | 'graded'
      user_role: 'admin' | 'instructor' | 'student'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}