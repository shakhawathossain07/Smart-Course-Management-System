import React, { useState } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { LoginModal } from './components/Auth/LoginModal';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { UserManagement } from './pages/UserManagement';
import { Assignments } from './pages/Assignments';
import { Attendance } from './pages/Attendance';
import { Grades } from './pages/Grades';
import { Schedule } from './pages/Schedule';
import { Settings } from './pages/Settings';
import { useApp } from './context/AppContext';

// Campus background images
const campusImages = [
  '/486202300_3019165758287838_1859167207686254465_n.jpg',
  '/481189863_2522409668113803_9151885922578371298_n.jpg',
  '/481478024_671855772170185_4297337321038262923_n.jpg',
  '/480297318_610969301644468_7074846796478756538_n.jpg'
];

function App() {
  const { state } = useApp();
  const { currentUser, isLoading, error, isInitialized } = state;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-cycle through background images for main page
  React.useEffect(() => {
    if (currentUser) return; // Only run when user is not logged in
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % campusImages.length);
    }, 5000); // Change image every 5 seconds for main page

    return () => clearInterval(interval);
  }, [currentUser]);

  const renderContent = () => {
    // Show loading only during initial auth check
    if (!isInitialized || (isLoading && !currentUser)) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      return (
        <div className="fixed inset-0 w-screen h-screen z-10">
          {/* Full Screen Animated Background */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {campusImages.map((image, index) => (
              <div
                key={image}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={image}
                  alt="Campus background"
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlays for better readability */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-900/60 via-purple-900/40 to-indigo-900/70"></div>
                <div className="absolute inset-0 w-full h-full bg-black/30"></div>
              </div>
            ))}
            
            {/* Animated particles/dots overlay */}
            <div className="absolute inset-0 w-full h-full opacity-30">
              <div className="particles-container">
                {[...Array(25)].map((_, i) => (
                  <div
                    key={i}
                    className="particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 4}s`,
                      animationDuration: `${3 + Math.random() * 4}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Header positioned over background */}
          <div className="relative z-40 w-full">
            <Header onLoginClick={() => setShowLoginModal(true)} />
          </div>

          {/* Content centered on screen */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center max-w-4xl mx-auto px-6 w-full">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
                Smart Course Management System
              </h1>
              <p className="text-xl text-gray-100 mb-8 drop-shadow-md leading-relaxed">
                A comprehensive educational platform for course delivery, assignment management, 
                attendance tracking, and seamless communication between students and instructors.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-white/20 hover:bg-white/95 transition-all duration-300">
                <h3 className="font-bold text-lg text-blue-600 mb-2">For Students</h3>
                <p className="text-gray-600">Enroll in courses, submit assignments, track grades, and manage your academic progress.</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-white/20 hover:bg-white/95 transition-all duration-300">
                <h3 className="font-bold text-lg text-green-600 mb-2">For Instructors</h3>
                <p className="text-gray-600">Create courses, manage assignments, track attendance, and communicate with students.</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-white/20 hover:bg-white/95 transition-all duration-300">
                <h3 className="font-bold text-lg text-purple-600 mb-2">For Admins</h3>
                <p className="text-gray-600">Oversee system operations, manage users, generate reports, and maintain the platform.</p>
              </div>
            </div>

            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 backdrop-blur-sm border border-blue-500/30"
            >
              Get Started
            </button>
            </div>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'courses':
        return <Courses />;
      case 'users':
        return <UserManagement />;
      case 'assignments':
        return <Assignments />;
      case 'attendance':
        return <Attendance />;
      case 'students':
        return <div className="p-6"><h1 className="text-2xl font-bold">My Students</h1><p className="text-gray-600">Student management coming soon...</p></div>;
      case 'grades':
        return <Grades />;
      case 'schedule':
        return <Schedule />;
      case 'reports':
        return <div className="p-6"><h1 className="text-2xl font-bold">Reports</h1><p className="text-gray-600">System reports coming soon...</p></div>;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gray-50 dark:bg-gray-900 relative">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-4 relative z-20">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex overflow-hidden">
        {currentUser && (
          <Sidebar
            currentUser={currentUser}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        )}
        
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}

export default App;