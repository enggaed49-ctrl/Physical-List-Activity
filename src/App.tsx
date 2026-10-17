import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Activity, BottomNavTab, Screen, CloudSyncStatus, WorkoutSession, UserProfile } from './types';
import { 
  loadStoredActivities, 
  saveStoredActivities, 
  INITIAL_ACTIVITIES,
  WELCOME_SEEN_KEY 
} from './data/initialActivities';
import { activityService } from './services/activityService';
import { AndroidFrame } from './components/AndroidFrame';
import { BottomNavigation } from './components/BottomNavigation';
import { WelcomeScreen } from './components/WelcomeScreen';
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
import { SupabaseModal } from './components/SupabaseModal';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { FloatingMiniTimer } from './components/FloatingMiniTimer';
import { detectCategoryFromName } from './utils/activityIcons';

export default function App() {
  // Activity Storage State
  const [activities, setActivities] = useState<Activity[]>(() => loadStoredActivities());

  // Cloud Sync State
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>({
    connected: false,
    tableExists: false,
    projectId: 'kfgaxqydqswciypgydde',
    message: 'Checking Supabase cloud connection...',
    mode: 'local',
  });

  // Navigation States
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const seen = localStorage.getItem(WELCOME_SEEN_KEY);
    return seen ? 'home' : 'welcome';
  });

  const [activeTab, setActiveTab] = useState<BottomNavTab>('home');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Modals & Dialogs State
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dark Mode State with LocalStorage Persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('activity_tracker_dark_mode');
      if (saved !== null) {
        return saved === 'true';
      }
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const handleToggleDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
    try {
      localStorage.setItem('activity_tracker_dark_mode', String(enabled));
    } catch {
      // ignore
    }
  };

  // Quick Start Default Activity State (persisted)
  const [defaultActivity, setDefaultActivity] = useState<string>(() => {
    try {
      return localStorage.getItem('quick_start_default_activity') || 'Running';
    } catch {
      return 'Running';
    }
  });

  const handleSetDefaultActivity = (act: string) => {
    setDefaultActivity(act);
    try {
      localStorage.setItem('quick_start_default_activity', act);
    } catch {
      // ignore
    }
    showToast(`Quick Start default set to ${act}`);
  };

  // Daily Goal State (persisted, default: 60 mins)
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('user_daily_goal_minutes');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // ignore
    }
    return 60;
  });

  const handleSetDailyGoal = (mins: number) => {
    setDailyGoalMinutes(mins);
    try {
      localStorage.setItem('user_daily_goal_minutes', String(mins));
    } catch {
      // ignore
    }
    showToast(`Daily goal set to ${mins} minutes!`);
  };

  // User Profile State (persisted)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('physical_list_user_profile_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return {
      name: 'Guest User',
      subtitle: 'Stay active, stay healthy!',
    };
  });

  const handleUpdateProfile = (updated: UserProfile) => {
    setUserProfile(updated);
    try {
      localStorage.setItem('physical_list_user_profile_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast('Profile updated!');
  };

  // Active Workout Session State
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);

  // Live Timer Interval Effect for Active Workout
  useEffect(() => {
    if (!activeSession || !activeSession.isActive || activeSession.isPaused) return;

    const interval = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev || !prev.isActive || prev.isPaused) return prev;
        return {
          ...prev,
          secondsElapsed: prev.secondsElapsed + 1,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.isActive, activeSession?.isPaused]);

  // Workout Session Action Handlers
  const handleStartQuickWorkout = (activityName?: string) => {
    const chosen = activityName || defaultActivity;
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
    showToast(`Timer started for ${chosen}!`);
  };

  const handleToggleWorkoutPause = () => {
    setActiveSession((prev) => {
      if (!prev) return null;
      return { ...prev, isPaused: !prev.isPaused };
    });
  };

  const handleRecordWorkoutLap = () => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const previousLapTime = prev.laps.length > 0 
        ? prev.laps[prev.laps.length - 1].timeSeconds 
        : 0;
      const splitSeconds = prev.secondsElapsed - previousLapTime;
      const newLap = {
        lapNumber: prev.laps.length + 1,
        timeSeconds: prev.secondsElapsed,
        splitSeconds,
      };
      return {
        ...prev,
        laps: [...prev.laps, newLap],
      };
    });
    showToast('Lap recorded!');
  };

  const handleChangeWorkoutActivity = (newName: string) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      return { ...prev, activityName: newName };
    });
  };

  const handleFinishWorkout = async (notes?: string, customName?: string) => {
    if (!activeSession) return;
    const elapsedSecs = activeSession.secondsElapsed;
    const durationMinutes = Math.max(1, Math.round(elapsedSecs / 60));
    const actName = customName || activeSession.activityName || defaultActivity;
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
      description: notes || `Quick workout session completed (${Math.floor(elapsedSecs / 60)}m ${elapsedSecs % 60}s elapsed)`,
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

  // Refresh status and sync activities
  const refreshCloudStatus = useCallback(async () => {
    const status = await activityService.getStatus();
    setCloudStatus(status);
    if (status.connected && status.tableExists) {
      const res = await activityService.fetchActivities();
      if (res.activities && res.activities.length > 0) {
        setActivities(res.activities);
      }
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    refreshCloudStatus();
  }, [refreshCloudStatus]);

  // Sync state to LocalStorage whenever activities change
  useEffect(() => {
    saveStoredActivities(activities);
  }, [activities]);

  // Temporary toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 1. Splash Screen Action
  const handleGetStarted = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, 'true');
    setCurrentScreen('home');
    setActiveTab('home');
  };

  // 2. Bottom Navigation Tab Selection
  const handleSelectTab = (tab: BottomNavTab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setCurrentScreen('home');
    } else if (tab === 'add') {
      setCurrentScreen('add');
    } else if (tab === 'list') {
      setCurrentScreen('list');
    } else if (tab === 'profile') {
      setCurrentScreen('profile');
    }
  };

  // 3. Create Activity (CRUD - CREATE)
  const handleCreateActivity = async (data: Omit<Activity, 'id' | 'createdAt'>) => {
    const res = await activityService.createActivity(data);
    const newActivity = res.activity;

    setActivities((prev) => [newActivity, ...prev]);
    setSelectedActivity(newActivity);
    setActiveTab('list');
    setCurrentScreen('list');
    showToast(res.mode === 'cloud' ? 'Activity saved to Supabase!' : 'Activity saved locally!');

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
  };

  // 4. View Activity Details (CRUD - READ)
  const handleSelectActivity = (act: Activity) => {
    setSelectedActivity(act);
    setCurrentScreen('details');
  };

  // 5. Edit Activity (CRUD - UPDATE)
  const handleStartEdit = () => {
    if (selectedActivity) {
      setCurrentScreen('edit');
    }
  };

  const handleUpdateActivity = async (updated: Activity) => {
    const res = await activityService.updateActivity(updated);
    setActivities((prev) =>
      prev.map((act) => (act.id === res.activity.id ? res.activity : act))
    );
    setSelectedActivity(res.activity);
    setCurrentScreen('details');
    showToast(res.mode === 'cloud' ? 'Activity updated in Supabase!' : 'Activity updated locally!');
  };

  // 6. Delete Activity (CRUD - DELETE)
  const handleDeleteRequest = () => {
    if (selectedActivity) {
      setDeleteTarget(selectedActivity);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      const targetId = deleteTarget.id;
      await activityService.deleteActivity(targetId);
      setActivities((prev) => prev.filter((a) => a.id !== targetId));
      setDeleteTarget(null);
      setSelectedActivity(null);
      setCurrentScreen('list');
      setActiveTab('list');
      showToast('Activity deleted.');
    }
  };

  // Reset to initial sample data
  const handleResetSampleData = async () => {
    const res = await activityService.seedSampleData();
    setActivities(res.activities);
    showToast('Sample activities restored.');
  };

  // Check if bottom navigation should be visible on current screen
  const shouldShowBottomNav = currentScreen !== 'welcome';

  return (
    <AndroidFrame activeScreenTitle="Physical List Activity System" isDarkMode={isDarkMode}>
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Views Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* 1. Splash / Welcome Screen */}
        {currentScreen === 'welcome' && (
          <WelcomeScreen onGetStarted={handleGetStarted} />
        )}

        {/* 2. Home / Dashboard Screen */}
        {currentScreen === 'home' && (
          <HomeScreen
            activities={activities}
            cloudStatus={cloudStatus}
            userProfile={userProfile}
            defaultActivity={defaultActivity}
            onSetDefaultActivity={handleSetDefaultActivity}
            dailyGoalMinutes={dailyGoalMinutes}
            onOpenProfile={() => {
              setActiveTab('profile');
              setCurrentScreen('profile');
            }}
            activeSession={activeSession}
            onStartQuickWorkout={handleStartQuickWorkout}
            onResumeWorkout={handleResumeWorkout}
            onOpenSupabase={() => setIsSupabaseOpen(true)}
            onViewAll={() => {
              setActiveTab('list');
              setCurrentScreen('list');
            }}
            onSelectActivity={handleSelectActivity}
            onAddNew={() => {
              setActiveTab('add');
              setCurrentScreen('add');
            }}
          />
        )}

        {/* 3. Activity List Screen */}
        {currentScreen === 'list' && (
          <ActivityListScreen
            activities={activities}
            onSelectActivity={handleSelectActivity}
            onAddNew={() => {
              setActiveTab('add');
              setCurrentScreen('add');
            }}
          />
        )}

        {/* 4. Add Activity Screen */}
        {currentScreen === 'add' && (
          <AddActivityScreen
            onSave={handleCreateActivity}
            onCancel={() => {
              setActiveTab('list');
              setCurrentScreen('list');
            }}
          />
        )}

        {/* 5. Activity Details Screen */}
        {currentScreen === 'details' && selectedActivity && (
          <ActivityDetailScreen
            activity={selectedActivity}
            onBack={() => {
              setCurrentScreen(activeTab === 'home' ? 'home' : 'list');
            }}
            onEdit={handleStartEdit}
            onDeleteRequest={handleDeleteRequest}
          />
        )}

        {/* 6. Edit Activity Screen */}
        {currentScreen === 'edit' && selectedActivity && (
          <EditActivityScreen
            activity={selectedActivity}
            onUpdate={handleUpdateActivity}
            onCancel={() => {
              setCurrentScreen('details');
            }}
          />
        )}

        {/* 7. Profile Screen */}
        {currentScreen === 'profile' && (
          <ProfileScreen
            activities={activities}
            cloudStatus={cloudStatus}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            dailyGoalMinutes={dailyGoalMinutes}
            onSetDailyGoal={handleSetDailyGoal}
            onNavigateToActivities={() => {
              setActiveTab('list');
              setCurrentScreen('list');
            }}
            onNavigateToStatistics={() => {
              setCurrentScreen('statistics');
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAbout={() => setIsAboutOpen(true)}
            onOpenWelcome={() => setCurrentScreen('welcome')}
            onOpenSupabase={() => setIsSupabaseOpen(true)}
          />
        )}

        {/* 8. Statistics Screen */}
        {currentScreen === 'statistics' && (
          <StatisticsScreen
            activities={activities}
            onBack={() => {
              setCurrentScreen('profile');
              setActiveTab('profile');
            }}
          />
        )}
      </div>

      {/* Persistent Bottom Navigation Bar */}
      {shouldShowBottomNav && (
        <BottomNavigation
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        activityName={deleteTarget?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Floating Mini Workout Timer when session active and minimized or browsing other screens */}
      {activeSession && activeSession.isActive && (isWorkoutMinimized || !isWorkoutModalOpen) && (
        <FloatingMiniTimer
          session={activeSession}
          onTogglePause={handleToggleWorkoutPause}
          onMaximize={handleResumeWorkout}
          onFinishPrompt={handleResumeWorkout}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onResetData={handleResetSampleData}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        defaultActivity={defaultActivity}
        onSetDefaultActivity={handleSetDefaultActivity}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Supabase Connection & SQL Modal */}
      <SupabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        status={cloudStatus}
        onRefreshStatus={refreshCloudStatus}
      />

      {/* Active Workout Session Modal */}
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
    </AndroidFrame>
  );
}

