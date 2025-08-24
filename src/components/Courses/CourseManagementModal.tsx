import { useState, useEffect } from 'react';
import { 
  X,
  Users, 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CourseService } from '../../services/courseService';
import { AttendanceService } from '../../services/attendanceService';
import { AssignmentService } from '../../services/assignmentService';
import { Course, Assignment } from '../../types';

interface CourseStudent {
  id: string;
  name: string;
  email: string;
  student_id: string;
}

interface CourseManagementModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CourseManagementModal({ courseId, isOpen, onClose }: CourseManagementModalProps) {
  const { state } = useApp();
  const { currentUser } = state;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'assignments' | 'attendance'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && courseId) {
      loadCourseData();
    }
  }, [isOpen, courseId]);

  const loadCourseData = async () => {
    if (!courseId) return;

    setIsLoading(true);
    try {
      // Load course details
      const courseData = await CourseService.getCourseById(courseId);
      setCourse(courseData);

      // Load enrolled students
      try {
        console.log('Loading students for course:', courseId);
        const studentsData = await AttendanceService.getCourseStudents(courseId);
        console.log('Loaded students data:', studentsData);
        setStudents(studentsData);
      } catch (error) {
        console.error('Failed to load students:', error);
        setStudents([]);
      }

      // Load assignments
      try {
        const assignmentsData = await AssignmentService.getAssignments(courseId);
        setAssignments(assignmentsData);
      } catch (error) {
        console.error('Failed to load assignments:', error);
        setAssignments([]);
      }

      // Load attendance dates for history
      try {
        const dates = await AttendanceService.getAttendanceDates(courseId);
        setAttendanceDates(dates);
      } catch (error) {
        console.error('Failed to load attendance dates:', error);
        setAttendanceDates([]);
      }

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
      setAttendanceRecords([]);
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
    const record = attendanceRecords.find(r => r.student_id === studentId);
    return record ? record.status : null;
  };

  const markAllPresent = async () => {
    if (!courseId || !currentUser) return;
    setIsSaving(true);

    try {
      const attendanceData = students.map(student => ({
        studentId: student.id,
        status: 'present' as const
      }));

      await AttendanceService.markAttendance(courseId, selectedDate, attendanceData, currentUser.id);
      await loadAttendance();
    } catch (error) {
      console.error('Failed to mark all present:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const markAllAbsent = async () => {
    if (!courseId || !currentUser) return;
    setIsSaving(true);

    try {
      const attendanceData = students.map(student => ({
        studentId: student.id,
        status: 'absent' as const
      }));

      await AttendanceService.markAttendance(courseId, selectedDate, attendanceData, currentUser.id);
      await loadAttendance();
    } catch (error) {
      console.error('Failed to mark all absent:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const totalStudents = students.length;
    const markedStudents = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const unmarked = totalStudents - markedStudents;

    return {
      totalStudents,
      markedStudents,
      present,
      late,
      absent,
      unmarked,
      attendanceRate: markedStudents > 0 ? ((present + late) / markedStudents * 100).toFixed(1) : '0'
    };
  };

  useEffect(() => {
    if (activeTab === 'attendance' && courseId && isOpen) {
      loadAttendance();
    }
  }, [activeTab, courseId, selectedDate, isOpen]);

  if (!isOpen) return null;

  if (!currentUser || (currentUser.role !== 'instructor' && currentUser.role !== 'admin')) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <p className="text-red-600 mb-4">Access denied. Only instructors can manage courses.</p>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading course data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <p className="text-gray-600 mb-4">Course not found or you don't have permission to view it.</p>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
            <p className="text-gray-600">{course.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Credits</p>
                    <p className="text-2xl font-bold text-gray-900">{course.credits}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
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
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Enrolled Students ({students.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                          {student.student_id || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-600">
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
                <h3 className="text-lg font-semibold text-gray-900">Course Assignments ({assignments.length})</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>New Assignment</span>
                </button>
              </div>

              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{assignment.title}</h4>
                        <p className="text-gray-600 mt-1">{assignment.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          <span>Points: {assignment.maxGrade}</span>
                          <span>Submissions: {assignment.submissions?.length || 0}</span>
                        </div>
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
                <h3 className="text-lg font-semibold text-gray-900">Attendance Management</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowAttendanceHistory(!showAttendanceHistory)}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                    title="View attendance history"
                  >
                    {showAttendanceHistory ? 'Hide History' : 'View History'}
                  </button>
                  <label className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Date:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      title="Select attendance date"
                    />
                  </label>
                </div>
              </div>

              {/* Attendance History */}
              {showAttendanceHistory && (
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Attendance History</h4>
                  <div className="flex flex-wrap gap-2">
                    {attendanceDates.length > 0 ? (
                      attendanceDates.map((date) => (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            selectedDate === date
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {new Date(date).toLocaleDateString()}
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500">No attendance records found for this course.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Attendance Statistics */}
              {(() => {
                const stats = getAttendanceStats();
                return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
                      <div className="text-sm text-blue-600">Total Students</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                      <div className="text-sm text-green-600">Present</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                      <div className="text-sm text-yellow-600">Late</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                      <div className="text-sm text-red-600">Absent</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-600">{stats.attendanceRate}%</div>
                      <div className="text-sm text-gray-600">Attendance Rate</div>
                    </div>
                  </div>
                );
              })()}

              {/* Bulk Actions */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={markAllPresent}
                    disabled={isSaving}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    Mark All Present
                  </button>
                  <button
                    onClick={markAllAbsent}
                    disabled={isSaving}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                  >
                    Mark All Absent
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  {students.length} students enrolled • {attendanceRecords.length} marked for {new Date(selectedDate).toLocaleDateString()}
                </div>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student) => {
                      const status = getAttendanceStatus(student.id);
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{student.name}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                            {student.student_id || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                            {student.email}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => markAttendance(student.id, 'present')}
                                disabled={isSaving}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  status === 'present'
                                    ? 'bg-green-100 text-green-600'
                                    : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                                }`}
                                title="Mark Present"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => markAttendance(student.id, 'late')}
                                disabled={isSaving}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  status === 'late'
                                    ? 'bg-yellow-100 text-yellow-600'
                                    : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'
                                }`}
                                title="Mark Late"
                              >
                                <Clock className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => markAttendance(student.id, 'absent')}
                                disabled={isSaving}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  status === 'absent'
                                    ? 'bg-red-100 text-red-600'
                                    : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                                }`}
                                title="Mark Absent"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                              {status && (
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  status === 'present' 
                                    ? 'bg-green-100 text-green-800'
                                    : status === 'late'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {status.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {students.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No students enrolled in this course yet.</p>
                  </div>
                )}
              </div>

              {/* Save Confirmation */}
              {isSaving && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-blue-700">Saving attendance...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
