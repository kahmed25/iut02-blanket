'use client';

import React from 'react';

interface TabsProps {
  tabs: { id: string; label: string; icon?: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-soft border border-gray-100">
      <nav className="flex space-x-2 overflow-x-auto scrollbar-hide" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative whitespace-nowrap py-3 px-6 rounded-xl font-semibold text-sm
              transition-all duration-300 ease-out
              ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            <span className="relative z-10">{tab.label.replace(/^[^\s]+\s/, '')}</span>
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-50 -z-0"></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

