import React, { useEffect, useState } from 'react';
import { BookOpen, Users, FileText, TrendingUp, Calendar, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DashboardCard } from '../components/Dashboard/DashboardCard';
import { CourseService } from '../services/courseService';

export function Dashboard() {
  const { state } = useApp();
  const { currentUser, courses, assignments, notifications } = state;
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    totalAssignments: 0,
    pendingReviews: 0,
    attendanceRate: '0%',
    gpa: '0.0',
  });

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser, courses, assignments]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    if (currentUser.role === 'student') {
      const enrollments = await CourseService.getStudentEnrollments(currentUser.id);
      setEnrolledCourseIds(enrollments);
    }

    // Calculate stats based on role
    if (currentUser.role === 'instructor') {
      const instructorCourses = courses.filter(c => c.instructorId === currentUser.id);
      const totalStudents = instructorCourses.reduce((acc, course) => acc + course.enrolledStudents.length, 0);
      const instructorAssignments = assignments.filter(a => 
        instructorCourses.some(c => c.id === a.courseId)
      );

      setDashboardStats({
        totalStudents,
        totalAssignments: instructorAssignments.length,
        pendingReviews: Math.floor(Math.random() * 20), // Placeholder
        attendanceRate: '95%', // Placeholder
        gpa: '0.0',
      });
    }
  };

  if (!currentUser) return null;

  const getDashboardData = () => {
    switch (currentUser.role) {
      case 'admin':
        return {
          title: 'Admin Dashboard',
          cards: [
            {
              title: 'Total Courses',
              value: courses.length,
              icon: <BookOpen className="w-6 h-6" />,
              color: 'cyan' as const,
            },
            {
              title: 'Active Users',
              value: '150+', // Placeholder - would need user count from DB
              icon: <Users className="w-6 h-6" />,
              color: 'emerald' as const,
            },
            {
              title: 'Total Assignments',
              value: assignments.length,
              icon: <FileText className="w-6 h-6" />,
              color: 'violet' as const,
            },
            {
              title: 'System Health',
              value: '99.9%',
              icon: <TrendingUp className="w-6 h-6" />,
              color: 'teal' as const,
            },
          ],
        };

      case 'instructor':
        const instructorCourses = courses.filter(c => c.instructorId === currentUser.id);

        return {
          title: 'Instructor Dashboard',
          cards: [
            {
              title: 'My Courses',
              value: instructorCourses.length,
              icon: <BookOpen className="w-6 h-6" />,
              color: 'cyan' as const,
            },
            {
              title: 'Total Students',
              value: dashboardStats.totalStudents,
              icon: <Users className="w-6 h-6" />,
              color: 'emerald' as const,
            },
            {
              title: 'Active Assignments',
              value: dashboardStats.totalAssignments,
              icon: <FileText className="w-6 h-6" />,
              color: 'orange' as const,
            },
            {
              title: 'Pending Reviews',
              value: dashboardStats.pendingReviews,
              icon: <Calendar className="w-6 h-6" />,
              color: 'amber' as const,
            },
          ],
        };

      case 'student':
        const studentAssignments = assignments.filter(a => 
          enrolledCourseIds.includes(a.courseId)
        );

        return {
          title: 'Student Dashboard',
          cards: [
            {
              title: 'Enrolled Courses',
              value: enrolledCourseIds.length,
              icon: <BookOpen className="w-6 h-6" />,
              color: 'cyan' as const,
            },
            {
              title: 'Active Assignments',
              value: studentAssignments.length,
              icon: <FileText className="w-6 h-6" />,
              color: 'violet' as const,
            },
            {
              title: 'Overall GPA',
              value: (currentUser as any).gpa?.toFixed(1) || '0.0',
              icon: <Award className="w-6 h-6" />,
              color: 'emerald' as const,
            },
            {
              title: 'Attendance Rate',
              value: dashboardStats.attendanceRate,
              icon: <Calendar className="w-6 h-6" />,
              color: 'rose' as const,
            },
          ],
        };

      default:
        return { title: 'Dashboard', cards: [] };
    }
  };

  const { title, cards } = getDashboardData();

  return (
    <div className="relative min-h-full">
      {/* Dynamic Dashboard Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/489002669_2012052915988729_1664986985432567737_n.jpg"
          alt="University Campus"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-blue-50/90 to-purple-50/85"></div>
        <div className="absolute inset-0 bg-white/20"></div>
        
        {/* Subtle animated particles */}
        <div className="absolute inset-0 opacity-10">
          <div className="particles-container">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 6}s`,
                  animationDuration: `${6 + Math.random() * 4}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 dark:from-gray-100 via-blue-900 dark:via-blue-400 to-purple-900 dark:to-purple-400 bg-clip-text text-transparent drop-shadow-sm">{title}</h1>
          <p className="text-gray-800 dark:text-gray-200 mt-3 drop-shadow-sm text-lg font-medium">
          Welcome back, {currentUser.name}! Here's what's happening with your courses.
        </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <DashboardCard key={index} {...card} />
        ))}
        </div>

      {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border-2 border-white/30 dark:border-gray-700/30 p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-6 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full mr-3"></div>
              Recent Notifications
            </h2>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">🔔</span>
                </div>
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl hover:from-gray-100/80 hover:to-white/90 dark:hover:from-gray-600/60 dark:hover:to-gray-500/60 transition-all duration-200 border border-gray-200/50 dark:border-gray-600/50">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{notification.title}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {notification.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full shadow-lg"></div>
                  )}
                </div>
              ))
            )}
          </div>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border-2 border-white/30 dark:border-gray-700/30 p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full mr-3"></div>
              Quick Actions
            </h2>
          <div className="space-y-3">
            {currentUser.role === 'instructor' && (
              <>
                <button className="w-full text-left p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 hover:from-cyan-100 hover:to-blue-100 dark:hover:from-cyan-800/40 dark:hover:to-blue-800/40 rounded-xl transition-all duration-200 border border-cyan-200/50 dark:border-cyan-700/50 hover:border-cyan-300/50 dark:hover:border-cyan-600/50 group">
                  <h3 className="font-semibold text-cyan-900 dark:text-cyan-200 group-hover:text-cyan-800 dark:group-hover:text-cyan-100">Create New Assignment</h3>
                  <p className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">Add a new assignment to your courses</p>
                </button>
                <button className="w-full text-left p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-800/40 dark:hover:to-green-800/40 rounded-xl transition-all duration-200 border border-emerald-200/50 dark:border-emerald-700/50 hover:border-emerald-300/50 dark:hover:border-emerald-600/50 group">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-200 group-hover:text-emerald-800 dark:group-hover:text-emerald-100">Mark Attendance</h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">Record student attendance for today</p>
                </button>
              </>
            )}
            
            {currentUser.role === 'student' && (
              <>
                <button className="w-full text-left p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-800/40 dark:hover:to-purple-800/40 rounded-xl transition-all duration-200 border border-violet-200/50 dark:border-violet-700/50 hover:border-violet-300/50 dark:hover:border-violet-600/50 group">
                  <h3 className="font-semibold text-violet-900 dark:text-violet-200 group-hover:text-violet-800 dark:group-hover:text-violet-100">Browse Courses</h3>
                  <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">Find and enroll in new courses</p>
                </button>
                <button className="w-full text-left p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-800/40 dark:hover:to-amber-800/40 rounded-xl transition-all duration-200 border border-orange-200/50 dark:border-orange-700/50 hover:border-orange-300/50 dark:hover:border-orange-600/50 group">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-200 group-hover:text-orange-800 dark:group-hover:text-orange-100">Submit Assignment</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">Upload your completed assignments</p>
                </button>
              </>
            )}

            {currentUser.role === 'admin' && (
              <>
                <button className="w-full text-left p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 hover:from-indigo-100 hover:to-blue-100 dark:hover:from-indigo-800/40 dark:hover:to-blue-800/40 rounded-xl transition-all duration-200 border border-indigo-200/50 dark:border-indigo-700/50 hover:border-indigo-300/50 dark:hover:border-indigo-600/50 group">
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 group-hover:text-indigo-800 dark:group-hover:text-indigo-100">User Management</h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">Add or manage user accounts</p>
                </button>
                <button className="w-full text-left p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 hover:from-rose-100 hover:to-pink-100 dark:hover:from-rose-800/40 dark:hover:to-pink-800/40 rounded-xl transition-all duration-200 border border-rose-200/50 dark:border-rose-700/50 hover:border-rose-300/50 dark:hover:border-rose-600/50 group">
                  <h3 className="font-semibold text-rose-900 dark:text-rose-200 group-hover:text-rose-800 dark:group-hover:text-rose-100">System Reports</h3>
                  <p className="text-sm text-rose-700 dark:text-rose-300 mt-1">View system analytics and reports</p>
                </button>
              </>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}