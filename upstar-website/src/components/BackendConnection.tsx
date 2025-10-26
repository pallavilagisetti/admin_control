'use client';

// Backend Connection Component for managing API connectivity
import React, { useState, useEffect } from 'react';
import { useBackend } from '../contexts/BackendContext';

interface BackendConnectionProps {
  showDetails?: boolean;
  className?: string;
}

export function BackendConnection({ showDetails = false, className = '' }: BackendConnectionProps) {
  const { 
    isConnected, 
    connectionStatus, 
    lastConnected, 
    apiUrl, 
    setApiUrl, 
    healthStatus, 
    systemHealth, 
    globalError, 
    checkConnection, 
    reconnect 
  } = useBackend();
  
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [customUrl, setCustomUrl] = useState(apiUrl);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await reconnect();
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleUrlChange = () => {
    setApiUrl(customUrl);
    setShowUrlInput(false);
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'connecting':
        return (
          <svg className="w-5 h-5 text-yellow-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 11-9.75 9.75 9.75 9.75 0 019.75-9.75z" />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to Backend';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

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

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {getStatusText()}
              </h3>
              {lastConnected && connectionStatus === 'connected' && (
                <p className="text-xs text-gray-500">
                  Last connected: {new Date(lastConnected).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {apiUrl}
            </button>
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
            </button>
          </div>
        </div>

        {globalError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="w-4 h-4 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-2">
                <p className="text-sm text-red-800">{globalError}</p>
              </div>
            </div>
          </div>
        )}

        {showUrlInput && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Enter API URL"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleUrlChange}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Update
              </button>
              <button
                onClick={() => setShowUrlInput(false)}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showDetails && healthStatus && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">API Status</h4>
                <p className="text-sm text-gray-900">{healthStatus.status || 'Unknown'}</p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Version</h4>
                <p className="text-sm text-gray-900">{healthStatus.version || 'Unknown'}</p>
              </div>
            </div>
            
            {systemHealth && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Database</h4>
                  <p className="text-sm text-gray-900">
                    {systemHealth.database?.status || 'Unknown'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Redis</h4>
                  <p className="text-sm text-gray-900">
                    {systemHealth.redis?.status || 'Unknown'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact status indicator for headers
export function BackendStatusIndicator() {
  const { connectionStatus, isConnected } = useBackend();
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        connectionStatus === 'connected' ? 'bg-green-500' : 
        connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
        connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
      }`} />
      <span className="text-xs text-gray-600">
        {isConnected ? 'Backend Connected' : 'Backend Disconnected'}
      </span>
    </div>
  );
}

// Connection test component
export function BackendConnectionTest() {
  const { checkConnection, connectionStatus, healthStatus } = useBackend();
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const runConnectionTest = async () => {
    setIsTesting(true);
    try {
      const result = await checkConnection();
      setTestResults({
        success: result,
        timestamp: new Date(),
        status: connectionStatus,
        health: healthStatus
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Backend Connection Test</h3>
      
      <button
        onClick={runConnectionTest}
        disabled={isTesting}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isTesting ? 'Testing...' : 'Test Connection'}
      </button>
      
      {testResults && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Test Results</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={testResults.success ? 'text-green-600' : 'text-red-600'}>
                {testResults.success ? 'Success' : 'Failed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Timestamp:</span>
              <span className="text-gray-900">{testResults.timestamp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Connection Status:</span>
              <span className="text-gray-900">{testResults.status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

