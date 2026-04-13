import axios, { AxiosError, type AxiosResponse } from 'axios';

// API client configuration
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      // Extract error message from API response
      const errorMessage = (data as any)?.error?.message || 'An error occurred';
      
      // Create enhanced error with user-friendly message
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).status = status;
      (enhancedError as any).code = (data as any)?.error?.code;
      (enhancedError as any).type = (data as any)?.error?.type;
      
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Network error
      return Promise.reject(new Error('Network error - please check your connection'));
    } else {
      // Request setup error
      return Promise.reject(new Error('Request configuration error'));
    }
  }
);

// API error type for TypeScript
export interface ApiError extends Error {
  status?: number;
  code?: string;
  type?: string;
}

// Helper function to check if error is API error
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof Error && 'status' in error;
};