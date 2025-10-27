// API Client for connecting frontend to backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params = {}
    } = options;

    // Build URL with query parameters
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;
    
    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    try {
      console.log(`🌐 API Request: ${method} ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      const responseData = await response.json();

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status}`, responseData);
        return {
          error: {
            code: responseData.error?.code || 'API_ERROR',
            message: responseData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
            details: responseData.error?.details,
          },
        };
      }

      return {
        data: responseData.data || responseData,
        pagination: responseData.pagination,
      };
    } catch (error) {
      console.error(`🚨 Network Error:`, error);
      
      // Provide more specific error messages
      let errorMessage = 'Network error occurred';
      let errorCode = 'NETWORK_ERROR';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = `Cannot connect to backend server at ${this.baseURL}. Please check if the backend is running.`;
          errorCode = 'CONNECTION_FAILED';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS error - backend server may not be configured to allow frontend requests.';
          errorCode = 'CORS_ERROR';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        error: {
          code: errorCode,
          message: errorMessage,
          details: {
            url: url.toString(),
            method,
            originalError: error instanceof Error ? error.message : 'Unknown error'
          }
        },
      };
    }
  }

  // Authentication endpoints
  async verifyToken(token: string): Promise<ApiResponse> {
    return this.request('/api/auth/verify', {
      method: 'POST',
      body: { token },
    });
  }

  async getProfile(): Promise<ApiResponse> {
    return this.request('/api/auth/profile');
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse> {
    return this.request('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async checkPermission(permission: string): Promise<ApiResponse> {
    return this.request('/api/auth/check-permission', {
      method: 'POST',
      body: { permission },
    });
  }

  // Dashboard endpoints
  async getDashboardOverview(): Promise<ApiResponse> {
    return this.request('/api/dashboard/overview');
  }

  async getDashboardAnalyticsReport(): Promise<ApiResponse> {
    return this.request('/api/dashboard/analytics-report');
  }

  // Users endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }): Promise<ApiResponse> {
    return this.request('/api/users', { params });
  }

  async getUserById(id: string): Promise<ApiResponse> {
    return this.request(`/api/users/${id}`);
  }

  async updateUser(data: {
    id: string;
    roles?: string[];
    active?: boolean;
    [key: string]: any;
  }): Promise<ApiResponse> {
    return this.request('/api/users', {
      method: 'PATCH',
      body: data,
    });
  }

  async loginAsUser(userId: string): Promise<ApiResponse> {
    return this.request(`/api/users/${userId}/login-as`, {
      method: 'POST',
    });
  }

  // Resumes endpoints
  async getResumes(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse> {
    return this.request('/api/resumes', { params });
  }

  async getResumeById(id: string): Promise<ApiResponse> {
    return this.request(`/api/resumes/${id}`);
  }

  async reprocessResume(id: string): Promise<ApiResponse> {
    return this.request(`/api/resumes/${id}/reprocess`, {
      method: 'POST',
    });
  }

  async downloadResume(id: string): Promise<ApiResponse> {
    return this.request(`/api/resumes/${id}/download`);
  }

  // Skills endpoints
  async getSkillsAnalytics(): Promise<ApiResponse> {
    return this.request('/api/skills/analytics');
  }

  async getSkillsErrors(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    return this.request('/api/skills/errors', { params });
  }

  async getSkillsCategories(): Promise<ApiResponse> {
    return this.request('/api/skills/categories');
  }

  async getSkillsTrends(): Promise<ApiResponse> {
    return this.request('/api/skills/trends');
  }

  // Jobs endpoints
  async getJobs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    location?: string;
    remote?: boolean;
  }): Promise<ApiResponse> {
    return this.request('/api/jobs', { params });
  }

  async getJobById(id: string): Promise<ApiResponse> {
    return this.request(`/api/jobs/${id}`);
  }

  async syncJobs(): Promise<ApiResponse> {
    return this.request('/api/jobs/sync', {
      method: 'POST',
    });
  }

  async getJobAnalytics(): Promise<ApiResponse> {
    return this.request('/api/jobs/analytics');
  }

  // Analytics endpoints
  async getSkillAnalysis(): Promise<ApiResponse> {
    return this.request('/api/analytics/skill-analysis');
  }

  async getMarketTrends(): Promise<ApiResponse> {
    return this.request('/api/analytics/market-trends');
  }

  async getJobPerformance(): Promise<ApiResponse> {
    return this.request('/api/analytics/job-performance');
  }

  async getGeographicData(): Promise<ApiResponse> {
    return this.request('/api/analytics/geographic');
  }

  async getUserEngagement(): Promise<ApiResponse> {
    return this.request('/api/analytics/user-engagement');
  }

  // Payments endpoints
  async getSubscriptions(): Promise<ApiResponse> {
    return this.request('/api/payments/subscriptions');
  }

  async getTransactions(): Promise<ApiResponse> {
    return this.request('/api/payments/transactions');
  }

  async getPaymentAnalytics(): Promise<ApiResponse> {
    return this.request('/api/payments/analytics');
  }

  async processRefund(data: {
    transactionId: string;
    amount: number;
    reason: string;
  }): Promise<ApiResponse> {
    return this.request('/api/payments/refunds', {
      method: 'POST',
      body: data,
    });
  }

  // AI Settings endpoints
  async getAISettings(): Promise<ApiResponse> {
    return this.request('/api/ai/settings');
  }

  async updateAISettings(settings: any[]): Promise<ApiResponse> {
    return this.request('/api/ai/settings', {
      method: 'PUT',
      body: { settings },
    });
  }

  async getAIModelStatus(): Promise<ApiResponse> {
    return this.request('/api/ai/models/status');
  }

  async testAIModel(modelId: string, input: string): Promise<ApiResponse> {
    return this.request(`/api/ai/models/${modelId}/test`, {
      method: 'POST',
      body: { input },
    });
  }

  async getAIPerformance(): Promise<ApiResponse> {
    return this.request('/api/ai/performance');
  }

  // System Health endpoints
  async getSystemHealth(): Promise<ApiResponse> {
    return this.request('/api/system/health');
  }

  async getSystemActivity(): Promise<ApiResponse> {
    return this.request('/api/system/activity');
  }

  async getSystemAlerts(): Promise<ApiResponse> {
    return this.request('/api/system/alerts');
  }

  async resolveSystemAlert(alertId: string): Promise<ApiResponse> {
    return this.request(`/api/system/alerts/${alertId}/resolve`, {
      method: 'POST',
    });
  }

  async getSystemMetrics(): Promise<ApiResponse> {
    return this.request('/api/system/metrics');
  }

  // Notifications endpoints
  async getNotificationHistory(): Promise<ApiResponse> {
    return this.request('/api/notifications/history');
  }

  async sendNotification(data: {
    title: string;
    content: string;
    audience: string;
    schedule: string;
  }): Promise<ApiResponse> {
    return this.request('/api/notifications/send', {
      method: 'POST',
      body: data,
    });
  }

  async getReminders(): Promise<ApiResponse> {
    return this.request('/api/notifications/reminders');
  }

  async createReminder(data: {
    title: string;
    description: string;
    cadence: string;
  }): Promise<ApiResponse> {
    return this.request('/api/notifications/reminders', {
      method: 'POST',
      body: data,
    });
  }

  async toggleReminder(reminderId: string): Promise<ApiResponse> {
    return this.request(`/api/notifications/reminders/${reminderId}/toggle`, {
      method: 'POST',
    });
  }

  async getNotificationTemplates(): Promise<ApiResponse> {
    return this.request('/api/notifications/templates');
  }

  // CMS endpoints
  async getCMSArticles(): Promise<ApiResponse> {
    return this.request('/api/cms/articles');
  }

  async createCMSArticle(data: {
    title: string;
    slug: string;
    content: string;
    status: string;
  }): Promise<ApiResponse> {
    return this.request('/api/cms/articles', {
      method: 'POST',
      body: data,
    });
  }

  async getCMSArticleById(id: string): Promise<ApiResponse> {
    return this.request(`/api/cms/articles/${id}`);
  }

  async updateCMSArticle(id: string, data: {
    title?: string;
    content?: string;
    [key: string]: any;
  }): Promise<ApiResponse> {
    return this.request(`/api/cms/articles/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteCMSArticle(id: string): Promise<ApiResponse> {
    return this.request(`/api/cms/articles/${id}`, {
      method: 'DELETE',
    });
  }

  async getCMSCategories(): Promise<ApiResponse> {
    return this.request('/api/cms/categories');
  }

  // File Upload endpoints
  async uploadResume(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/api/upload/resume', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it
      body: formData,
    });
  }

  async uploadAvatar(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/api/upload/avatar', {
      method: 'POST',
      headers: {},
      body: formData,
    });
  }

  async uploadDocument(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/api/upload/document', {
      method: 'POST',
      headers: {},
      body: formData,
    });
  }

  async deleteFile(fileId: string): Promise<ApiResponse> {
    return this.request(`/api/upload/delete/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Job Queue endpoints
  async processResumeJob(resumeId: string): Promise<ApiResponse> {
    return this.request('/api/jobs/process-resume', {
      method: 'POST',
      body: { resumeId },
    });
  }

  async matchUsersJob(userId: string, resumeId: string): Promise<ApiResponse> {
    return this.request('/api/jobs/match-users', {
      method: 'POST',
      body: { userId, resumeId },
    });
  }

  async getJobStatus(jobId: string): Promise<ApiResponse> {
    return this.request(`/api/jobs/status/${jobId}`);
  }

  async getQueueStats(): Promise<ApiResponse> {
    return this.request('/api/jobs/queue-stats');
  }

  async retryJob(jobId: string): Promise<ApiResponse> {
    return this.request(`/api/jobs/retry/${jobId}`, {
      method: 'POST',
    });
  }

  // Health Check endpoints
  async getHealth(): Promise<ApiResponse> {
    return this.request('/api/health');
  }

  async getDetailedHealth(): Promise<ApiResponse> {
    return this.request('/api/health/detailed');
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient();
export default apiClient;

