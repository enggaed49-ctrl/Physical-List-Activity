import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Activity,
  AuthUser,
  BottomNavTab,
  Screen,
  UserProfile,
  WorkoutSession,
} from './types';
import { activityService } from './services/activityService';
import { authService } from './services/authService';
import { setAccessToken, setUnauthorizedHandler } from './services/authTokenStore';
import { AppShell } from './components/AppShell';
import { AuthScreen } from './components/AuthScreen';
import { HomeScreen } from './components/HomeScreen';
import { ActivityListScreen } from './components/ActivityListScreen';
import { AddActivityScreen } from './components/AddActivityScreen';
import { ActivityDetailScreen } from './components/ActivityDetailScreen';
import { EditActivityScreen } from './components/EditActivityScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { StatisticsScreen } from './components/StatisticsScreen';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { SettingsModal } from './components/SettingsModal';
import { AboutModal } from './components/AboutModal';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { FloatingMiniTimer } from './components/FloatingMiniTimer';
import { detectCategoryFromName } from './utils/activityIcons';

interface ParsedRoute {
  screen: Screen;
  activityId?: string;
  isRoot?: boolean;
  isUnknown?: boolean;
}

function parsePathname(pathname: string): ParsedRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return { screen: 'login', isRoot: true };
  if (clean === '/login') return { screen: 'login' };
  if (clean === '/signup') return { screen: 'signup' };
  if (clean === '/dashboard') return { screen: 'dashboard' };
  if (clean === '/activities') return { screen: 'list' };
  if (clean === '/add') return { screen: 'add' };
  if (clean === '/statistics') return { screen: 'statistics' };
  if (clean === '/profile') return { screen: 'profile' };

  const editMatch = clean.match(/^\/activities\/([^/]+)\/edit$/);
  if (editMatch) {
    return { screen: 'edit', activityId: decodeURIComponent(editMatch[1]) };
  }

  const detailMatch = clean.match(/^\/activities\/([^/]+)$/);
  if (detailMatch) {
    return { screen: 'details', activityId: decodeURIComponent(detailMatch[1]) };
  }

  return { screen: 'dashboard', isUnknown: true };
}

function routeToPath(screen: Screen, activityId?: string): string {
  switch (screen) {
    case 'login':
      return '/login';
    case 'signup':
      return '/signup';
    case 'dashboard':
      return '/dashboard';
    case 'list':
      return '/activities';
    case 'add':
      return '/add';
    case 'details':
      return activityId ? `/activities/${encodeURIComponent(activityId)}` : '/activities';
    case 'edit':
      return activityId ? `/activities/${encodeURIComponent(activityId)}/edit` : '/activities';
    case 'statistics':
      return '/statistics';
    case 'profile':
      return '/profile';
    default:
      return '/dashboard';
  }
}

