import { AuthUser, UserLoginEvent } from '../types';
import { getAccessToken, notifyUnauthorized, setAccessToken } from './authTokenStore';

export interface AuthResponse {
  user?: AuthUser;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface ProfileUpdatePayload {
  name?: string;
  subtitle?: string;
  presetAvatar?: string | null;
  avatarUrl?: string | null;
  dailyGoalMinutes?: number;
  defaultActivity?: string;
}

export const authService = {
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: data.error || `Could not create account (HTTP ${res.status}).`, fieldErrors: data.fieldErrors };
      }
      if (data.token && data.user) {
        setAccessToken(data.token);
        return { user: data.user };
      }
      return { error: 'Unexpected server response.' };
    } catch {
      return { error: 'Network error. Please check your connection and try again.' };
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: data.error || `Could not sign in (HTTP ${res.status}).`, fieldErrors: data.fieldErrors };
      }
      if (data.token && data.user) {
        setAccessToken(data.token);
        return { user: data.user };
      }
      return { error: 'Unexpected server response.' };
    } catch {
      return { error: 'Network error. Please check your connection and try again.' };
    }
  },

  async logout(): Promise<void> {
    const token = getAccessToken();
    setAccessToken(null);
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Clear local session regardless
    }
  },

  async updateProfile(updates: ProfileUpdatePayload): Promise<AuthResponse> {
    const token = getAccessToken();
    if (!token) {
      notifyUnauthorized();
      return { error: 'Authentication required.' };
    }
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.status === 401) {
        notifyUnauthorized();
        return { error: 'Session expired. Please log in again.' };
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: data.error || `Could not update profile (HTTP ${res.status}).` };
      }
      return { user: data.user };
    } catch {
      return { error: 'Network error while updating profile.' };
    }
  },

  async getLoginHistory(): Promise<{ logins: UserLoginEvent[]; error?: string }> {
    const token = getAccessToken();
    if (!token) {
      return { logins: [], error: 'Authentication required.' };
    }
    try {
      const res = await fetch('/api/auth/logins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        notifyUnauthorized();
        return { logins: [], error: 'Session expired. Please log in again.' };
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { logins: [], error: data.error || `Could not load sign-in history (HTTP ${res.status}).` };
      }
      return { logins: Array.isArray(data.logins) ? data.logins : [] };
    } catch {
      return { logins: [], error: 'Network error loading sign-in history.' };
    }
  },
};
