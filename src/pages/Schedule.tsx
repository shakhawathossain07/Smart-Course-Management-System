import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ScheduleEvent {
  id: string;
  title: string;
  course: string;
  type: 'lecture' | 'lab' | 'assignment' | 'exam' | 'office-hours';
  startTime: Date;
  endTime: Date;
  location: string;
  instructor?: string;
  description?: string;
}

export function Schedule() {
  const { state } = useApp();
  const { currentUser } = state;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  
  // Mock schedule data
  const [events] = useState<ScheduleEvent[]>([
    {
      id: '1',
      title: 'Computer Science 101',
      course: 'CS101',
      type: 'lecture',
      startTime: new Date(2024, 0, 15, 9, 0),
      endTime: new Date(2024, 0, 15, 10, 30),
      location: 'Room A-101',
      instructor: 'Dr. Smith',
      description: 'Introduction to Programming Concepts',
    },
    {
      id: '2',
      title: 'Mathematics 201',
      course: 'MATH201',
      type: 'lecture',
      startTime: new Date(2024, 0, 15, 11, 0),
      endTime: new Date(2024, 0, 15, 12, 30),
      location: 'Room B-205',
      instructor: 'Prof. Johnson',
      description: 'Calculus and Derivatives',
    },
    {
      id: '3',
      title: 'Programming Lab',
      course: 'CS101',
      type: 'lab',
      startTime: new Date(2024, 0, 16, 14, 0),
      endTime: new Date(2024, 0, 16, 16, 0),
      location: 'Computer Lab 1',
      instructor: 'Dr. Smith',
      description: 'Hands-on programming practice',
    },
    {
      id: '4',
      title: 'Database Assignment Due',
      course: 'CS201',
      type: 'assignment',
      startTime: new Date(2024, 0, 17, 23, 59),
      endTime: new Date(2024, 0, 17, 23, 59),
      location: 'Online Submission',
      description: 'Database Design Project',
    },
    {
      id: '5',
      title: 'Office Hours',
      course: 'CS101',
      type: 'office-hours',
      startTime: new Date(2024, 0, 18, 15, 0),
      endTime: new Date(2024, 0, 18, 17, 0),
      location: 'Room C-301',
      instructor: 'Dr. Smith',
      description: 'Weekly office hours for questions',
    },
  ]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lab': return 'bg-green-100 text-green-800 border-green-200';
      case 'assignment': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      case 'office-hours': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    
    return week;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const weekDays = getWeekDays(currentDate);
  const today = new Date();

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
              Schedule
            </h1>
            <p className="text-gray-700 mt-2">
              Manage your academic calendar and upcoming events
            </p>
          </div>
          
          {currentUser.role === 'instructor' && (
            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add Event</span>
            </button>
          )}
        </div>

        {/* Calendar Controls */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h2 className="text-lg font-semibold text-gray-900">
                {weekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentDate(today)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Today
              </button>
              
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    viewMode === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 text-sm font-medium transition-colors ${
                    viewMode === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Week View */}
        <div className="bg-white/90 backdrop-blur-md rounded-xl border border-white/30 shadow-lg overflow-hidden">
          <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
            {weekDays.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const isToday = day.toDateString() === today.toDateString();
              
              return (
                <div key={index} className="border-r border-gray-200 last:border-r-0">
                  <div className={`p-4 text-center border-b border-gray-200 ${
                    isToday ? 'bg-blue-50' : 'bg-gray-50/80'
                  }`}>
                    <div className="text-xs font-medium text-gray-600 uppercase">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-semibold mt-1 ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>
                  
                  <div className="p-2 min-h-[300px]">
                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`p-2 rounded-lg border text-xs cursor-pointer hover:shadow-md transition-all ${getEventTypeColor(event.type)}`}
                        >
                          <div className="font-medium">{event.title}</div>
                          <div className="flex items-center mt-1 text-xs opacity-75">
                            <Clock className="w-3 h-3 mr-1" />
                            {event.startTime.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </div>
                          {event.location && (
                            <div className="flex items-center mt-1 text-xs opacity-75">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mt-6 bg-white/90 backdrop-blur-md rounded-xl border border-white/30 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-start space-x-4 p-4 bg-gray-50/80 rounded-lg hover:bg-gray-100/80 transition-colors">
                  <div className={`w-3 h-3 rounded-full mt-2 ${getEventTypeColor(event.type).split(' ')[0].replace('bg-', 'bg-')}`}></div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600">{event.course}</p>
                        {event.description && (
                          <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {event.startTime.toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {event.startTime.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-2 text-sm text-gray-500 space-x-4">
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.location}
                        </div>
                      )}
                      
                      {event.instructor && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {event.instructor}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}