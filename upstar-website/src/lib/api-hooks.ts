'use client';

// React hooks for API integration
import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiResponse } from './api-client';

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      
      if (response.error) {
        setError(response.error.message);
        setData(null);
      } else {
        setData(response.data || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Authentication hooks
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.getProfile().then(response => {
        if (response.data) {
          setUser(response.data);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (token: string) => {
    const response = await apiClient.verifyToken(token);
    if (response.data) {
      localStorage.setItem('auth_token', token);
      setUser(response.data);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await apiClient.logout();
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const checkPermission = async (permission: string) => {
    const response = await apiClient.checkPermission(permission);
    return response.data?.hasPermission || false;
  };

  return {
    user,
    loading,
    login,
    logout,
    checkPermission,
    isAuthenticated: !!user,
  };
}

// Dashboard hooks
export function useDashboardOverview<T = any>() {
  return useApi<T>(() => apiClient.getDashboardOverview());
}

export function useDashboardAnalyticsReport<T = any>() {
  return useApi<T>(() => apiClient.getDashboardAnalyticsReport());
}

// Users hooks
export function useUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}) {
  // Stabilize the params object to prevent unnecessary re-renders
  const stableParams = React.useMemo(() => params, [
    params?.page,
    params?.limit,
    params?.search,
    params?.status,
    params?.role
  ]);
  
  return useApi(() => apiClient.getUsers(stableParams), [stableParams]);
}

export function useUser(id: string) {
  return useApi(() => apiClient.getUserById(id), [id]);
}

export function useUpdateUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.updateUser(data);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateUser, loading, error };
}

export function useLoginAsUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginAsUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.loginAsUser(userId);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loginAsUser, loading, error };
}

// Resumes hooks
export function useResumes(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useApi(() => apiClient.getResumes(params), [params]);
}

export function useResume(id: string) {
  return useApi(() => apiClient.getResumeById(id), [id]);
}

export function useReprocessResume() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reprocessResume = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.reprocessResume(id);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { reprocessResume, loading, error };
}

// Skills hooks
export function useSkillsAnalytics() {
  return useApi(() => apiClient.getSkillsAnalytics());
}

export function useSkillsErrors(params?: {
  page?: number;
  limit?: number;
}) {
  return useApi(() => apiClient.getSkillsErrors(params), [params]);
}

export function useSkillsCategories() {
  return useApi(() => apiClient.getSkillsCategories());
}

export function useSkillsTrends() {
  return useApi(() => apiClient.getSkillsTrends());
}

// Jobs hooks
export function useJobs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  remote?: boolean;
}) {
  return useApi(() => apiClient.getJobs(params), [params]);
}

export function useJob(id: string) {
  return useApi(() => apiClient.getJobById(id), [id]);
}

export function useSyncJobs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.syncJobs();
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { syncJobs, loading, error };
}

export function useJobAnalytics() {
  return useApi(() => apiClient.getJobAnalytics());
}

// Analytics hooks
export function useSkillAnalysis() {
  return useApi(() => apiClient.getSkillAnalysis());
}

export function useMarketTrends() {
  return useApi(() => apiClient.getMarketTrends());
}

export function useJobPerformance() {
  return useApi(() => apiClient.getJobPerformance());
}

export function useGeographicData() {
  return useApi(() => apiClient.getGeographicData());
}

export function useUserEngagement() {
  return useApi(() => apiClient.getUserEngagement());
}

// Payments hooks
export function useSubscriptions() {
  return useApi(() => apiClient.getSubscriptions());
}

export function useTransactions() {
  return useApi(() => apiClient.getTransactions());
}

export function usePaymentAnalytics() {
  return useApi(() => apiClient.getPaymentAnalytics());
}

export function useProcessRefund() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processRefund = async (data: {
    transactionId: string;
    amount: number;
    reason: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.processRefund(data);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { processRefund, loading, error };
}

// AI Settings hooks
export function useAISettings() {
  return useApi(() => apiClient.getAISettings());
}

export function useUpdateAISettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAISettings = async (settings: any[]) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.updateAISettings(settings);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateAISettings, loading, error };
}

export function useAIModelStatus() {
  return useApi(() => apiClient.getAIModelStatus());
}

