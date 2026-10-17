import { Activity, CloudSyncStatus } from '../types';
import { loadStoredActivities, saveStoredActivities, INITIAL_ACTIVITIES } from '../data/initialActivities';

export const activityService = {
  // Check Supabase connection and table status
  async getStatus(): Promise<CloudSyncStatus> {
    try {
      const res = await fetch('/api/status', {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return {
          connected: Boolean(data.connected),
          tableExists: Boolean(data.tableExists),
          projectId: data.projectId || 'kfgaxqydqswciypgydde',
          message: data.message || '',
          mode: data.connected && data.tableExists ? 'cloud' : 'local',
        };
      }
    } catch {
      // Offline or server not responding
    }

    return {
      connected: false,
      tableExists: false,
      projectId: 'kfgaxqydqswciypgydde',
      message: 'Running in offline local storage mode.',
      mode: 'local',
    };
  },

  // Fetch all activities: cloud first, local cache fallback
  async fetchActivities(): Promise<{ activities: Activity[]; mode: 'cloud' | 'local'; error?: string }> {
    try {
      const res = await fetch('/api/activities');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.activities)) {
          // If cloud has activities, sync into local storage as offline cache
          if (data.activities.length > 0) {
            saveStoredActivities(data.activities);
            return { activities: data.activities, mode: 'cloud' };
          } else {
            // Cloud table is empty, seed with initial or local activities
            const local = loadStoredActivities();
            return { activities: local, mode: 'cloud' };
          }
        }
      }
    } catch {
      // Fallback
    }

    const localData = loadStoredActivities();
    return { activities: localData, mode: 'local' };
  },

  // Create activity
  async createActivity(activityData: Omit<Activity, 'id' | 'createdAt'>): Promise<{ activity: Activity; mode: 'cloud' | 'local' }> {
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.activity) {
          return { activity: data.activity, mode: 'cloud' };
        }
      }
    } catch {
      // Cloud create failed, fall through to local
    }

    // Local fallback
    const localActivity: Activity = {
      ...activityData,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    return { activity: localActivity, mode: 'local' };
  },

  // Update activity
  async updateActivity(activity: Activity): Promise<{ activity: Activity; mode: 'cloud' | 'local' }> {
    try {
      const res = await fetch(`/api/activities/${encodeURIComponent(activity.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: activity.name,
          date: activity.date,
          durationMinutes: activity.durationMinutes,
          status: activity.status,
          category: activity.category,
          description: activity.description,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.activity) {
          return { activity: data.activity, mode: 'cloud' };
        }
      }
    } catch {
      // Fallback
    }

    return { activity, mode: 'local' };
  },

  // Delete activity
  async deleteActivity(id: string): Promise<{ success: boolean; mode: 'cloud' | 'local' }> {
    try {
      const res = await fetch(`/api/activities/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        return { success: true, mode: 'cloud' };
      }
    } catch {
      // Fallback
    }

    return { success: true, mode: 'local' };
  },

  // Seed sample activities to Supabase
  async seedSampleData(): Promise<{ success: boolean; activities: Activity[] }> {
    try {
      const res = await fetch('/api/activities/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.activities) && data.activities.length > 0) {
          saveStoredActivities(data.activities);
          return { success: true, activities: data.activities };
        }
      }
    } catch {
      // Fallback
    }

    saveStoredActivities(INITIAL_ACTIVITIES);
    return { success: true, activities: INITIAL_ACTIVITIES };
  },
};
