import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Course, Assignment, AttendanceRecord, Notification } from '../types';
import { AuthService } from '../services/authService';
import { CourseService } from '../services/courseService';
import { AssignmentService } from '../services/assignmentService';
import { NotificationService } from '../services/notificationService';
import { supabase } from '../lib/supabase';

interface AppState {
  currentUser: User | null;
  courses: Course[];
  assignments: Assignment[];
  attendanceRecords: AttendanceRecord[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  theme: 'light' | 'dark';
}

type AppAction =
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_COURSES'; payload: Course[] }
  | { type: 'ADD_COURSE'; payload: Course }
  | { type: 'UPDATE_COURSE'; payload: Course }
  | { type: 'SET_ASSIGNMENTS'; payload: Assignment[] }
  | { type: 'ADD_ASSIGNMENT'; payload: Assignment }
  | { type: 'UPDATE_ASSIGNMENT'; payload: Assignment }
  | { type: 'SET_ATTENDANCE_RECORDS'; payload: AttendanceRecord[] }
  | { type: 'ADD_ATTENDANCE_RECORDS'; payload: AttendanceRecord[] }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' };

const initialState: AppState = {
  currentUser: null,
  courses: [],
  assignments: [],
  attendanceRecords: [],
  notifications: [],
  isLoading: true,
  error: null,
  isInitialized: false,
  theme: 'light',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_COURSES':
      return { ...state, courses: action.payload };
    case 'ADD_COURSE':
      return { ...state, courses: [...state.courses, action.payload] };
    case 'UPDATE_COURSE':
      return {
        ...state,
        courses: state.courses.map(course =>
          course.id === action.payload.id ? action.payload : course
        ),
      };
    case 'SET_ASSIGNMENTS':
      return { ...state, assignments: action.payload };
    case 'ADD_ASSIGNMENT':
      return { ...state, assignments: [...state.assignments, action.payload] };
    case 'UPDATE_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map(assignment =>
          assignment.id === action.payload.id ? action.payload : assignment
        ),
      };
    case 'SET_ATTENDANCE_RECORDS':
      return { ...state, attendanceRecords: action.payload };
    case 'ADD_ATTENDANCE_RECORDS':
      return { ...state, attendanceRecords: [...state.attendanceRecords, ...action.payload] };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload ? { ...notification, read: true } : notification
        ),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    loadCourses: () => Promise<void>;
    loadAssignments: (courseId?: string) => Promise<void>;
    loadNotifications: () => Promise<void>;
    enrollInCourse: (courseId: string) => Promise<boolean>;
    createCourse: (courseData: any) => Promise<boolean>;
    createAssignment: (assignmentData: any) => Promise<boolean>;
    loadStudentEnrollments: () => Promise<string[]>;
    toggleTheme: () => void;
  };
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!state.currentUser) return;

    console.log('Setting up real-time subscriptions for user:', state.currentUser.name);

    // Subscribe to courses changes
    const coursesChannel = supabase
      .channel('courses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses'
        },
        (payload) => {
          console.log('Courses real-time change:', payload);
          // Reload courses when changes occur
          loadCourses();
        }
      )
      .subscribe();

    // Subscribe to notifications changes for this user
    const notificationsChannel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${state.currentUser.id}`
        },
        (payload) => {
          console.log('Notifications real-time change:', payload);
          // Reload notifications when changes occur
          loadNotifications();
        }
      )
      .subscribe();

    // Subscribe to enrollments if user is a student
    let enrollmentsChannel: any = null;
    if (state.currentUser.role === 'student') {
      enrollmentsChannel = supabase
        .channel('enrollments_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'enrollments',
            filter: `student_id=eq.${state.currentUser.id}`
          },
          (payload) => {
            console.log('Enrollments real-time change:', payload);
            // Reload courses to update enrollment status
            loadCourses();
          }
        )
        .subscribe();
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(coursesChannel);
      supabase.removeChannel(notificationsChannel);
      if (enrollmentsChannel) {
        supabase.removeChannel(enrollmentsChannel);
      }
    };
  }, [state.currentUser?.id]);

  // Load courses from database
  const loadCourses = async () => {
    try {
      console.log('Loading courses...');
      let courses;
      
      if (state.currentUser?.role === 'instructor') {
        // Load only courses taught by this instructor
        courses = await CourseService.getCoursesByInstructor(state.currentUser.id);
        console.log('Instructor courses loaded:', courses.length);
      } else {
        // Load all courses for admins and students
        courses = await CourseService.getAllCourses();
        console.log('All courses loaded:', courses.length);
      }
      
      dispatch({ type: 'SET_COURSES', payload: courses });
    } catch (error) {
      console.error('Failed to load courses:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load courses' });
    }
  };

  // Load assignments from database
  const loadAssignments = async (courseId?: string) => {
    try {
      console.log('Loading assignments...');
      if (courseId) {
        const assignments = await AssignmentService.getAssignmentsByCourse(courseId);
        dispatch({ type: 'SET_ASSIGNMENTS', payload: assignments });
      } else if (state.currentUser?.role === 'student') {
        // Load assignments for all enrolled courses
        const enrollments = await CourseService.getStudentEnrollments(state.currentUser.id);
        const allAssignments: Assignment[] = [];
        for (const courseId of enrollments) {
          const assignments = await AssignmentService.getAssignmentsByCourse(courseId);
          allAssignments.push(...assignments);
        }
        dispatch({ type: 'SET_ASSIGNMENTS', payload: allAssignments });
      }
      console.log('Assignments loaded');
    } catch (error) {
      console.error('Failed to load assignments:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load assignments' });
    }
  };

  // Load notifications from database
  const loadNotifications = async () => {
    if (!state.currentUser) return;
    
    try {
      console.log('Loading notifications...');
      const notifications = await NotificationService.getUserNotifications(state.currentUser.id);
      console.log('Notifications loaded:', notifications.length);
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
    } catch (error) {
      console.error('Failed to load notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load notifications' });
    }
  };

  // Enroll in course
  const enrollInCourse = async (courseId: string): Promise<boolean> => {
    if (!state.currentUser || state.currentUser.role !== 'student') return false;

    try {
      const success = await CourseService.enrollStudent(state.currentUser.id, courseId);
      if (success) {
        await loadCourses(); // Refresh courses to show updated enrollment
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to enroll in course:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to enroll in course' });
      return false;
    }
  };

  // Create course
  const createCourse = async (courseData: any): Promise<boolean> => {
    if (!state.currentUser || (state.currentUser.role !== 'instructor' && state.currentUser.role !== 'admin')) {
      return false;
    }

    try {
      const course = await CourseService.createCourse({
        ...courseData,
        instructorId: state.currentUser.id,
      });
      
      if (course) {
        dispatch({ type: 'ADD_COURSE', payload: course });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create course:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create course' });
      return false;
    }
  };

  // Create assignment
  const createAssignment = async (assignmentData: any): Promise<boolean> => {
    if (!state.currentUser || (state.currentUser.role !== 'instructor' && state.currentUser.role !== 'admin')) return false;

    try {
      const assignment = await AssignmentService.createAssignment(assignmentData);
      if (assignment) {
        dispatch({ type: 'ADD_ASSIGNMENT', payload: assignment });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create assignment:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create assignment' });
      return false;
    }
  };

  // Load student enrollments
  const loadStudentEnrollments = async (): Promise<string[]> => {
    if (!state.currentUser || state.currentUser.role !== 'student') return [];

    try {
      const enrollments = await CourseService.getStudentEnrollments(state.currentUser.id);
      return enrollments;
    } catch (error) {
      console.error('Failed to load student enrollments:', error);
      return [];
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('scms-theme') as 'light' | 'dark' | null;
    if (savedTheme && mounted) {
      dispatch({ type: 'SET_THEME', payload: savedTheme });
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
    const initAuth = async () => {
      try {
        console.log('Initializing auth...');
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        // Get current user
        const user = await AuthService.getCurrentUser();
        
        if (mounted) {
          console.log('Auth initialized, user:', user?.name || 'none');
          dispatch({ type: 'SET_CURRENT_USER', payload: user });
          dispatch({ type: 'SET_INITIALIZED', payload: true });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize authentication' });
          dispatch({ type: 'SET_INITIALIZED', payload: true });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      if (mounted) {
        console.log('Auth state change callback:', user?.name || 'logged out');
        dispatch({ type: 'SET_CURRENT_USER', payload: user });
        dispatch({ type: 'SET_ERROR', payload: null }); // Clear any auth errors
        dispatch({ type: 'SET_LOADING', payload: false }); // Always clear loading
        
        if (!user) {
          // Clear data when user logs out
          dispatch({ type: 'SET_COURSES', payload: [] });
          dispatch({ type: 'SET_ASSIGNMENTS', payload: [] });
          dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Load data when user changes
  useEffect(() => {
    if (state.currentUser && state.isInitialized) {
      console.log('Loading initial data for user:', state.currentUser.name);
      
      const loadData = async () => {
        try {
          // Load courses first
          await loadCourses();
          
          // Then load notifications
          await loadNotifications();
          
          // Load assignments for students
          if (state.currentUser?.role === 'student') {
            await loadAssignments();
          }
          
          console.log('Initial data loading complete');
        } catch (error) {
          console.error('Failed to load initial data:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to load some data' });
        }
      };

      loadData();
    }
  }, [state.currentUser, state.isInitialized]);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: 'SET_THEME', payload: newTheme });
    localStorage.setItem('scms-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  const actions = {
    loadCourses,
    loadAssignments,
    loadNotifications,
    enrollInCourse,
    createCourse,
    createAssignment,
    loadStudentEnrollments,
    toggleTheme,
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}
// Components observe state changes
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}