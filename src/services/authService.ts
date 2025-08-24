import { supabase } from '../lib/supabase';
import { User } from '../types';

export class AuthService {
  static async signUp(email: string, password: string, userData: {
    name: string;
    role: 'admin' | 'instructor' | 'student';
    department?: string;
    studentId?: string;
  }) {
    console.log('Starting signup for:', email, 'role:', userData.role);
    
    // Sign up with metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
          department: userData.department,
          student_id: userData.studentId,
        }
      }
    });

    if (error) {
      console.error('Signup error from Supabase:', error);
      
      // Handle specific Supabase errors
      const message = error.message;
      if (message.includes('User already registered') || message.includes('user_already_exists')) {
        return { data: null, error: new Error('An account with this email already exists. Please sign in instead.') };
      }
      if (message.includes('Invalid email')) {
        return { data: null, error: new Error('Please enter a valid email address.') };
      }
      if (message.includes('Password')) {
        return { data: null, error: new Error('Password must be at least 6 characters long.') };
      }
      
      return { data: null, error: new Error(error.message) };
    }

    console.log('Signup successful:', data.user?.email);
    return { data, error: null };
  }

  static async signIn(email: string, password: string) {
    console.log('Starting signin for:', email);
    
    // Check for demo credentials first
    const demoUser = this.getDemoUser(email, password);
    if (demoUser) {
      console.log('Using demo authentication for:', email);
      // Store demo user in localStorage for persistence
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      return { data: { user: { id: demoUser.id, email: demoUser.email } }, error: null };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Signin error from Supabase:', error);
      
      // Handle specific Supabase errors
      const message = error.message;
      if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
        return { data: null, error: new Error('Invalid email or password. Please check your credentials and try again.') };
      }
      if (message.includes('Email not confirmed')) {
        return { data: null, error: new Error('Please check your email and click the confirmation link before signing in.') };
      }
      if (message.includes('Too many requests')) {
        return { data: null, error: new Error('Too many sign-in attempts. Please wait a moment and try again.') };
      }
      
      return { data: null, error: new Error(error.message) };
    }

    console.log('Signin successful:', data.user?.email);
    return { data, error: null };
  }

  static async signOut() {
    try {
      console.log('Signing out...');
      
      // Clear demo user if exists
      localStorage.removeItem('demo_user');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
      } else {
        console.log('Signout successful');
      }
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  }

  private static getDemoUser(email: string, password: string): User | null {
    if (password !== 'password123') return null;
    
    const demoUsers = {
      'sarah.johnson@university.edu': {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        role: 'instructor' as const,
        department: 'Computer Science',
        courses: [],
        avatar: undefined,
        createdAt: new Date(),
      },
      'john.smith@student.edu': {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'John Smith',
        email: 'john.smith@student.edu',
        role: 'student' as const,
        studentId: 'STU001',
        enrolledCourses: [],
        gpa: 3.75,
        avatar: undefined,
        createdAt: new Date(),
      },
      'admin@university.edu': {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'System Administrator',
        email: 'admin@university.edu',
        role: 'admin' as const,
        permissions: ['user_management', 'course_management', 'system_settings'],
        avatar: undefined,
        createdAt: new Date(),
      }
    };
    
    return (demoUsers as Record<string, User>)[email] || null;
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      console.log('Getting current user...');
      
      // Check for demo user first
      const demoUserData = localStorage.getItem('demo_user');
      if (demoUserData) {
        const demoUser = JSON.parse(demoUserData);
        console.log('Returning demo user:', demoUser.name);
        return demoUser;
      }
      
      // Get the current session first
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return null;
      }
      
      if (!session?.session?.user) {
        console.log('No active session found');
        return null;
      }

      const user = session.session.user;
      console.log('Found authenticated user:', user.id, user.email);

      // Try to get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        
        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');
          
          const profileData = {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: (user.user_metadata?.role as any) || 'student',
            department: user.user_metadata?.department || null,
            student_id: user.user_metadata?.student_id || null,
          };

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            // Return a basic user object even if profile creation fails
            return this.createBasicUser(user);
          }
          
          console.log('Profile created successfully:', newProfile.name);
          return this.mapProfileToUser(newProfile, user);
        }
        
        // For other errors, return a basic user
        console.warn('Using basic user due to profile error');
        return this.createBasicUser(user);
      }

      console.log('Profile found:', profile.name, profile.role);
      return this.mapProfileToUser(profile, user);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  private static createBasicUser(user: any): User {
    return {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      role: (user.user_metadata?.role as any) || 'student',
      avatar: user.user_metadata?.avatar_url,
      createdAt: new Date(user.created_at),
    };
  }

  private static mapProfileToUser(profile: any, user: any): User {
    const baseUser = {
      id: profile.id,
      name: profile.name,
      email: user.email || '',
      role: profile.role,
      avatar: profile.avatar_url,
      createdAt: new Date(profile.created_at),
    };

    // Add role-specific properties
    switch (profile.role) {
      case 'admin':
        return {
          ...baseUser,
          permissions: profile.permissions || [],
        } as User;
      case 'instructor':
        return {
          ...baseUser,
          department: profile.department || 'General',
          courses: [], // Will be populated separately
        } as User;
      case 'student':
        return {
          ...baseUser,
          studentId: profile.student_id || '',
          enrolledCourses: [], // Will be populated separately
          gpa: profile.gpa || 0.0,
        } as User;
      default:
        return baseUser as User;
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, 'has session:', !!session);
      
      if (session?.user) {
        // Small delay to ensure profile is created
        setTimeout(async () => {
          const user = await this.getCurrentUser();
          console.log('Auth state change - user retrieved:', user?.name || 'none');
          callback(user);
        }, 100);
      } else {
        console.log('Auth state change - no session, user logged out');
        callback(null);
      }
    });
  }
}