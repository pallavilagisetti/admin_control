'use client';

// Backend Context for managing API state and configuration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../lib/api-client';

interface BackendContextType {
  // Connection status
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnected: Date | null;
  
  // API configuration
  apiUrl: string;
  setApiUrl: (url: string) => void;
  
  // Health status
  healthStatus: any;
  systemHealth: any;
  
  // Error handling
  globalError: string | null;
  setGlobalError: (error: string | null) => void;
  
  // Connection management
  checkConnection: () => Promise<boolean>;
  reconnect: () => Promise<void>;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

interface BackendProviderProps {
  children: ReactNode;
}

export function BackendProvider({ children }: BackendProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Check backend connection
  const checkConnection = async (): Promise<boolean> => {
    try {
      setConnectionStatus('connecting');
      setGlobalError(null);
      
      // Check basic health endpoint
      const healthResponse = await apiClient.getHealth();
      
      if (healthResponse.error) {
        setConnectionStatus('error');
        setGlobalError(healthResponse.error.message);
        setIsConnected(false);
        return false;
      }
      
      // Check detailed health if available
      const detailedHealthResponse = await apiClient.getDetailedHealth();
      if (!detailedHealthResponse.error) {
        setSystemHealth(detailedHealthResponse.data);
      }
      
      setHealthStatus(healthResponse.data);
      setConnectionStatus('connected');
      setIsConnected(true);
      setLastConnected(new Date());
      return true;
      
    } catch (error) {
      setConnectionStatus('error');
      setGlobalError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
      return false;
    }
  };

  // Reconnect to backend
  const reconnect = async (): Promise<void> => {
    setConnectionStatus('connecting');
    setGlobalError(null);
    
    const connected = await checkConnection();
    
    if (!connected) {
      // Retry with exponential backoff
      setTimeout(async () => {
        await checkConnection();
      }, 2000);
    }
  };

  // Initialize connection on mount
  useEffect(() => {
    checkConnection();
    
    // Set up periodic health checks
    const healthCheckInterval = setInterval(() => {
      checkConnection();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(healthCheckInterval);
  }, []);

  // Update API URL when it changes
  useEffect(() => {
    if (apiUrl !== process.env.NEXT_PUBLIC_API_URL) {
      // Update the API client base URL
      // Note: This would require modifying the apiClient to accept dynamic URLs
      checkConnection();
    }
  }, [apiUrl]);

  const value: BackendContextType = {
    isConnected,
    connectionStatus,
    lastConnected,
    apiUrl,
    setApiUrl,
    healthStatus,
    systemHealth,
    globalError,
    setGlobalError,
    checkConnection,
    reconnect,
  };

  return (
    <BackendContext.Provider value={value}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  const context = useContext(BackendContext);
  if (context === undefined) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
}

// Backend status indicator component
export function BackendStatusIndicator() {
  const { connectionStatus, lastConnected, globalError } = useBackend();
  
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        connectionStatus === 'connected' ? 'bg-green-500' : 
        connectionStatus === 'connecting' ? 'bg-yellow-500' : 
        connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
      }`} />
      <span className={`text-sm ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {lastConnected && connectionStatus === 'connected' && (
        <span className="text-xs text-gray-500">
          ({new Date(lastConnected).toLocaleTimeString()})
        </span>
      )}
      {globalError && (
        <span className="text-xs text-red-500">
          {globalError}
        </span>
      )}
    </div>
  );
}

// Backend error boundary
export function BackendErrorBoundary({ children }: { children: ReactNode }) {
  const { globalError, setGlobalError } = useBackend();
  
  if (globalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Backend Connection Error</h3>
              <p className="text-sm text-gray-500 mt-1">{globalError}</p>
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={() => setGlobalError(null)}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Dismiss
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