function screenToTab(screen: Screen): BottomNavTab {
  if (screen === 'add') return 'add';
  if (screen === 'list' || screen === 'details' || screen === 'edit') return 'list';
  if (screen === 'profile' || screen === 'statistics') return 'profile';
  return 'dashboard';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Initial route evaluation with protected-route guard
  const initialParsed = parsePathname(
    typeof window !== 'undefined' ? window.location.pathname : '/login'
  );
  const initialIsProtected =
    !initialParsed.isRoot &&
    !initialParsed.isUnknown &&
    initialParsed.screen !== 'login' &&
    initialParsed.screen !== 'signup';

  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    if (initialParsed.screen === 'signup') return 'signup';
    return 'login';
  });
  const [selectedActivityId, setSelectedActivityId] = useState<string | undefined>(
    initialParsed.activityId
  );
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<{
    screen: Screen;
    activityId?: string;
  } | null>(() =>
    initialIsProtected
      ? { screen: initialParsed.screen, activityId: initialParsed.activityId }
      : null
  );
  const [redirectNotice, setRedirectNotice] = useState<string | null>(() =>
    initialIsProtected ? 'Please log in to view that page.' : null
  );

  // Modals & UI feedback
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Active Workout Timer Session
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);

  // Dark Mode Preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('activity_tracker_dark_mode');
      if (saved !== null) return saved === 'true';
      return (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleToggleDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
    try {
      localStorage.setItem('activity_tracker_dark_mode', String(enabled));
    } catch {
      // ignore storage errors
    }
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Normalize initial URL on mount if unauthenticated user landed on protected or root URL
  useEffect(() => {
    if (!currentUser && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
      window.history.replaceState({}, '', '/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation helper with auth protection
  const navigateTo = useCallback(
    (screen: Screen, options?: { activityId?: string; replace?: boolean; userOverride?: AuthUser | null }) => {
      const authedUser = options?.userOverride !== undefined ? options.userOverride : currentUser;
      const isAuthPage = screen === 'login' || screen === 'signup';

      if (!authedUser && !isAuthPage) {
        setRedirectAfterLogin({ screen, activityId: options?.activityId });
        setRedirectNotice('Please log in to view that page.');
        setCurrentScreen('login');
        const method = options?.replace ? 'replaceState' : 'pushState';
        window.history[method]({}, '', '/login');
        return;
      }

      if (authedUser && isAuthPage) {
        setCurrentScreen('dashboard');
        setSelectedActivityId(undefined);
        window.history.replaceState({}, '', '/dashboard');
        return;
      }

      setCurrentScreen(screen);
      setSelectedActivityId(options?.activityId);
      if (isAuthPage && screen === 'signup') {
        setRedirectNotice(null);
      }
      const targetPath = routeToPath(screen, options?.activityId);
      if (window.location.pathname !== targetPath) {
        const method = options?.replace ? 'replaceState' : 'pushState';
        window.history[method]({}, '', targetPath);
      }
    },
    [currentUser]
  );

  // Browser Back/Forward listener with protected route enforcement
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parsePathname(window.location.pathname);
      if (!currentUser) {
        if (parsed.screen === 'login' || parsed.screen === 'signup') {
          setCurrentScreen(parsed.screen);
        } else {
          if (!parsed.isRoot && !parsed.isUnknown) {
            setRedirectAfterLogin({ screen: parsed.screen, activityId: parsed.activityId });
            setRedirectNotice('Please log in to view that page.');
          }
          setCurrentScreen('login');
          window.history.replaceState({}, '', '/login');
        }
        return;
      }

      if (parsed.isRoot || parsed.isUnknown || parsed.screen === 'login' || parsed.screen === 'signup') {
        setCurrentScreen('dashboard');
        setSelectedActivityId(undefined);
        window.history.replaceState({}, '', '/dashboard');
        return;
      }

      setCurrentScreen(parsed.screen);
      setSelectedActivityId(parsed.activityId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  // Handle 401 session expiration from any API call
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAccessToken(null);
      setCurrentUser(null);
      setActivities([]);
      setActiveSession(null);
      setIsWorkoutModalOpen(false);
      setIsWorkoutMinimized(false);
      setDeleteTarget(null);
      setIsSettingsOpen(false);
      setIsAboutOpen(false);
      setSelectedActivityId(undefined);
      setRedirectNotice('Your session expired. Please log in again.');
      setCurrentScreen('login');
      window.history.replaceState({}, '', '/login');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Load current user's isolated activities
  const loadUserActivities = useCallback(async () => {
    setIsLoadingActivities(true);
    try {
      const res = await activityService.fetchActivities();
      if (res.error) {
        showToast(res.error);
      }
      setActivities(res.activities);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [showToast]);

  const handleAuthSuccess = async (user: AuthUser) => {
    setCurrentUser(user);
    setRedirectNotice(null);
    const target = redirectAfterLogin;
    setRedirectAfterLogin(null);

    if (target && target.screen !== 'login' && target.screen !== 'signup') {
      navigateTo(target.screen, {
        activityId: target.activityId,
        replace: true,
        userOverride: user,
      });
    } else {
      navigateTo('dashboard', { replace: true, userOverride: user });
    }

    await loadUserActivities();
    showToast(`Welcome, ${user.name}!`);
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setActivities([]);
    setActiveSession(null);
    setIsWorkoutModalOpen(false);
    setIsWorkoutMinimized(false);
    setDeleteTarget(null);
    setIsSettingsOpen(false);
    setIsAboutOpen(false);
    setSelectedActivityId(undefined);
    setRedirectAfterLogin(null);
    setRedirectNotice(null);
    setCurrentScreen('login');
    window.history.replaceState({}, '', '/login');
    showToast('You have logged out.');
  };

  // Profile & preferences persistence
  const handleUpdateProfile = async (updated: UserProfile) => {
    const res = await authService.updateProfile({
      name: updated.name,
      subtitle: updated.subtitle,
      presetAvatar: updated.presetAvatar,
      avatarUrl: updated.avatarUrl,
    });
    if (res.user) {
      setCurrentUser(res.user);
      showToast('Profile updated.');
    } else if (res.error) {
      showToast(res.error);
    }
  };

  const handleSetDailyGoal = async (mins: number) => {
    const res = await authService.updateProfile({ dailyGoalMinutes: mins });
    if (res.user) {
      setCurrentUser(res.user);
      showToast(`Daily goal set to ${mins} minutes.`);
    } else if (res.error) {
      showToast(res.error);
    }
  };

  const handleSetDefaultActivity = async (activityName: string) => {
    const res = await authService.updateProfile({ defaultActivity: activityName });
    if (res.user) {
      setCurrentUser(res.user);
      showToast(`Quick Start set to ${activityName}.`);
    } else if (res.error) {
      showToast(res.error);
    }
  };

  // Live Workout Stopwatch Effect
  useEffect(() => {
    if (!activeSession || !activeSession.isActive || activeSession.isPaused) return;
    const interval = window.setInterval(() => {
      setActiveSession((prev) => {
        if (!prev || !prev.isActive || prev.isPaused) return prev;
        return { ...prev, secondsElapsed: prev.secondsElapsed + 1 };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeSession?.isActive, activeSession?.isPaused]);

  const handleStartQuickWorkout = (activityName?: string) => {
    const chosen = activityName || currentUser?.defaultActivity || 'Running';
    setActiveSession({
      isActive: true,
      isPaused: false,
      activityName: chosen,
      secondsElapsed: 0,
      startedAt: Date.now(),
      laps: [],
    });
    setIsWorkoutMinimized(false);
    setIsWorkoutModalOpen(true);
    showToast(`Timer started for ${chosen}`);
  };

  const handleToggleWorkoutPause = () => {
    setActiveSession((prev) => (prev ? { ...prev, isPaused: !prev.isPaused } : null));
  };

  const handleRecordWorkoutLap = () => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const previousLapTime =
        prev.laps.length > 0 ? prev.laps[prev.laps.length - 1].timeSeconds : 0;
      const splitSeconds = prev.secondsElapsed - previousLapTime;
      return {
        ...prev,
        laps: [
          ...prev.laps,
          {
            lapNumber: prev.laps.length + 1,
            timeSeconds: prev.secondsElapsed,
            splitSeconds,
          },
        ],
      };
    });
    showToast('Lap recorded');
  };

  const handleChangeWorkoutActivity = (newName: string) => {
    setActiveSession((prev) => (prev ? { ...prev, activityName: newName } : null));
  };

  const handleFinishWorkout = async (notes?: string, customName?: string) => {
    if (!activeSession) return;
    const elapsedSecs = activeSession.secondsElapsed;
    const durationMinutes = Math.max(1, Math.round(elapsedSecs / 60));
    const actName = customName || activeSession.activityName || 'Running';
    const cat = detectCategoryFromName(actName);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    setActiveSession(null);
    setIsWorkoutModalOpen(false);
    setIsWorkoutMinimized(false);

    await handleCreateActivity({
      name: actName,
      date: todayStr,
      durationMinutes,
      status: 'Completed',
      category: cat,
      description:
        notes ||
        `Quick workout completed (${Math.floor(elapsedSecs / 60)}m ${elapsedSecs % 60}s)`,
    });
  };

  const handleDiscardWorkout = () => {
    setActiveSession(null);
    setIsWorkoutModalOpen(false);
    setIsWorkoutMinimized(false);
    showToast('Workout session discarded.');
  };

  const handleResumeWorkout = () => {
    setIsWorkoutMinimized(false);
    setIsWorkoutModalOpen(true);
  };

  const handleToggleMinimize = () => {
    setIsWorkoutMinimized((prev) => !prev);
  };

  // CRUD Handlers
  const handleCreateActivity = async (data: Omit<Activity, 'id' | 'createdAt' | 'userId'>) => {
    const res = await activityService.createActivity(data);
    if (res.activity) {
      setActivities((prev) => [res.activity!, ...prev]);
      navigateTo('list');
      showToast('Activity saved to your account.');
      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore confetti error
      }
    } else if (res.error) {
      showToast(res.error);
    }
  };

  const handleSelectActivity = (act: Activity) => {
    navigateTo('details', { activityId: act.id });
  };

  const handleUpdateActivity = async (updated: Activity) => {
    const res = await activityService.updateActivity(updated);
    if (res.activity) {
      setActivities((prev) =>
        prev.map((act) => (act.id === res.activity!.id ? res.activity! : act))
      );
      navigateTo('details', { activityId: res.activity.id });
      showToast('Activity updated.');
    } else if (res.error) {
      showToast(res.error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const res = await activityService.deleteActivity(targetId);
    if (res.success) {
      setActivities((prev) => prev.filter((a) => a.id !== targetId));
      setDeleteTarget(null);
      navigateTo('list', { replace: true });
      showToast('Activity deleted.');
    } else {
      setDeleteTarget(null);
      showToast(res.error || 'Could not delete activity.');
    }
  };

  const handleLoadSampleData = async () => {
    const res = await activityService.seedSampleData();
    if (res.activities) {
      setActivities(res.activities);
      showToast('Starter activities added to your account.');
    } else if (res.error) {
      showToast(res.error);
    }
  };

  const selectedActivity = selectedActivityId
    ? activities.find((a) => a.id === selectedActivityId) || null
    : null;

  // Recover gracefully if detail/edit URL targets a non-existent or unowned activity
  useEffect(() => {
    if (
      currentUser &&
      !isLoadingActivities &&
      (currentScreen === 'details' || currentScreen === 'edit') &&
      !selectedActivity
    ) {
      navigateTo('list', { replace: true });
    }
  }, [currentUser, isLoadingActivities, currentScreen, selectedActivity, navigateTo]);

  const handleMobileBack = () => {
    if (currentScreen === 'edit' && selectedActivity) {
      navigateTo('details', { activityId: selectedActivity.id });
    } else if (currentScreen === 'details') {
      navigateTo('list');
    } else if (currentScreen === 'statistics') {
      navigateTo('profile');
    } else {
      navigateTo('dashboard');
    }
  };

  return (
    <>
      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}

      {!currentUser ? (
        <AuthScreen
          mode={currentScreen === 'signup' ? 'signup' : 'login'}
          onSwitchMode={(mode) => navigateTo(mode)}
          onAuthSuccess={handleAuthSuccess}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          redirectNotice={redirectNotice}
        />
      ) : (
        <AppShell
          user={currentUser}
          currentScreen={currentScreen}
          activeTab={screenToTab(currentScreen)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onNavigate={(screen) => navigateTo(screen)}
          onBack={handleMobileBack}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={handleLogout}
        >
          {currentScreen === 'dashboard' && (
            <HomeScreen
              user={currentUser}
              activities={activities}
              isLoadingActivities={isLoadingActivities}
              onSetDefaultActivity={handleSetDefaultActivity}
              onOpenProfile={() => navigateTo('profile')}
              activeSession={activeSession}
              onStartQuickWorkout={handleStartQuickWorkout}
              onResumeWorkout={handleResumeWorkout}
              onViewAll={() => navigateTo('list')}
              onSelectActivity={handleSelectActivity}
              onAddNew={() => navigateTo('add')}
              onLoadSampleData={handleLoadSampleData}
            />
          )}

          {currentScreen === 'list' && (
            <ActivityListScreen
              activities={activities}
              onSelectActivity={handleSelectActivity}
              onAddNew={() => navigateTo('add')}
              onLoadSampleData={handleLoadSampleData}
            />
          )}

          {currentScreen === 'add' && (
            <AddActivityScreen
              onSave={handleCreateActivity}
              onCancel={() => navigateTo('list')}
            />
          )}

          {currentScreen === 'details' && selectedActivity && (
            <ActivityDetailScreen
              activity={selectedActivity}
              onBack={() => navigateTo('list')}
              onEdit={() => navigateTo('edit', { activityId: selectedActivity.id })}
              onDeleteRequest={() => setDeleteTarget(selectedActivity)}
            />
          )}

          {currentScreen === 'edit' && selectedActivity && (
            <EditActivityScreen
              activity={selectedActivity}
              onUpdate={handleUpdateActivity}
              onCancel={() => navigateTo('details', { activityId: selectedActivity.id })}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileScreen
              user={currentUser}
              activities={activities}
              isDarkMode={isDarkMode}
              onToggleDarkMode={handleToggleDarkMode}
              onUpdateProfile={handleUpdateProfile}
              onSetDailyGoal={handleSetDailyGoal}
              onNavigateToActivities={() => navigateTo('list')}
              onNavigateToStatistics={() => navigateTo('statistics')}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenAbout={() => setIsAboutOpen(true)}
              onLogout={handleLogout}
            />
          )}

          {currentScreen === 'statistics' && (
            <StatisticsScreen
              activities={activities}
              onBack={() => navigateTo('profile')}
            />
          )}
        </AppShell>
      )}

      {/* Global Overlays (authenticated workspace) */}
      {currentUser && (
        <>
          <DeleteConfirmDialog
            isOpen={deleteTarget !== null}
            activityName={deleteTarget?.name || ''}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />

          {activeSession &&
            activeSession.isActive &&
            (isWorkoutMinimized || !isWorkoutModalOpen) && (
              <FloatingMiniTimer
                session={activeSession}
                onTogglePause={handleToggleWorkoutPause}
                onMaximize={handleResumeWorkout}
                onFinishPrompt={handleResumeWorkout}
              />
            )}

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onResetData={handleLoadSampleData}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            defaultActivity={currentUser.defaultActivity}
            onSetDefaultActivity={handleSetDefaultActivity}
          />

          <AboutModal
            isOpen={isAboutOpen}
            onClose={() => setIsAboutOpen(false)}
          />

          {activeSession && (
            <ActiveWorkoutModal
              session={activeSession}
              isOpen={isWorkoutModalOpen}
              isMinimized={isWorkoutMinimized}
              onTogglePause={handleToggleWorkoutPause}
              onRecordLap={handleRecordWorkoutLap}
              onFinish={handleFinishWorkout}
              onDiscard={handleDiscardWorkout}
              onToggleMinimize={handleToggleMinimize}
              onChangeActivityName={handleChangeWorkoutActivity}
            />
          )}
        </>
      )}
    </>
  );
}
