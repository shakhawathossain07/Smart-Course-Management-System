import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock,
  Plus,
  Edit
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CourseService } from '../services/courseService';
import { AttendanceService } from '../services/attendanceService';
import { AssignmentService } from '../services/assignmentService';
import { Course, Assignment, AttendanceRecord } from '../types';

interface CourseStudent {
  id: string;
  name: string;
  email: string;
  student_id: string;
}

interface CourseManagementProps {
  courseId: string;
  onClose: () => void;
}

export function CourseManagement({ courseId, onClose }: CourseManagementProps) {
  const { state } = useApp();
  const { currentUser } = state;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'assignments' | 'attendance'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  useEffect(() => {
    if (activeTab === 'attendance' && courseId) {
      loadAttendance();
    }
  }, [activeTab, courseId, selectedDate]);

  const loadCourseData = async () => {
    if (!courseId) return;

    setIsLoading(true);
    try {
      // Load course details
      const courseData = await CourseService.getCourseById(courseId);
      setCourse(courseData);

      // Load enrolled students
      const studentsData = await AttendanceService.getCourseStudents(courseId);
      setStudents(studentsData);

      // Load assignments
      const assignmentsData = await AssignmentService.getAssignments(courseId);
      setAssignments(assignmentsData);

    } catch (error) {
      console.error('Failed to load course data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!courseId) return;

    try {
      const records = await AttendanceService.getAttendanceRecords(courseId, selectedDate);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!courseId || !currentUser) return;

    try {
      await AttendanceService.markSingleAttendance(
        courseId,
        studentId,
        selectedDate,
        status,
        currentUser.id
      );
      await loadAttendance();
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    }
  };

  const getAttendanceStatus = (studentId: string): 'present' | 'absent' | 'late' | null => {
    const record = attendanceRecords.find(r => r.studentId === studentId);
    return record ? record.status : null;
  };

  if (!currentUser || (currentUser.role !== 'instructor' && currentUser.role !== 'admin')) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Access denied. Only instructors can manage courses.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course data...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Course not found or you don't have permission to view it.</p>
        <button
          onClick={onClose}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BookOpen },
    { id: 'students', name: 'Students', icon: Users },
    { id: 'assignments', name: 'Assignments', icon: BookOpen },
    { id: 'attendance', name: 'Attendance', icon: Calendar },
  ] as const;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/courses')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600">{course.description}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credits</p>
                <p className="text-2xl font-bold text-gray-900">{course.credits}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="text-lg font-semibold text-gray-900">{course.category}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Enrolled Students</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {student.student_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {student.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No students enrolled yet.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Course Assignments</h2>
            <button
              onClick={() => navigate(`/courses/${courseId}/assignments/new`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Assignment</span>
            </button>
          </div>

          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                    <p className="text-gray-600 mt-1">{assignment.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span>Points: {assignment.maxGrade}</span>
                      <span>Submissions: {assignment.submissions?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/assignments/${assignment.id}/edit`)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No assignments created yet.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Attendance Management</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => {
                    const status = getAttendanceStatus(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => markAttendance(student.id, 'present')}
                              className={`p-2 rounded-lg transition-colors ${
                                status === 'present'
                                  ? 'bg-green-100 text-green-600'
                                  : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                              }`}
                              title="Present"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => markAttendance(student.id, 'late')}
                              className={`p-2 rounded-lg transition-colors ${
                                status === 'late'
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'
                              }`}
                              title="Late"
                            >
                              <Clock className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => markAttendance(student.id, 'absent')}
                              className={`p-2 rounded-lg transition-colors ${
                                status === 'absent'
                                  ? 'bg-red-100 text-red-600'
                                  : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                              }`}
                              title="Absent"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No students enrolled yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
