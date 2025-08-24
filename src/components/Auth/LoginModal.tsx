import React, { useState } from 'react';
import { X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AuthService } from '../../services/authService';

// Campus background images
const campusImages = [
  '/486202300_3019165758287838_1859167207686254465_n.jpg',
  '/481189863_2522409668113803_9151885922578371298_n.jpg',
  '/481478024_671855772170185_4297337321038262923_n.jpg',
  '/480297318_610969301644468_7074846796478756538_n.jpg'
];

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-cycle through background images
  React.useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % campusImages.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        console.log('Login attempt for:', email);
        const { data, error } = await AuthService.signIn(email.trim(), password.trim());
        if (error) {
          console.error('Login error:', error.message);
          setError(error.message);
        } else if (data?.user) {
          console.log('Login successful for:', data.user.email);
          setSuccess('Successfully signed in!');
          setTimeout(() => {
            onClose();
            resetForm();
          }, 1000);
        }
      } else {
        console.log('Signup attempt for:', email);
        const { data, error } = await AuthService.signUp(email.trim(), password.trim(), {
          name: name.trim(),
          role,
          department: role === 'instructor' ? department.trim() : undefined,
          studentId: role === 'student' ? studentId.trim() : undefined,
        });
        
        if (error) {
          console.error('Signup error:', error.message);
          setError(error.message);
          // If user already exists, suggest switching to login
          if (error.message.includes('already exists')) {
            setTimeout(() => {
              setIsLogin(true);
              setError('');
              setPassword(''); // Clear password but keep email
            }, 3000);
          }
        } else if (data?.user) {
          console.log('Signup successful for:', data.user.email);
          // Sign out immediately after signup to prevent auto-login
          await AuthService.signOut();
          setSuccess('Account created successfully! Please sign in with your new account.');
          setTimeout(() => {
            setIsLogin(true);
            setSuccess('');
            setPassword(''); // Clear password but keep email and name
          }, 1500);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setRole('student');
    setDepartment('');
    setStudentId('');
    setError('');
    setSuccess('');
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setPassword(''); // Clear password when switching modes
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center z-50 p-4">
      {/* Solid Background Overlay */}
      <div className="absolute inset-0 w-full h-full bg-black/50"></div>
      
      {/* Animated Background - Full Screen */}
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
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-900/40 via-purple-900/30 to-indigo-900/50"></div>
            <div className="absolute inset-0 w-full h-full bg-black/20"></div>
          </div>
        ))}
        
        {/* Animated particles/dots overlay */}
        <div className="absolute inset-0 w-full h-full opacity-20">
          <div className="particles-container">
            {[...Array(20)].map((_, i) => (
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

      {/* Modal Content */}
      <div className="relative bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isLogin ? 'Sign in to your account' : 'Join our learning platform'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                {error.includes('already exists') && !isLogin && (
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      setError('');
                      setPassword('');
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 underline font-medium"
                  >
                    Switch to Sign In →
                  </button>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Type *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'student' | 'instructor' | 'admin')}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      {role === 'student' && '📚 Access courses, submit assignments, view grades'}
                      {role === 'instructor' && '👨‍🏫 Create courses, manage assignments, track attendance'}
                      {role === 'admin' && '⚙️ Full system access, user management, reports'}
                    </p>
                  </div>
                </div>

                {role === 'instructor' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Computer Science, Mathematics"
                    />
                  </div>
                )}

                {role === 'student' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Student ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., STU123456"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-2">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
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
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>

          {isLogin && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Demo Credentials</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-700">Instructor:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('sarah.johnson@university.edu');
                      setPassword('password123');
                    }}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    sarah.johnson@university.edu
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Student:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('john.smith@student.edu');
                      setPassword('password123');
                    }}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    john.smith@student.edu
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Admin:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@university.edu');
                      setPassword('password123');
                    }}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    admin@university.edu
                  </button>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">Click any email to auto-fill credentials</p>
            </div>
          )}

          {!isLogin && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Choose your account type carefully as it determines your access level and available features in the system.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}