import React, { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'emerald' | 'cyan' | 'orange' | 'rose' | 'violet' | 'amber' | 'teal';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function DashboardCard({ title, value, icon, color, trend }: DashboardCardProps) {
  const colorClasses = {
    emerald: 'bg-gradient-to-br from-emerald-100 to-green-200 text-emerald-700 shadow-emerald-200/50',
    cyan: 'bg-gradient-to-br from-cyan-100 to-blue-200 text-cyan-700 shadow-cyan-200/50',
    orange: 'bg-gradient-to-br from-orange-100 to-amber-200 text-orange-700 shadow-orange-200/50',
    rose: 'bg-gradient-to-br from-rose-100 to-pink-200 text-rose-700 shadow-rose-200/50',
    violet: 'bg-gradient-to-br from-violet-100 to-purple-200 text-violet-700 shadow-violet-200/50',
    amber: 'bg-gradient-to-br from-amber-100 to-yellow-200 text-amber-700 shadow-amber-200/50',
    teal: 'bg-gradient-to-br from-teal-100 to-cyan-200 text-teal-700 shadow-teal-200/50',
  };

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border-2 border-white/30 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-xl hover:border-white/50 dark:hover:border-gray-600/50 hover:bg-white/95 dark:hover:bg-gray-700/95">
      <div className="flex items-center">
        <div className={`p-4 rounded-2xl shadow-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          {trend && (
            <p className={`text-sm font-medium mt-1 ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  );
}