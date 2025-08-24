import React from 'react';
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, Eye, Edit, Upload } from 'lucide-react';
import { Assignment } from '../../types';

interface AssignmentCardProps {
  assignment: Assignment;
  userRole: 'admin' | 'instructor' | 'student';
  onSubmit?: () => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function AssignmentCard({ assignment, userRole, onSubmit, onView, onEdit }: AssignmentCardProps) {
  const isOverdue = new Date(assignment.dueDate) < new Date();
  const isUpcoming = new Date(assignment.dueDate) > new Date();
  
  // Check if student has submitted
  const hasSubmitted = userRole === 'student' && assignment.submissions.length > 0;
  const userSubmission = assignment.submissions.find(s => s.studentId === assignment.id); // This would need proper student ID
  const isGraded = userSubmission?.grade !== null;

  const getStatusColor = () => {
    if (userRole === 'student') {
      if (isGraded) return 'text-purple-600 bg-purple-100';
      if (hasSubmitted) return 'text-green-600 bg-green-100';
      if (isOverdue) return 'text-red-600 bg-red-100';
      return 'text-blue-600 bg-blue-100';
    }
    
    if (isOverdue) return 'text-red-600 bg-red-100';
    return 'text-blue-600 bg-blue-100';
  };

  const getStatusText = () => {
    if (userRole === 'student') {
      if (isGraded) return 'Graded';
      if (hasSubmitted) return 'Submitted';
      if (isOverdue) return 'Overdue';
      return 'Pending';
    }
    
    if (isOverdue) return 'Overdue';
    return 'Active';
  };

  const getStatusIcon = () => {
    if (userRole === 'student') {
      if (isGraded) return <CheckCircle className="w-4 h-4" />;
      if (hasSubmitted) return <Upload className="w-4 h-4" />;
      if (isOverdue) return <AlertCircle className="w-4 h-4" />;
      return <Clock className="w-4 h-4" />;
    }
    
    if (isOverdue) return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const timeUntilDue = () => {
    const now = new Date();
    const due = new Date(assignment.dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex-1">{assignment.title}</h3>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </span>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Due: {assignment.dueDate.toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>{timeUntilDue()}</span>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <FileText className="w-4 h-4 mr-2" />
            <span>Max Grade: {assignment.maxGrade} points</span>
          </div>

          {userRole === 'student' && userSubmission?.grade !== null && (
            <div className="flex items-center text-sm font-medium text-purple-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Grade: {userSubmission.grade}/{assignment.maxGrade}</span>
            </div>
          )}
        </div>

        {userRole === 'instructor' && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Submissions: {assignment.submissions.length}
            </p>
            <p className="text-sm text-gray-600">
              Graded: {assignment.submissions.filter(s => s.grade !== null).length}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={() => onView?.(assignment.id)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>View</span>
            </button>
            
            {userRole === 'instructor' && (
              <button
                onClick={() => onEdit?.(assignment.id)}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {userRole === 'student' && !hasSubmitted && !isOverdue && (
            <button
              onClick={onSubmit}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Submit
            </button>
          )}

          {userRole === 'student' && hasSubmitted && (
            <span className="text-green-600 font-medium text-sm">
              ✓ Submitted
            </span>
          )}
        </div>
      </div>
    </div>
  );
}