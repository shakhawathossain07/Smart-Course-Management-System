import React, { useState } from 'react';
import { X, Calendar, FileText } from 'lucide-react';
import { Course } from '../../types';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assignmentData: any) => Promise<boolean>;
  courses: Course[];
}

export function CreateAssignmentModal({ isOpen, onClose, onSubmit, courses }: CreateAssignmentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
    dueTime: '',
    maxGrade: 100,
    gradingStrategy: 'percentage' as 'percentage' | 'letter-grade' | 'pass-fail',
    instructions: '',
    allowLateSubmission: true,
    latePenalty: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.courseId) {
      setError('Please select a course');
      return;
    }

    if (!formData.dueDate || !formData.dueTime) {
      setError('Please set a due date and time');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
      
      const assignmentData = {
        ...formData,
        dueDate: dueDateTime,
      };

      const success = await onSubmit(assignmentData);
      if (success) {
        setFormData({
          title: '',
          description: '',
          courseId: '',
          dueDate: '',
          dueTime: '',
          maxGrade: 100,
          gradingStrategy: 'percentage' as const,
          instructions: '',
          allowLateSubmission: true,
          latePenalty: 10,
        });
        onClose();
      } else {
        setError('Failed to create assignment');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Set default due date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const defaultDate = tomorrow.toISOString().split('T')[0];
  const defaultTime = '23:59';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Assignment</h2>
                <p className="text-sm text-gray-600">Add a new assignment for your students</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter assignment title"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course *
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the assignment"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide detailed instructions for students"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate || defaultDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Time *
                </label>
                <input
                  type="time"
                  value={formData.dueTime || defaultTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Grade
                </label>
                <input
                  type="number"
                  value={formData.maxGrade}
                  onChange={(e) => setFormData({ ...formData, maxGrade: parseInt(e.target.value) })}
                  min="1"
                  max="1000"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grading Strategy
                </label>
                <select
                  value={formData.gradingStrategy}
                  onChange={(e) => setFormData({ ...formData, gradingStrategy: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="percentage">Percentage</option>
                  <option value="letter-grade">Letter Grade</option>
                  <option value="pass-fail">Pass/Fail</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="allowLateSubmission"
                    checked={formData.allowLateSubmission}
                    onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allowLateSubmission" className="text-sm font-medium text-gray-700">
                    Allow late submissions
                  </label>
                </div>
                
                {formData.allowLateSubmission && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Late Penalty (% per day)
                    </label>
                    <input
                      type="number"
                      value={formData.latePenalty}
                      onChange={(e) => setFormData({ ...formData, latePenalty: parseInt(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Assignment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}