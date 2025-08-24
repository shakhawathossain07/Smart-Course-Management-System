import React from 'react';
import { Home, BookOpen, Users, FileText, Calendar, Settings, BarChart3, UserCheck } from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  currentUser: User;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ currentUser, activeSection, onSectionChange }: SidebarProps) {
  const getMenuItems = () => {
    const commonItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'courses', label: 'Courses', icon: BookOpen },
    ];

    switch (currentUser.role) {
      case 'admin':
        return [
          ...commonItems,
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'settings', label: 'System Settings', icon: Settings },
        ];
      case 'instructor':
        return [
          ...commonItems,
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'attendance', label: 'Attendance', icon: UserCheck },
          { id: 'students', label: 'My Students', icon: Users },
        ];
      case 'student':
        return [
          ...commonItems,
          { id: 'assignments', label: 'My Assignments', icon: FileText },
          { id: 'grades', label: 'Grades', icon: BarChart3 },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
        ];
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-gradient-to-b from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-sm border-r-2 border-white/30 dark:border-gray-700/30 h-full shadow-xl">
      {/* User Profile Section */}
      <div className="p-6 border-b border-white/20 dark:border-gray-700/20">
        <div className="flex items-center space-x-3">
          <img
            src={currentUser.avatar || `https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150`}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{currentUser.name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 capitalize">{currentUser.role}</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 text-cyan-700 dark:text-cyan-300 shadow-lg border-2 border-cyan-200/50 dark:border-cyan-700/50'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-white dark:hover:from-gray-800 dark:hover:to-gray-700 hover:shadow-md hover:scale-105'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Decorative Element */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
        <div className="mt-4 flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-200 via-blue-200 to-purple-200 rounded-full opacity-50"></div>
        </div>
      </div>
    </div>
  );
}