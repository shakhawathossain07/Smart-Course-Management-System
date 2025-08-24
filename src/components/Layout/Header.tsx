import React, { useState } from 'react';
import { Bell, User, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/authService';
import { NotificationService } from '../../services/notificationService';

interface HeaderProps {
  onLoginClick: () => void;
}

export function Header({ onLoginClick }: HeaderProps) {
  const { state, dispatch, actions } = useApp();
  const { currentUser, notifications, theme } = state;
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await AuthService.signOut();
    dispatch({ type: 'SET_CURRENT_USER', payload: null });
  };

  const handleNotificationClick = async (notificationId: string) => {
    const success = await NotificationService.markAsRead(notificationId);
    if (success) {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
    }
  };

  return (
    <header className="relative z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b-2 border-white/30 dark:border-gray-700/30 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img
              src="/North_South_University_Monogram.svg.png"
              alt="North South University"
              className="w-10 h-10 object-contain shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">SCMS</h1>
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Smart Course Management System</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {currentUser ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-3 text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:scale-105"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-400 to-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-white/30 dark:border-gray-700/30 z-50">
                    <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                      <h3 className="font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <span className="dark:text-gray-400">No notifications</span>
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification.id)}
                            className={`p-4 border-b border-gray-100/50 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-all duration-200 ${
                              !notification.read ? 'bg-gradient-to-r from-cyan-50/80 to-blue-50/80 dark:from-cyan-900/30 dark:to-blue-900/30' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {notification.createdAt.toLocaleDateString()}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full ml-2 mt-1 shadow-lg"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={actions.toggleTheme}
                className="p-3 text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:scale-105"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              <div className="flex items-center space-x-3">
                <img
                  src={currentUser.avatar || `https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150`}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-200/50 shadow-lg"
                />
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentUser.name}</p>
                  <p className="text-xs text-cyan-600 capitalize font-medium">{currentUser.role}</p>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        ></div>
      )}
    </header>
  );
}