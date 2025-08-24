import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, FileText, Clock, CheckCircle, AlertCircle, Upload, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CreateAssignmentModal } from '../components/Assignments/CreateAssignmentModal';
import { AssignmentCard } from '../components/Assignments/AssignmentCard';
import { SubmitAssignmentModal } from '../components/Assignments/SubmitAssignmentModal';
import { Assignment } from '../types';

export function Assignments() {
  const { state, actions } = useApp();
  const { currentUser, assignments, courses, isLoading } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (currentUser?.role === 'student') {
      // Load student enrollments and assignments
      const enrollments = await actions.loadStudentEnrollments();
      setEnrolledCourseIds(enrollments);
      await actions.loadAssignments();
    } else if (currentUser?.role === 'instructor') {
      // Load instructor's course assignments
      await actions.loadAssignments();
    }
  };

  if (!currentUser) return null;

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'upcoming') {
      matchesStatus = new Date(assignment.dueDate) > new Date();
    } else if (statusFilter === 'overdue') {
      matchesStatus = new Date(assignment.dueDate) < new Date();
    } else if (statusFilter === 'submitted' && currentUser.role === 'student') {
      matchesStatus = assignment.submissions.some(s => s.studentId === currentUser.id);
    } else if (statusFilter === 'graded' && currentUser.role === 'student') {
      matchesStatus = assignment.submissions.some(s => s.studentId === currentUser.id && s.grade !== null);
    }
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateAssignment = async (assignmentData: any) => {
    const success = await actions.createAssignment(assignmentData);
    if (success) {
      setShowCreateModal(false);
    }
    return success;
  };

  const handleSubmitAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
  };

  const getStatusCounts = () => {
    const upcoming = assignments.filter(a => new Date(a.dueDate) > new Date()).length;
    const overdue = assignments.filter(a => new Date(a.dueDate) < new Date()).length;
    const submitted = currentUser.role === 'student' 
      ? assignments.filter(a => a.submissions.some(s => s.studentId === currentUser.id)).length
      : 0;
    const graded = currentUser.role === 'student'
      ? assignments.filter(a => a.submissions.some(s => s.studentId === currentUser.id && s.grade !== null)).length
      : 0;

    return { upcoming, overdue, submitted, graded };
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              {currentUser.role === 'student' ? 'My Assignments' : 'Assignment Management'}
            </h1>
            <p className="text-gray-700 mt-2">
              {currentUser.role === 'student' 
                ? 'View and submit your course assignments'
                : 'Create and manage assignments for your courses'
              }
            </p>
          </div>
          
          {currentUser.role === 'instructor' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Assignment</span>
            </button>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.upcoming}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.overdue}</p>
              </div>
            </div>
          </div>

          {currentUser.role === 'student' && (
            <>
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
                <div className="flex items-center">
                  <Upload className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Submitted</p>
                    <p className="text-2xl font-bold text-gray-900">{statusCounts.submitted}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Graded</p>
                    <p className="text-2xl font-bold text-gray-900">{statusCounts.graded}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 p-4 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Assignments</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
                {currentUser.role === 'student' && (
                  <>
                    <option value="submitted">Submitted</option>
                    <option value="graded">Graded</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              userRole={currentUser.role}
              onSubmit={() => handleSubmitAssignment(assignment)}
              onView={(id) => console.log('View assignment:', id)}
              onEdit={(id) => console.log('Edit assignment:', id)}
            />
          ))}
        </div>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria.'
                : currentUser.role === 'instructor' 
                  ? 'Get started by creating your first assignment.'
                  : 'No assignments available at the moment.'
              }
            </p>
          </div>
        )}

        {/* Modals */}
        <CreateAssignmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAssignment}
          courses={courses.filter(c => c.instructorId === currentUser.id)}
        />

        <SubmitAssignmentModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          assignment={selectedAssignment}
          studentId={currentUser.id}
        />
      </div>
    </div>
  );
}