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
  return (
    <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-around shrink-0 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-colors">
      {/* Home Tab */}
      <button
        id="nav-home-btn"
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
          activeTab === 'home'
            ? 'text-blue-600 dark:text-blue-400 font-semibold'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <div
          className={`p-1 rounded-xl transition-colors ${
            activeTab === 'home' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : ''
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[11px] mt-0.5 tracking-tight">Home</span>
      </button>

      {/* Add Tab (Prominent central mobile button with bright blue background) */}
      <button
        id="nav-add-btn"
        onClick={() => onSelectTab('add')}
        className="flex flex-col items-center justify-center -mt-4 group cursor-pointer"
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 transition-transform duration-200 group-hover:scale-105 active:scale-95 ${
            activeTab === 'add'
              ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/80'
              : 'bg-blue-600 text-white'
          }`}
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </div>
        <span
          className={`text-[11px] mt-1 tracking-tight font-medium ${
            activeTab === 'add' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Add
        </span>
      </button>

      {/* List Tab */}
      <button
        id="nav-list-btn"
        onClick={() => onSelectTab('list')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
          activeTab === 'list'
            ? 'text-blue-600 dark:text-blue-400 font-semibold'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <div
          className={`p-1 rounded-xl transition-colors ${
            activeTab === 'list' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : ''
          }`}
        >
          <ListFilter className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[11px] mt-0.5 tracking-tight">List</span>
      </button>

      {/* Profile Tab */}
      <button
        id="nav-profile-btn"
        onClick={() => onSelectTab('profile')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
          activeTab === 'profile'
            ? 'text-blue-600 dark:text-blue-400 font-semibold'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <div
          className={`p-1 rounded-xl transition-colors ${
            activeTab === 'profile' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : ''
          }`}
        >
          <User className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="text-[11px] mt-0.5 tracking-tight">Profile</span>
      </button>
    </div>
  );
};
