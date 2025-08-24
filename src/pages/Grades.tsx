import { useState, useEffect } from 'react';
import { Award, TrendingUp, BarChart3, BookOpen, Filter, Download, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AssignmentService } from '../services/assignmentService';
import { Assignment, AssignmentSubmission } from '../types';

interface GradeRecord {
  id: string;
  courseName: string;
  assignmentName: string;
  grade: number;
  maxGrade: number;
  submittedAt: Date;
  gradedAt?: Date;
  feedback?: string;
  status: string;
}

export function Grades() {
  const { state } = useApp();
  const { currentUser, courses } = state;
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gradingMode, setGradingMode] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, selectedCourse]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (currentUser?.role === 'student') {
        await loadStudentGrades();
      } else if (currentUser?.role === 'instructor') {
        await loadInstructorData();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentGrades = async () => {
    try {
      const studentAssignments = await AssignmentService.getStudentAssignments(currentUser!.id);
      
      const gradeRecords: GradeRecord[] = [];
      for (const assignment of studentAssignments) {
        if (assignment.submission && assignment.submission.grade !== undefined) {
          gradeRecords.push({
            id: assignment.submission.id,
            courseName: (assignment as any).course?.title || 'Unknown Course',
            assignmentName: assignment.title,
            grade: assignment.submission.grade,
            maxGrade: assignment.totalPoints,
            submittedAt: new Date(assignment.submission.submittedAt),
            gradedAt: assignment.submission.gradedAt ? new Date(assignment.submission.gradedAt) : undefined,
            feedback: assignment.submission.feedback,
            status: assignment.submission.status || 'submitted'
          });
        }
      }
      
      setGrades(gradeRecords);
    } catch (error) {
      console.error('Failed to load student grades:', error);
    }
  };

  const loadInstructorData = async () => {
    try {
      let instructorAssignments: Assignment[];
      
      if (selectedCourse === 'all') {
        // Get assignments for all instructor's courses
        const instructorCourses = courses.filter(course => course.instructorId === currentUser!.id);
        const allAssignments = await Promise.all(
          instructorCourses.map(course => AssignmentService.getAssignments(course.id))
        );
        instructorAssignments = allAssignments.flat();
      } else {
        instructorAssignments = await AssignmentService.getAssignments(selectedCourse);
      }
      
      setAssignments(instructorAssignments);
    } catch (error) {
      console.error('Failed to load instructor data:', error);
    }
  };

  const loadSubmissions = async (assignment: Assignment) => {
    try {
      const assignmentSubmissions = await AssignmentService.getSubmissions(assignment.id);
      setSubmissions(assignmentSubmissions);
      setSelectedAssignment(assignment);
      setGradingMode(true);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !gradeInput) return;

    try {
      const grade = parseFloat(gradeInput);
      await AssignmentService.gradeSubmission(
        selectedSubmission.id,
        {
          grade,
          feedback: feedbackInput
        },
        currentUser!.id
      );

      // Refresh submissions
      if (selectedAssignment) {
        await loadSubmissions(selectedAssignment);
      }
      
      // Clear form
      setSelectedSubmission(null);
      setGradeInput('');
      setFeedbackInput('');
    } catch (error) {
      console.error('Failed to grade submission:', error);
    }
  };

  const exportGrades = async (assignmentId: string) => {
    try {
      const csvContent = await AssignmentService.exportGrades(assignmentId);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assignment_grades_${assignmentId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export grades:', error);
    }
  };

  const calculateGPA = () => {
    if (grades.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    grades.forEach(grade => {
      const percentage = (grade.grade / grade.maxGrade) * 100;
      let gradePoints = 0;
      
      if (percentage >= 97) gradePoints = 4.0;
      else if (percentage >= 93) gradePoints = 3.7;
      else if (percentage >= 90) gradePoints = 3.3;
      else if (percentage >= 87) gradePoints = 3.0;
      else if (percentage >= 83) gradePoints = 2.7;
      else if (percentage >= 80) gradePoints = 2.3;
      else if (percentage >= 77) gradePoints = 2.0;
      else if (percentage >= 73) gradePoints = 1.7;
      else if (percentage >= 70) gradePoints = 1.3;
      else if (percentage >= 67) gradePoints = 1.0;
      else if (percentage >= 65) gradePoints = 0.7;
      else gradePoints = 0.0;
      
      totalPoints += gradePoints * 3; // Assuming 3 credits per course
      totalCredits += 3;
    });
    
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  };

  const getInstructorCourses = () => {
    return courses.filter(course => course.instructorId === currentUser?.id);
  };

  if (!currentUser) return null;

  return (
    <div className="relative min-h-full">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/486202300_3019165758287838_1859167207686254465_n.jpg"
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
            {currentUser.role === 'student' ? 'My Grades' : 'Grade Management'}
          </h1>
          <p className="text-gray-700 mt-2">
            {currentUser.role === 'student' 
              ? 'View your academic performance and grades'
              : 'Manage and grade student assignments'
            }
          </p>
        </div>

        {/* Student View */}
        {currentUser.role === 'student' && (
          <>
            {/* GPA Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
                <div className="flex items-center">
                  <Award className="w-8 h-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Current GPA</p>
                    <p className="text-2xl font-bold text-gray-900">{calculateGPA().toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
                <div className="flex items-center">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Average Grade</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {grades.length > 0 
                        ? (grades.reduce((sum, g) => sum + (g.grade / g.maxGrade) * 100, 0) / grades.length).toFixed(1)
                        : '0'
                      }%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
                <div className="flex items-center">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Graded</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {grades.filter(g => g.grade !== undefined).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grades List */}
            <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Grades</h2>
              </div>
              
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading grades...</p>
                </div>
              ) : grades.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {grades.map((grade) => (
                    <div key={grade.id} className="p-4 hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{grade.assignmentName}</h3>
                          <p className="text-sm text-gray-500">{grade.courseName}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Graded on {grade.gradedAt?.toLocaleDateString() || 'Pending'}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              (grade.grade / grade.maxGrade) >= 0.9 ? 'bg-green-100 text-green-800' :
                              (grade.grade / grade.maxGrade) >= 0.8 ? 'bg-blue-100 text-blue-800' :
                              (grade.grade / grade.maxGrade) >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {grade.grade}/{grade.maxGrade}
                            </div>
                            <span className="text-lg font-bold text-gray-900">
                              {((grade.grade / grade.maxGrade) * 100).toFixed(1)}%
                            </span>
                          </div>
                          {grade.feedback && (
                            <p className="text-xs text-gray-600 mt-1 max-w-xs truncate">
                              {grade.feedback}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Award className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No grades yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your grades will appear here once assignments are graded.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Instructor View */}
        {currentUser.role === 'instructor' && !gradingMode && (
          <>
            {/* Course Filter */}
            <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 p-6 mb-6 shadow-lg">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Select course to filter assignments"
                >
                  <option value="all">All Courses</option>
                  {getInstructorCourses().map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assignments List */}
            <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Assignments to Grade</h2>
              </div>
              
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading assignments...</p>
                </div>
              ) : assignments.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                          <p className="text-sm text-gray-500">{assignment.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => loadSubmissions(assignment)}
                            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            <span>Grade Submissions</span>
                          </button>
                          <button
                            onClick={() => exportGrades(assignment.id)}
                            className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create assignments to start grading student work.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Grading Interface */}
        {currentUser.role === 'instructor' && gradingMode && selectedAssignment && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Grading: {selectedAssignment.title}
              </h2>
              <button
                onClick={() => setGradingMode(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Assignments
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Submissions List */}
              <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 shadow-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Submissions</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {submissions.map((submission) => (
                    <div 
                      key={submission.id} 
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedSubmission?.id === submission.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setGradeInput(submission.grade?.toString() || '');
                        setFeedbackInput(submission.feedback || '');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {(submission as any).student?.name || 'Unknown Student'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {submission.grade !== undefined ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                              {submission.grade}/{selectedAssignment.totalPoints}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grading Form */}
              {selectedSubmission && (
                <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 shadow-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Grade Submission
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade (out of {selectedAssignment.totalPoints})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={selectedAssignment.totalPoints}
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter grade"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feedback
                      </label>
                      <textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Provide feedback to the student..."
                      />
                    </div>

                    {selectedSubmission.content && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Submission Content
                        </label>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm">
                          {selectedSubmission.content}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={handleGradeSubmission}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save Grade
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubmission(null);
                          setGradeInput('');
                          setFeedbackInput('');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
