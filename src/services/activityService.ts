import { Activity } from '../types';
import { getAccessToken, notifyUnauthorized } from './authTokenStore';

function getAuthHeaders(withJson = false): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (withJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const activityService = {
  async fetchActivities(): Promise<{ activities: Activity[]; error?: string }> {
    const token = getAccessToken();
    if (!token) {
      notifyUnauthorized();
      return { activities: [], error: 'Authentication required.' };
    }

    try {
      const res = await fetch('/api/activities', {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        notifyUnauthorized();
        return { activities: [], error: 'Session expired. Please log in.' };
      }
      if (res.ok) {
        const data = await res.json();
        return { activities: Array.isArray(data.activities) ? data.activities : [] };
      }
      const errData = await res.json().catch(() => ({}));
      return { activities: [], error: errData.error || 'Failed to load activities.' };
    } catch {
      return { activities: [], error: 'Network error loading activities.' };
    }
  },

  async createActivity(
    activityData: Omit<Activity, 'id' | 'createdAt' | 'userId'>
  ): Promise<{ activity?: Activity; error?: string }> {
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(activityData),
      });
      if (res.status === 401) {
        notifyUnauthorized();
        return { error: 'Please log in to continue.' };
      }
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to save activity.' };
      }
      return { activity: data.activity };
    } catch {
      return { error: 'Network error while saving activity.' };
    }
  },

  async updateActivity(activity: Activity): Promise<{ activity?: Activity; error?: string }> {
    try {
      const res = await fetch(`/api/activities/${encodeURIComponent(activity.id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          name: activity.name,
          date: activity.date,
          durationMinutes: activity.durationMinutes,
          status: activity.status,
          category: activity.category,
          description: activity.description,
        }),
      });
      if (res.status === 401) {
        notifyUnauthorized();
        return { error: 'Please log in to continue.' };
      }
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to update activity.' };
      }
      return { activity: data.activity };
    } catch {
      return { error: 'Network error while updating activity.' };
    }
  },

  async deleteActivity(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/activities/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.status === 401) {
        notifyUnauthorized();
        return { success: false, error: 'Please log in to continue.' };
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Failed to delete activity.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error while deleting activity.' };
    }
  },

  async seedSampleData(): Promise<{ activities?: Activity[]; error?: string }> {
    try {
      const res = await fetch('/api/activities/seed', {
        method: 'POST',
        headers: getAuthHeaders(true),
      });
      if (res.status === 401) {
        notifyUnauthorized();
        return { error: 'Please log in to continue.' };
      }
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Failed to load sample activities.' };
      }
      return { activities: Array.isArray(data.activities) ? data.activities : [] };
    } catch {
      return { error: 'Network error loading sample activities.' };
    }
  },
};
