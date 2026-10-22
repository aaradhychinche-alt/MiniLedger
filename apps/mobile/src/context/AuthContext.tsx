import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { apiClient, registerUnauthorizedHandler } from '../lib/api';
import { queryClient } from '../lib/queryClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const segments = useSegments();

  // Load stored credentials on mount
  useEffect(() => {
    async function loadAuth() {
      try {
        const storedToken = await StorageService.getToken();
        const storedUser = await StorageService.getUser();

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(storedUser);
          }

          // Verify token validity in background
          try {
            const res = await apiClient.get<{ user: User }>('/auth/me');
            if (res.user) {
              setUser(res.user);
              await StorageService.setUser(res.user);
            }
          } catch (e: any) {
            if (e.statusCode === 401) {
              await StorageService.clearAll();
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load auth state:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAuth();

    // Register 401 interception handler
    registerUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      queryClient.clear();
      router.replace('/(auth)/login');
    });
  }, [router]);

  // Protected route navigation guard
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      // Redirect unauthenticated user to login screen
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Redirect logged-in user away from login to dashboard
      router.replace('/(tabs)');
    }
  }, [token, segments, isLoading, router]);

  const login = async (newToken: string, newUser: User) => {
    await StorageService.setToken(newToken);
    await StorageService.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
    router.replace('/(tabs)');
  };

  const logout = async () => {
    await StorageService.clearAll();
    queryClient.clear();
    setToken(null);
    setUser(null);
    router.replace('/(auth)/login');
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await apiClient.get<{ user: User }>('/auth/me');
      if (res.user) {
        setUser(res.user);
        await StorageService.setUser(res.user);
      }
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
