import React, { useState } from 'react';
import {
  Activity as ActivityIcon,
  ArrowLeft,
  Menu,
  X,
  Plus,
  LogOut,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Home,
  ListFilter,
  User as UserIcon,
} from 'lucide-react';
import { AuthUser, BottomNavTab, Screen } from '../types';
import { BottomNavigation } from './BottomNavigation';

interface AppShellProps {
  user: AuthUser;
  currentScreen: Screen;
  activeTab: BottomNavTab;
  isDarkMode: boolean;
  onToggleDarkMode: (val: boolean) => void;
  onNavigate: (screen: Screen) => void;
  onBack?: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const MOBILE_PAGE_TITLES: Record<Screen, string> = {
  login: 'Sign In',
  signup: 'Sign Up',
  dashboard: 'Physical List',
  list: 'Activities',
  add: 'Log Activity',
  details: 'Activity Details',
  edit: 'Edit Activity',
  statistics: 'Statistics',
  profile: 'Profile',
};

export const AppShell: React.FC<AppShellProps> = ({
  user,
  currentScreen,
  activeTab,
  isDarkMode,
  onToggleDarkMode,
  onNavigate,
  onBack,
  onOpenSettings,
  onLogout,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showMobileBack =
    currentScreen === 'add' ||
    currentScreen === 'details' ||
    currentScreen === 'edit' ||
    currentScreen === 'statistics';

  const desktopNavItems: { screen: Screen; label: string; activeMatch: Screen[] }[] = [
    { screen: 'dashboard', label: 'Dashboard', activeMatch: ['dashboard'] },
    { screen: 'list', label: 'Activities', activeMatch: ['list', 'details', 'edit'] },
    { screen: 'statistics', label: 'Statistics', activeMatch: ['statistics'] },
    { screen: 'profile', label: 'Profile', activeMatch: ['profile'] },
  ];

  const handleMobileNav = (screen: Screen) => {
    setMobileMenuOpen(false);
    onNavigate(screen);
  };

  const handleBottomTab = (tab: BottomNavTab) => {
    setMobileMenuOpen(false);
    onNavigate(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* DESKTOP TOP NAVIGATION BAR (3-Zone Contract) */}
      <header className="hidden md:block sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <ActivityIcon className="w-4 h-4 stroke-[2.4]" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Physical List
            </span>
          </button>

          {/* Zone 2: Single-line Nav Links */}
          <nav aria-label="Desktop navigation" className="flex items-center gap-7">
            {desktopNavItems.map((item) => {
              const isActive = item.activeMatch.includes(currentScreen);
              return (
                <button
                  key={item.screen}
                  id={`desktop-nav-${item.screen}`}
                  type="button"
                  onClick={() => onNavigate(item.screen)}
                  className={`h-16 inline-flex items-center text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-blue-600 text-slate-900 dark:text-white font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary CTA + Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="desktop-log-activity-btn"
              type="button"
              onClick={() => onNavigate('add')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.4]" />
              <span>Log Activity</span>
            </button>
            <button
              id="desktop-logout-btn"
              type="button"
              onClick={onLogout}
              title={`Sign out (${user.email})`}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE COMPACT TOP BAR */}
      <header className="md:hidden sticky top-0 z-30 h-14 px-3 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          {showMobileBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleMobileNav('dashboard')}
              className="min-h-[44px] px-1.5 flex items-center gap-2 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <ActivityIcon className="w-4 h-4 stroke-[2.3]" />
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {MOBILE_PAGE_TITLES[currentScreen]}
              </span>
            </button>
          )}
          {showMobileBack && (
            <span className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {MOBILE_PAGE_TITLES[currentScreen]}
            </span>
          )}
        </div>

        <button
          id="mobile-hamburger-btn"
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* MOBILE HAMBURGER DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-45 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-xl">
            {/* Signed-in user info */}
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>

            {/* Menu navigation links */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleMobileNav('dashboard')}
                className="w-full min-h-[48px] px-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => handleMobileNav('list')}
                className="w-full min-h-[48px] px-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ListFilter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>My Activities</span>
              </button>
              <button
                type="button"
                onClick={() => handleMobileNav('statistics')}
                className="w-full min-h-[48px] px-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Statistics</span>
              </button>
              <button
                type="button"
                onClick={() => handleMobileNav('profile')}
                className="w-full min-h-[48px] px-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Profile</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full min-h-[48px] px-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleDarkMode(!isDarkMode)}
                className="w-full min-h-[48px] px-3 rounded-xl flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                  <span>{isDarkMode ? 'Light Theme' : 'Dark Theme'}</span>
                </span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                id="mobile-menu-logout-btn"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full min-h-[48px] px-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
          <div className="h-full" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* MAIN RESPONSIVE VIEWPORT CONTAINER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-12">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <BottomNavigation activeTab={activeTab} onSelectTab={handleBottomTab} />
    </div>
  );
};
