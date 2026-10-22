import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'miniledger_auth_token';
const USER_KEY = 'miniledger_user_profile';

export const StorageService = {
  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (e) {
      console.error('Error saving auth token:', e);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Error retrieving auth token:', e);
      return null;
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Error removing auth token:', e);
    }
  },

  async setUser(user: any): Promise<void> {
    try {
      const data = JSON.stringify(user);
      if (Platform.OS === 'web') {
        localStorage.setItem(USER_KEY, data);
      } else {
        await SecureStore.setItemAsync(USER_KEY, data);
      }
    } catch (e) {
      console.error('Error saving user profile:', e);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      let data: string | null = null;
      if (Platform.OS === 'web') {
        data = localStorage.getItem(USER_KEY);
      } else {
        data = await SecureStore.getItemAsync(USER_KEY);
      }
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error retrieving user profile:', e);
      return null;
    }
  },

  async clearAll(): Promise<void> {
    await this.removeToken();
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(USER_KEY);
      } else {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  },
};
