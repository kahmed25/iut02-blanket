'use client';

import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'indigo';
}

export default function SummaryCard({ 
  title, 
  value, 
  subtitle, 
  color = 'blue' 
}: SummaryCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 via-blue-600 to-indigo-600',
    green: 'from-emerald-500 via-teal-500 to-cyan-500',
    purple: 'from-purple-500 via-violet-500 to-fuchsia-500',
    orange: 'from-orange-500 via-amber-500 to-yellow-500',
    pink: 'from-pink-500 via-rose-500 to-red-500',
    indigo: 'from-indigo-500 via-blue-600 to-purple-600',
  };

  const iconColors = {
    blue: 'text-blue-100',
    green: 'text-emerald-100',
    purple: 'text-purple-100',
    orange: 'text-orange-100',
    pink: 'text-pink-100',
    indigo: 'text-indigo-100',
  };

  return (
    <div className={`
      relative overflow-hidden
      bg-gradient-to-br ${colorClasses[color]} 
      rounded-2xl shadow-soft shadow-hover
      p-6 text-white 
      transform transition-all duration-300 
      hover:scale-[1.02] hover:shadow-2xl
      animate-fade-in-up
      border border-white/20
    `}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
      
      <div className="relative z-10">
        <h3 className="text-sm font-medium mb-3 opacity-90 uppercase tracking-wider">{title}</h3>
        <p className="text-4xl font-bold mb-2 drop-shadow-lg">{value}</p>
        {subtitle && (
          <p className="text-xs font-medium opacity-80 mt-2">{subtitle}</p>
        )}
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full hover:translate-x-full"></div>
    </div>
  );
}

