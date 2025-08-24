import React, { useState } from 'react';
import { User, Bell, Shield, Palette, Globe, Save, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Settings() {
  const { state } = useApp();
  const { currentUser } = state;
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    bio: '',
    department: '',
    avatar: currentUser?.avatar || '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    gradeNotifications: true,
    courseUpdates: true,
    weeklyDigest: false,
  });

  // Security settings
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    notifications: true,
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Here you would typically update the user profile via API
      console.log('Profile updated:', profileData);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Notification settings updated:', notificationSettings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Security settings updated');
    } catch (error) {
      console.error('Failed to update security settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAppearance = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Appearance settings updated:', appearanceSettings);
    } catch (error) {
      console.error('Failed to update appearance settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  if (!currentUser) return null;

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-700 mt-2">
            Manage your account preferences and system settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 shadow-lg overflow-hidden">
              <nav className="space-y-1 p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 shadow-md'
                          : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 shadow-lg overflow-hidden">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <img
                        src={profileData.avatar || `https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150`}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Change Photo
                        </button>
                        <p className="text-sm text-gray-500 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <input
                          type="text"
                          value={profileData.department}
                          onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                      <div className="space-y-4">
                        {[
                          { key: 'emailNotifications', label: 'Enable email notifications', description: 'Receive notifications via email' },
                          { key: 'assignmentReminders', label: 'Assignment reminders', description: 'Get reminded about upcoming assignment deadlines' },
                          { key: 'gradeNotifications', label: 'Grade notifications', description: 'Be notified when new grades are posted' },
                          { key: 'courseUpdates', label: 'Course updates', description: 'Receive updates about course announcements' },
                          { key: 'weeklyDigest', label: 'Weekly digest', description: 'Get a weekly summary of your activities' },
                        ].map((setting) => (
                          <div key={setting.key} className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              id={setting.key}
                              checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                [setting.key]: e.target.checked
                              })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                            />
                            <div>
                              <label htmlFor={setting.key} className="text-sm font-medium text-gray-900">
                                {setting.label}
                              </label>
                              <p className="text-sm text-gray-500">{setting.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveNotifications}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? 'Saving...' : 'Save Preferences'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={securityData.currentPassword}
                              onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={securityData.newPassword}
                              onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              value={securityData.confirmPassword}
                              onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="twoFactor"
                          checked={securityData.twoFactorEnabled}
                          onChange={(e) => setSecurityData({ ...securityData, twoFactorEnabled: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                        />
                        <div>
                          <label htmlFor="twoFactor" className="text-sm font-medium text-gray-900">
                            Enable Two-Factor Authentication
                          </label>
                          <p className="text-sm text-gray-500">
                            Add an extra layer of security to your account by requiring a second form of authentication.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveSecurity}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? 'Saving...' : 'Update Security'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Appearance & Language</h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Theme
                        </label>
                        <select
                          value={state.theme}
                          onChange={(e) => {
                            const newTheme = e.target.value as 'light' | 'dark';
                            actions.toggleTheme();
                          }}
                          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Choose your preferred theme for the interface
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Language
                        </label>
                        <select
                          value={appearanceSettings.language}
                          onChange={(e) => setAppearanceSettings({ ...appearanceSettings, language: e.target.value })}
                          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Timezone
                        </label>
                        <select
                          value={appearanceSettings.timezone}
                          onChange={(e) => setAppearanceSettings({ ...appearanceSettings, timezone: e.target.value })}
                          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="UTC">UTC</option>
                          <option value="EST">Eastern Time</option>
                          <option value="PST">Pacific Time</option>
                          <option value="CST">Central Time</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date Format
                        </label>
                        <select
                          value={appearanceSettings.dateFormat}
                          onChange={(e) => setAppearanceSettings({ ...appearanceSettings, dateFormat: e.target.value })}
                          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveAppearance}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}