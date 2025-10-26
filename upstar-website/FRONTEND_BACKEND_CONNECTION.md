# Frontend-Backend Connection Guide

This guide explains how the Upstar frontend (Next.js) connects to the Upstar backend (Node.js/Express) API.

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   Frontend      │ ◄──────────────► │   Backend       │
│   (Next.js)     │    API Calls     │   (Express.js)  │
│   Port: 3000    │                  │   Port: 3001    │
└─────────────────┘                  └─────────────────┘
        │                                     │
        │                                     │
        ▼                                     ▼
┌─────────────────┐                  ┌─────────────────┐
│   Browser       │                  │   Database      │
│   (React)       │                  │   (PostgreSQL)  │
└─────────────────┘                  └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Authentication Configuration
NEXT_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-identifier

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_FILE_UPLOAD=true
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
```

### Backend Environment Variables

Ensure the backend has the corresponding environment variables in `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=upstar_db
DB_USER=postgres
DB_PASSWORD=localpass

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_CLIENT_SECRET=your-client-secret
```

## 📡 API Client Implementation

### Core API Client (`src/lib/api-client.ts`)

The API client handles all communication with the backend:

```typescript
// API Client for connecting frontend to backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    // Implementation details...
  }

  // Authentication endpoints
  async verifyToken(token: string): Promise<ApiResponse> {
    return this.request('/api/auth/verify', {
      method: 'POST',
      body: { token },
    });
  }

  // Dashboard endpoints
  async getDashboardOverview(): Promise<ApiResponse> {
    return this.request('/api/dashboard/overview');
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

  // ... more endpoints
}
```

### React Hooks (`src/lib/api-hooks.ts`)

Custom hooks for easy API integration:

```typescript
// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Implementation details...
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Specific hooks for different endpoints
export function useDashboardOverview() {
  return useApi(() => apiClient.getDashboardOverview());
}

export function useUsers(params?: any) {
  return useApi(() => apiClient.getUsers(params), [params]);
}
```

## 🔐 Authentication Integration

### Backend Context (`src/contexts/BackendContext.tsx`)

Manages backend connection and authentication state:

```typescript
interface BackendContextType {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnected: Date | null;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  healthStatus: any;
  systemHealth: any;
  globalError: string | null;
  setGlobalError: (error: string | null) => void;
  checkConnection: () => Promise<boolean>;
  reconnect: () => Promise<void>;
}
```

### Authentication Hook (`src/lib/api-hooks.ts`)

```typescript
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return {
    user,
    loading,
    login,
    logout,
    checkPermission,
    isAuthenticated: !!user,
  };
}
```

## 🎯 Usage Examples

### Dashboard Page (`src/app/dashboard/page.tsx`)

```typescript
'use client';

import React from 'react';
import { useDashboardOverview, useDashboardAnalyticsReport } from '../../lib/api-hooks';
import { BackendConnection } from '../../components/BackendConnection';

