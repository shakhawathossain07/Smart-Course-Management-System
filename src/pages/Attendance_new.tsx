import { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AttendanceRecord } from '../types';
import { AttendanceService } from '../services/attendanceService';

export function Attendance() {
  const { state } = useApp();
  const { currentUser, courses } = state;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [courseStudents, setCourseStudents] = useState<Array<{
    id: string;
    name: string;
    email: string;
    student_id: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    presentPercentage: 0,
    attendanceRate: 0,
  });

  const loadAttendanceRecords = async () => {
    if (!selectedCourse || !currentUser) return;
    
    setIsLoading(true);
    try {
      const records = await AttendanceService.getAttendanceRecords(selectedCourse, selectedDate);
      setAttendanceRecords(records);
      
      const stats = await AttendanceService.getAttendanceStats(selectedCourse);
      setAttendanceStats(stats);
      
      if (currentUser.role === 'instructor') {
        const students = await AttendanceService.getCourseStudents(selectedCourse);
        setCourseStudents(students);
      }
    } catch (error) {
      console.error('Failed to load attendance records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentAttendance = async () => {
    if (!currentUser || currentUser.role !== 'student') return;
    
    setIsLoading(true);
    try {
      const records = await AttendanceService.getStudentAttendance(currentUser.id);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Failed to load student attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'instructor' && selectedCourse) {
      loadAttendanceRecords();
    } else if (currentUser?.role === 'student') {
      loadStudentAttendance();
    }
  }, [currentUser, selectedCourse, selectedDate]);

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!currentUser || !selectedCourse) return;

    try {
      await AttendanceService.markSingleAttendance(
        selectedCourse,
        studentId,
        selectedDate,
        status,
        currentUser.id
      );
      
      // Reload attendance records to get updated data
      await loadAttendanceRecords();
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    }
  };

  const getInstructorCourses = () => {
    if (currentUser?.role === 'instructor') {
      return courses.filter(course => course.instructorId === currentUser.id);
    }
    return [];
  };

  const getAttendanceForDate = (studentId: string) => {
    return attendanceRecords.find(record => 
      record.studentId === studentId && 
      new Date(record.date).toDateString() === new Date(selectedDate).toDateString()
    );
  };

  const stats = attendanceStats;
  const instructorCourses = getInstructorCourses();

  if (!currentUser) return null;

  return (
    <div className="relative min-h-full">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/489002669_2012052915988729_1664986985432567737_n.jpg"
          alt="University Campus"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-blue-50/90 to-purple-50/85"></div>
        <div className="absolute inset-0 bg-white/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
            {currentUser.role === 'student' ? 'My Attendance' : 'Attendance Management'}
          </h1>
          <p className="text-gray-700 mt-2">
            {currentUser.role === 'student' 
              ? 'View your attendance records across all courses'
              : 'Mark and manage student attendance for your courses'
            }
          </p>
        </div>

        {/* Controls */}
        {currentUser.role === 'instructor' && (
          <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 p-6 mb-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course
                </label>
                <select
                  id="course-select"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Select course for attendance"
                >
                  <option value="">Choose a course</option>
                  {instructorCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  id="date-select"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Select date for attendance"
                />
              </div>

              <div>
                <label htmlFor="search-students" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Students
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="search-students"
                    type="text"
                    placeholder="Search by name or student ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    title="Search students by name or ID"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Late</p>
                <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance List */}
        {currentUser.role === 'instructor' && selectedCourse && (
          <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Student Attendance - {new Date(selectedDate).toLocaleDateString()}
              </h2>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading attendance...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {courseStudents
                  .filter(student => 
                    !searchTerm || 
                    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((student) => {
                    const record = getAttendanceForDate(student.id);
                    const status = record?.status || 'present';
                    
                    return (
                      <div key={student.id} className="p-4 hover:bg-gray-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={`https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150`}
                              alt={student.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <h3 className="font-medium text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-500">Student ID: {student.student_id}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => markAttendance(student.id, 'present')}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                status === 'present'
                                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => markAttendance(student.id, 'late')}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                status === 'late'
                                  ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-yellow-50 hover:text-yellow-700'
                              }`}
                            >
                              Late
                            </button>
                            <button
                              onClick={() => markAttendance(student.id, 'absent')}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                status === 'absent'
                                  ? 'bg-red-100 text-red-800 border-2 border-red-300'
                                  : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {courseStudents.length === 0 && !isLoading && (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No students enrolled</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Students need to enroll in this course to mark attendance.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Student View */}
        {currentUser.role === 'student' && (
          <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your Attendance Records</h2>
            </div>
            
            <div className="p-6">
              {attendanceRecords.length > 0 ? (
                <div className="space-y-4">
                  {attendanceRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          record.status === 'present' ? 'bg-green-500' :
                          record.status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">Course Name</p>
                          <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your instructor will mark attendance, and it will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
