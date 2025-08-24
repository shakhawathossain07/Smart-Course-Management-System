import React from 'react';
import { Users, Calendar, Award } from 'lucide-react';
import { Course } from '../../types';

interface CourseCardProps {
  course: Course;
  userRole: 'admin' | 'instructor' | 'student';
  isEnrolled?: boolean;
  onEnroll?: (courseId: string) => void;
  onManage?: (courseId: string) => void;
}

export function CourseCard({ course, userRole, isEnrolled, onEnroll, onManage }: CourseCardProps) {
  const enrollmentPercentage = (course.enrolledStudents.length / course.maxStudents) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {course.category}
          </span>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{course.enrolledStudents.length}/{course.maxStudents}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{course.startDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <Award className="w-4 h-4 mr-1" />
            <span>{course.credits} Credits</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Enrollment</span>
            <span>{enrollmentPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${enrollmentPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Instructor: {course.instructorName}
          </span>
          
          {userRole === 'student' && !isEnrolled && (
            <button
              onClick={() => onEnroll?.(course.id)}
              disabled={course.enrolledStudents.length >= course.maxStudents}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Enroll
            </button>
          )}

          {userRole === 'student' && isEnrolled && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Enrolled
            </span>
          )}

          {(userRole === 'instructor' || userRole === 'admin') && (
            <button
              onClick={() => onManage?.(course.id)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Manage
            </button>
          )}
        </div>

        {course.features.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Course Features:</p>
            <div className="flex flex-wrap gap-2">
              {course.features.map((feature, index) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                >
                  {feature.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}