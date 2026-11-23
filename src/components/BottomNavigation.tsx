import React from 'react';
import { Home, Plus, ListFilter, User } from 'lucide-react';
import { BottomNavTab } from '../types';

interface BottomNavigationProps {
  activeTab: BottomNavTab;
  onSelectTab: (tab: BottomNavTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs: { id: BottomNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'add', label: 'Log', icon: <Plus className="w-5 h-5" /> },
    { id: 'list', label: 'Activities', icon: <ListFilter className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="grid grid-cols-4 h-full max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}-btn`}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span
                className={`flex items-center justify-center w-8 h-7 rounded-lg transition-colors ${
                  tab.id === 'add'
                    ? 'bg-blue-600 text-white'
                    : isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60'
                      : ''
                }`}
              >
                {tab.icon}
              </span>
              <span className="text-[11px] leading-none tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
