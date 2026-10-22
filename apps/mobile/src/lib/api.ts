import { Platform } from 'react-native';
import { StorageService } from '../services/storage';
import { ApiResponse } from '../types';

// Read configurable API URL
const DEFAULT_URL = Platform.select({
  android: 'http://10.0.2.2:4000/api',
  default: 'http://localhost:4000/api',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;

export class ApiError extends Error {
  statusCode: number;
  errors?: { field: string; message: string }[];

  constructor(message: string, statusCode = 500, errors?: { field: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Append query params if present
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Inject Authorization header
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const token = await StorageService.getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If body is NOT FormData, set Content-Type: application/json
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      message: response.statusText || 'Unable to parse server response',
      data: null as any,
    }));

    if (response.status === 401) {
      // Clear token and notify app to redirect to login
      await StorageService.clearAll();
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
      throw new ApiError(data.message || 'Session expired. Please log in again.', 401);
    }

    if (!response.ok || data.success === false) {
      throw new ApiError(data.message || 'An error occurred with your request', response.status, data.errors);
    }

    return data.data;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or offline error
    console.error(`[API Network Error] ${url}:`, err);
    throw new ApiError(
      'Network request failed. Please check that the MiniLedger server is running and reachable.',
      0
    );
  }
}

export const apiClient = {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return request<T>(endpoint, { method: 'GET', params });
  },

  post<T>(endpoint: string, data?: any): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  patch<T>(endpoint: string, data?: any): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
  },

  upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  },
};
