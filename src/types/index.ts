// Core user types and interfaces
export type UserRole = 'admin' | 'instructor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

export interface Instructor extends User {
  role: 'instructor';
  department: string;
  courses: string[];
}

export interface Student extends User {
  role: 'student';
  studentId: string;
  enrolledCourses: string[];
  gpa: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  startDate: Date;
  endDate: Date;
  enrolledStudents: string[];
  maxStudents: number;
  credits: number;
  category: string;
  features: CourseFeature[];
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: Date;
  totalPoints: number;
  maxGrade: number;
  submissions?: AssignmentSubmission[];
  gradingStrategy?: string;
  attachments?: Array<{
    url: string;
    path: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  rubric?: Record<string, unknown>;
  settings?: {
    allow_late_submissions?: boolean;
    max_file_size?: number;
    allowed_file_types?: string[];
  };
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  content?: string;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
  status?: 'draft' | 'submitted' | 'late' | 'graded';
  files?: Array<{
    url: string;
    path: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  comments?: string;
  rubricScores?: Record<string, number>;
  gradedBy?: string;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AttendanceRecord {
  id: string;
  courseId: string;
  studentId: string;
  date: Date;
  status: 'present' | 'absent' | 'late';
  markedBy: string;
}

export interface Notification {
  id: string;
  type: 'assignment' | 'announcement' | 'attendance' | 'grade';
  title: string;
  message: string;
  recipients: string[];
  createdAt: Date;
  read: boolean;
}

export interface CourseFeature {
  type: 'certificate' | 'badge' | 'peer-review' | 'discussion';
  name: string;
  description: string;
  enabled: boolean;
}