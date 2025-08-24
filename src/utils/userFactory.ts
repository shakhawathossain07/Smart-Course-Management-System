// User Factory Utility - Alternative Implementation
import { User, Admin, Instructor, Student, UserRole } from '../types';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function generateStudentId(): string {
  return 'STU' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

export function createUser(role: UserRole, userData: Partial<User>): User {
  const baseUser = {
    id: userData.id || generateId(),
    name: userData.name || '',
    email: userData.email || '',
    avatar: userData.avatar,
    createdAt: new Date(),
  };

  switch (role) {
    case 'admin':
      return {
        ...baseUser,
        role: 'admin',
        permissions: ['manage_users', 'manage_courses', 'view_reports', 'system_config'],
      } as Admin;

    case 'instructor':
      return {
        ...baseUser,
        role: 'instructor',
        department: (userData as any).department || 'General',
        courses: [],
      } as Instructor;

    case 'student':
      return {
        ...baseUser,
        role: 'student',
        studentId: (userData as any).studentId || generateStudentId(),
        enrolledCourses: [],
        gpa: 0.0,
      } as Student;

    default:
      throw new Error(`Unknown user role: ${role}`);
  }
}