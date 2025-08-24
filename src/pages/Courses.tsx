import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CourseCard } from '../components/Courses/CourseCard';
import { CreateCourseModal } from '../components/Courses/CreateCourseModal';
import { CourseManagementModal } from '../components/Courses/CourseManagementModal';
import { CourseService } from '../services/courseService';

export function Courses() {
  const { state, actions } = useApp();
  const { currentUser, courses, isLoading } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [managingCourseId, setManagingCourseId] = useState<string | null>(null);

  const loadEnrollments = useCallback(async () => {
    if (currentUser?.role === 'student') {
      const enrollments = await CourseService.getStudentEnrollments(currentUser.id);
      setEnrolledCourseIds(enrollments);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === 'student') {
      loadEnrollments();
    }
  }, [currentUser, loadEnrollments]);

  // Show course management modal if managing a course
  if (managingCourseId) {
    return (
      <>
        <CourseManagementModal 
          courseId={managingCourseId} 
          isOpen={true}
          onClose={() => setManagingCourseId(null)} 
        />
        {/* Render the main courses page in the background */}
        <CoursesContent />
      </>
    );
  }

  return <CoursesContent />;

  function CoursesContent() {
    if (!currentUser) return null;

    const categories = ['all', ...new Set(courses.map(c => c.category))];
    
    const filteredCourses = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    const handleEnroll = async (courseId: string) => {
      if (!currentUser || currentUser.role !== 'student') return;

      const success = await actions.enrollInCourse(courseId);
      if (success) {
        await loadEnrollments();
      }
    };

    const isEnrolled = (courseId: string) => {
      return enrolledCourseIds.includes(courseId);
    };

    const handleCreateCourse = async (courseData: { title: string; description: string; category: string }) => {
      const success = await actions.createCourse(courseData);
      if (success) {
        setShowCreateModal(false);
      }
      return success;
    };

    if (isLoading) {
      return (
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600 mt-2">
              {currentUser.role === 'student' ? 'Browse and enroll in courses' : 'Manage your courses'}
            </p>
          </div>
          
          {(currentUser.role === 'instructor' || currentUser.role === 'admin') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Course</span>
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Filter courses by category"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              userRole={currentUser.role}
              isEnrolled={isEnrolled(course.id)}
              onEnroll={handleEnroll}
              onManage={(courseId) => setManagingCourseId(courseId)}
            />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search criteria.'
                : 'Get started by creating a new course.'}
            </p>
          </div>
        )}

        <CreateCourseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCourse}
        />
      </div>
    );
  }
}
