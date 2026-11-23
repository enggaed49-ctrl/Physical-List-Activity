import { AuthUser } from '../types';
import { getAccessToken, setAccessToken } from './authTokenStore';

export interface AuthResponse {
  user?: AuthUser;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export const authService = {
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Could not create account.', fieldErrors: data.fieldErrors };
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
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Invalid email or password.', fieldErrors: data.fieldErrors };
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

  async updateProfile(updates: Partial<Pick<AuthUser, 'name' | 'subtitle' | 'presetAvatar' | 'avatarUrl' | 'dailyGoalMinutes' | 'defaultActivity'>>): Promise<AuthResponse> {
    const token = getAccessToken();
    if (!token) {
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
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Could not update profile.' };
      }
      return { user: data.user };
    } catch {
      return { error: 'Network error while updating profile.' };
    }
  },
};