export default function DashboardPage() {
  const { data: overview, loading: overviewLoading, error: overviewError } = useDashboardOverview();
  const { data: analyticsReport, loading: reportLoading, error: reportError } = useDashboardAnalyticsReport();

  if (overviewLoading || reportLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackendConnection showDetails={true} />
        
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {overview.totalUsers || 0}
                  </p>
                </div>
              </div>
            </div>
            {/* More dashboard cards... */}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Users Page (`src/app/users/page.tsx`)

```typescript
'use client';

import React, { useState } from 'react';
import { useUsers, useUpdateUser, useLoginAsUser } from '../../lib/api-hooks';
import { BackendConnection } from '../../components/BackendConnection';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  
  const { data: usersData, loading, error, refetch } = useUsers({
    page,
    limit: 20,
    search: search || undefined,
    status: status || undefined,
    role: role || undefined,
  });
  
  const { updateUser, loading: updateLoading } = useUpdateUser();
  const { loginAsUser, loading: loginLoading } = useLoginAsUser();

  const handleUpdateUser = async (userId: string, updates: any) => {
    const success = await updateUser({ id: userId, ...updates });
    if (success) {
      refetch();
    }
  };

  // Component implementation...
}
```

## 🚀 Getting Started

### 1. Start the Backend

```bash
cd upstar-backend
npm install
npm run setup:db
npm run dev
```

### 2. Start the Frontend

```bash
cd upstar-website
npm install
npm run dev
```

### 3. Test the Connection

Visit `http://localhost:3000/api-test` to test the backend connection.

## 🔍 API Endpoints Mapping

### Frontend Routes → Backend API

| Frontend Page | Backend API Endpoints |
|---------------|----------------------|
| `/dashboard` | `GET /api/dashboard/overview`<br>`GET /api/dashboard/analytics-report` |
| `/users` | `GET /api/users`<br>`PATCH /api/users`<br>`POST /api/users/:id/login-as` |
| `/resumes` | `GET /api/resumes`<br>`GET /api/resumes/:id`<br>`POST /api/resumes/:id/reprocess` |
| `/jobs` | `GET /api/jobs`<br>`GET /api/jobs/:id`<br>`POST /api/jobs/sync` |
| `/analytics` | `GET /api/analytics/skill-analysis`<br>`GET /api/analytics/market-trends` |
| `/payments` | `GET /api/payments/subscriptions`<br>`GET /api/payments/transactions` |
| `/ai-settings` | `GET /api/ai/settings`<br>`PUT /api/ai/settings`<br>`GET /api/ai/models/status` |
| `/system-health` | `GET /api/system/health`<br>`GET /api/system/metrics`<br>`GET /api/system/alerts` |
| `/notifications` | `GET /api/notifications/history`<br>`POST /api/notifications/send`<br>`GET /api/notifications/reminders` |
| `/cms` | `GET /api/cms/articles`<br>`POST /api/cms/articles`<br>`PUT /api/cms/articles/:id` |

## 🛠️ Development Tools

### API Test Page

Visit `/api-test` to run comprehensive API tests:

- Health check endpoints
- Authentication endpoints
- All CRUD operations
- System health monitoring
- Performance testing

### Backend Connection Component

The `BackendConnection` component provides:

- Real-time connection status
- Error handling and display
- Manual reconnection
- System health details
- API URL configuration

### Error Handling

The system includes comprehensive error handling:

- Network errors
- Authentication errors
- API errors
- Connection timeouts
- Retry mechanisms

## 📊 Monitoring and Debugging

### Connection Status

The frontend monitors backend connectivity with:

- Automatic health checks every 30 seconds
- Visual status indicators
- Error notifications
- Reconnection attempts

### Debug Information

Enable debug mode by setting:

```env
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

### Performance Monitoring

The system tracks:

- API response times
- Connection stability
- Error rates
- User experience metrics

## 🔒 Security Considerations

### Authentication

- JWT token storage in localStorage
- Automatic token refresh
- Secure API communication
- Role-based access control

### Data Protection

- Input validation
- XSS prevention
- CSRF protection
- Secure headers

## 🚀 Production Deployment

### Environment Configuration

Update environment variables for production:

```env
NEXT_PUBLIC_API_URL=https://api.upstar.com
NEXT_PUBLIC_AUTH0_DOMAIN=upstar.auth0.com
NEXT_PUBLIC_APP_ENVIRONMENT=production
```

### CORS Configuration

Ensure backend CORS is configured for production domains:

```javascript
app.use(cors({
  origin: ['https://admin.upstar.com', 'https://upstar.com'],
  credentials: true
}));
```

### SSL/TLS

Use HTTPS for all communications in production.

## 📝 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if backend is running on port 3001
   - Verify firewall settings
   - Check network connectivity

2. **Authentication Errors**
   - Verify Auth0 configuration
   - Check token validity
   - Ensure proper headers

3. **CORS Errors**
   - Update backend CORS configuration
   - Check allowed origins
   - Verify credentials setting

4. **API Errors**
   - Check backend logs
   - Verify endpoint URLs
   - Test with Postman/curl

### Debug Steps

1. Check browser console for errors
2. Verify network requests in DevTools
3. Test backend endpoints directly
4. Check environment variables
5. Review backend logs

## 🎯 Next Steps

1. **Implement Real-time Updates**: WebSocket integration for live data
2. **Add Caching**: Redis caching for improved performance
3. **Optimize Bundle**: Code splitting and lazy loading
4. **Add Tests**: Unit and integration tests
5. **Monitor Performance**: APM integration

The frontend-backend connection is now fully implemented with comprehensive error handling, monitoring, and debugging capabilities.





