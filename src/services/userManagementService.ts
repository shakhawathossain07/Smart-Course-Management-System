import { supabase } from '../lib/supabase';
import { User } from '../types';

export interface CreateUserData {
  name: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  password: string;
  student_id?: string;
  department?: string;
  avatar_url?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'instructor' | 'student';
  student_id?: string;
  department?: string;
  avatar_url?: string;
  is_active?: boolean;
}

export interface UserWithStats extends User {
  enrollmentCount?: number;
  courseCount?: number;
  assignmentCount?: number;
  lastLoginAt?: Date;
  createdAt: Date;
}

export class UserManagementService {
  /**
   * Get all users with optional filtering and pagination
   */
  static async getUsers(options?: {
    role?: string;
    searchTerm?: string;
    limit?: number;
    offset?: number;
    includeStats?: boolean;
  }): Promise<{ users: UserWithStats[]; total: number }> {
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (options?.role && options.role !== 'all') {
        query = query.eq('role', options.role);
      }

      if (options?.searchTerm) {
        query = query.or(`name.ilike.%${options.searchTerm}%,email.ilike.%${options.searchTerm}%`);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      let users: UserWithStats[] = data || [];

      // Add stats if requested
      if (options?.includeStats) {
        users = await this.addUserStats(users);
      }

      return { users, total: count || 0 };
    } catch (error) {
      console.error('Failed to get users:', error);
      throw error;
    }
  }

  /**
   * Get a single user by ID
   */
  static async getUser(userId: string): Promise<UserWithStats | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) return null;

      // Add stats
      const [userWithStats] = await this.addUserStats([data]);
      return userWithStats;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        throw new Error('A user with this email already exists');
      }

      // Create user account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create user profile
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          student_id: userData.student_id,
          department: userData.department,
          avatar_url: userData.avatar_url,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, updateData: UpdateUserData): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  /**
   * Delete/Deactivate a user
   */
  static async deleteUser(userId: string, softDelete: boolean = true): Promise<boolean> {
    try {
      if (softDelete) {
        // Soft delete: just deactivate the user
        await this.updateUser(userId, { is_active: false });
      } else {
        // Hard delete: remove from database and auth
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', userId);

        if (deleteError) throw deleteError;

        // Note: Supabase auth user deletion requires admin privileges
        // This would typically be done via a server-side function
      }

      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  /**
   * Bulk update users
   */
  static async bulkUpdateUsers(
    userUpdates: Array<{ userId: string; updateData: UpdateUserData }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const update of userUpdates) {
      try {
        await this.updateUser(update.userId, update.updateData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to update user ${update.userId}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Import users from CSV data
   */
  static async importUsers(
    csvData: Array<CreateUserData>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const userData of csvData) {
      try {
        await this.createUser(userData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import user ${userData.email}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Get user activity stats
   */
  static async getUserActivity(userId: string, days: number = 30): Promise<{
    logins: number;
    assignmentsSubmitted: number;
    coursesAccessed: number;
    lastActivity: Date | null;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // This would require an activity_logs table in a real implementation
      // For now, return mock data
      return {
        logins: 15,
        assignmentsSubmitted: 5,
        coursesAccessed: 3,
        lastActivity: new Date()
      };
    } catch (error) {
      console.error('Failed to get user activity:', error);
      throw error;
    }
  }

  /**
   * Reset user password
   */
  static async resetUserPassword(email: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to reset password:', error);
      throw error;
    }
  }

  /**
   * Get enrollment statistics for a student
   */
  static async getStudentEnrollments(studentId: string): Promise<Array<{
    courseId: string;
    courseName: string;
    enrollmentDate: Date;
    status: string;
    progress: number;
    grade?: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses!enrollments_course_id_fkey(
            id,
            title,
            code
          )
        `)
        .eq('student_id', studentId);

      if (error) throw error;

      return (data || []).map(enrollment => ({
        courseId: enrollment.course_id,
        courseName: (enrollment.course as any)?.title || 'Unknown Course',
        enrollmentDate: new Date(enrollment.created_at),
        status: enrollment.status,
        progress: enrollment.progress || 0,
        grade: enrollment.final_grade
      }));
    } catch (error) {
      console.error('Failed to get student enrollments:', error);
      throw error;
    }
  }

  /**
   * Get instructor course assignments
   */
  static async getInstructorCourses(instructorId: string): Promise<Array<{
    courseId: string;
    courseName: string;
    studentCount: number;
    assignmentCount: number;
    avgGrade: number;
  }>> {
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          enrollments:enrollments!enrollments_course_id_fkey(count),
          assignments:assignments!assignments_course_id_fkey(count)
        `)
        .eq('instructor_id', instructorId);

      if (error) throw error;

      return (courses || []).map(course => ({
        courseId: course.id,
        courseName: course.title,
        studentCount: (course.enrollments as any)[0]?.count || 0,
        assignmentCount: (course.assignments as any)[0]?.count || 0,
        avgGrade: 85 // This would require actual calculation from submissions
      }));
    } catch (error) {
      console.error('Failed to get instructor courses:', error);
      throw error;
    }
  }

  /**
   * Export users to CSV
   */
  static async exportUsers(filters?: {
    role?: string;
    searchTerm?: string;
  }): Promise<string> {
    try {
      const { users } = await this.getUsers({ ...filters, limit: 1000 });
      
      // Create CSV headers
      const headers = [
        'ID', 'Name', 'Email', 'Role', 'Student ID', 
        'Department', 'Active', 'Created At', 'Last Updated'
      ];
      
      // Create CSV rows
      const rows = users.map(user => [
        user.id,
        user.name,
        user.email,
        user.role,
        (user as any).student_id || '',
        (user as any).department || '',
        (user as any).is_active ? 'Yes' : 'No',
        user.createdAt.toLocaleDateString(),
        new Date().toLocaleDateString()
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Failed to export users:', error);
      throw error;
    }
  }

  /**
   * Add statistics to users
   */
  private static async addUserStats(users: User[]): Promise<UserWithStats[]> {
    // This would require more complex queries in a real implementation
    // For now, return users with mock stats
    return users.map(user => ({
      ...user,
      enrollmentCount: user.role === 'student' ? Math.floor(Math.random() * 5) + 1 : 0,
      courseCount: user.role === 'instructor' ? Math.floor(Math.random() * 3) + 1 : 0,
      assignmentCount: user.role === 'student' ? Math.floor(Math.random() * 10) + 1 : 0,
      lastLoginAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    }));
  }

  /**
   * Validate user data
   */
  static validateUserData(userData: CreateUserData | UpdateUserData): string[] {
    const errors: string[] = [];

    if ('name' in userData && (!userData.name || userData.name.trim().length < 2)) {
      errors.push('Name must be at least 2 characters long');
    }

    if ('email' in userData && (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email))) {
      errors.push('Please provide a valid email address');
    }

    if ('password' in userData && (!userData.password || userData.password.length < 8)) {
      errors.push('Password must be at least 8 characters long');
    }

    if ('role' in userData && userData.role && !['admin', 'instructor', 'student'].includes(userData.role)) {
      errors.push('Role must be admin, instructor, or student');
    }

    return errors;
  }
}