export function useTestAIModel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAIModel = async (modelId: string, input: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.testAIModel(modelId, input);
      
      if (response.error) {
        setError(response.error.message);
        return null;
      }
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { testAIModel, loading, error };
}

export function useAIPerformance() {
  return useApi(() => apiClient.getAIPerformance());
}

// System Health hooks
export function useSystemHealth() {
  return useApi(() => apiClient.getSystemHealth());
}

export function useSystemActivity() {
  return useApi(() => apiClient.getSystemActivity());
}

export function useSystemAlerts() {
  return useApi(() => apiClient.getSystemAlerts());
}

export function useResolveSystemAlert() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolveAlert = async (alertId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.resolveSystemAlert(alertId);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { resolveAlert, loading, error };
}

export function useSystemMetrics() {
  return useApi(() => apiClient.getSystemMetrics());
}

// Notifications hooks
export function useNotificationHistory() {
  return useApi(() => apiClient.getNotificationHistory());
}

export function useSendNotification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendNotification = async (data: {
    title: string;
    content: string;
    audience: string;
    schedule: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.sendNotification(data);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { sendNotification, loading, error };
}

export function useReminders() {
  return useApi(() => apiClient.getReminders());
}

export function useCreateReminder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReminder = async (data: {
    title: string;
    description: string;
    cadence: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.createReminder(data);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { createReminder, loading, error };
}

export function useToggleReminder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleReminder = async (reminderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.toggleReminder(reminderId);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { toggleReminder, loading, error };
}

export function useNotificationTemplates() {
  return useApi(() => apiClient.getNotificationTemplates());
}

// CMS hooks
export function useCMSArticles() {
  return useApi(() => apiClient.getCMSArticles());
}

export function useCreateCMSArticle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createArticle = async (data: {
    title: string;
    slug: string;
    content: string;
    status: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.createCMSArticle(data);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { createArticle, loading, error };
}

export function useCMSArticle(id: string) {
  return useApi(() => apiClient.getCMSArticleById(id), [id]);
}

export function useUpdateCMSArticle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateArticle = async (id: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.updateCMSArticle(id, data);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { updateArticle, loading, error };
}

export function useDeleteCMSArticle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteArticle = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.deleteCMSArticle(id);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteArticle, loading, error };
}

export function useCMSCategories() {
  return useApi(() => apiClient.getCMSCategories());
}

// File Upload hooks
export function useFileUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File, type: 'resume' | 'avatar' | 'document') => {
    try {
      setLoading(true);
      setError(null);
      
      let response: ApiResponse;
      switch (type) {
        case 'resume':
          response = await apiClient.uploadResume(file);
          break;
        case 'avatar':
          response = await apiClient.uploadAvatar(file);
          break;
        case 'document':
          response = await apiClient.uploadDocument(file);
          break;
        default:
          throw new Error('Invalid file type');
      }
      
      if (response.error) {
        setError(response.error.message);
        return null;
      }
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadFile, loading, error };
}

export function useDeleteFile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteFile = async (fileId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.deleteFile(fileId);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteFile, loading, error };
}

// Job Queue hooks
export function useProcessResumeJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processResumeJob = async (resumeId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.processResumeJob(resumeId);
      
      if (response.error) {
        setError(response.error.message);
        return null;
      }
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { processResumeJob, loading, error };
}

export function useMatchUsersJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchUsersJob = async (userId: string, resumeId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.matchUsersJob(userId, resumeId);
      
      if (response.error) {
        setError(response.error.message);
        return null;
      }
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { matchUsersJob, loading, error };
}

export function useJobStatus(jobId: string) {
  return useApi(() => apiClient.getJobStatus(jobId), [jobId]);
}

export function useQueueStats() {
  return useApi(() => apiClient.getQueueStats());
}

export function useRetryJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retryJob = async (jobId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.retryJob(jobId);
      
      if (response.error) {
        setError(response.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { retryJob, loading, error };
}

// Health Check hooks
export function useHealth() {
  return useApi(() => apiClient.getHealth());
}

export function useDetailedHealth() {
  return useApi(() => apiClient.getDetailedHealth());
}

