'use client';

import React, { useState } from 'react';
import { useBackend } from '../../contexts/BackendContext';
import { BackendConnectionTest } from '../../components/BackendConnection';

export default function ApiTestPage() {
  const { checkConnection, connectionStatus, healthStatus, systemHealth } = useBackend();
  const [testResults, setTestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const runApiTests = async () => {
    setIsTesting(true);
    try {
      // Test basic health
      const healthResult = await checkConnection();
      
      // Test various endpoints
      const tests = [
        { name: 'Health Check', endpoint: '/api/health', method: 'GET' },
        { name: 'Dashboard Overview', endpoint: '/api/dashboard/overview', method: 'GET' },
        { name: 'Users List', endpoint: '/api/users', method: 'GET' },
        { name: 'Resumes List', endpoint: '/api/resumes', method: 'GET' },
        { name: 'Jobs List', endpoint: '/api/jobs', method: 'GET' },
        { name: 'Skills Analytics', endpoint: '/api/skills/analytics', method: 'GET' },
        { name: 'System Health', endpoint: '/api/system/health', method: 'GET' },
      ];

      const results = [];
      for (const test of tests) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${test.endpoint}`, {
            method: test.method,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
              'Content-Type': 'application/json',
            },
          });
          
          results.push({
            name: test.name,
            endpoint: test.endpoint,
            status: response.status,
            success: response.ok,
            responseTime: Date.now(),
          });
        } catch (error) {
          results.push({
            name: test.name,
            endpoint: test.endpoint,
            status: 'ERROR',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      setTestResults({
        timestamp: new Date(),
        connectionStatus,
        healthStatus,
        systemHealth,
        tests: results,
        overallSuccess: results.every(r => r.success),
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API Test Suite</h1>
          <p className="mt-2 text-gray-600">Test backend API endpoints and connectivity</p>
        </div>

        {/* Backend Connection Status */}
        <div className="mb-8">
          <BackendConnection showDetails={true} />
        </div>

        {/* Connection Test */}
        <div className="mb-8">
          <BackendConnectionTest />
        </div>

        {/* API Tests */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">API Endpoint Tests</h3>
              <button
                onClick={runApiTests}
                disabled={isTesting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isTesting ? 'Running Tests...' : 'Run API Tests'}
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {testResults && (
              <div className="space-y-6">
                {/* Test Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Test Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Overall Status:</span>
                      <span className={`ml-2 font-medium ${
                        testResults.overallSuccess ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResults.overallSuccess ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tests Run:</span>
                      <span className="ml-2 font-medium">{testResults.tests.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Passed:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {testResults.tests.filter((t: any) => t.success).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Failed:</span>
                      <span className="ml-2 font-medium text-red-600">
                        {testResults.tests.filter((t: any) => !t.success).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual Test Results */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Individual Test Results</h4>
                  <div className="space-y-3">
                    {testResults.tests.map((test: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            test.success ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{test.name}</div>
                            <div className="text-xs text-gray-500">{test.endpoint}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${
                            test.success ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {test.success ? 'PASS' : 'FAIL'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Status: {test.status}
                          </div>
                          {test.error && (
                            <div className="text-xs text-red-500">
                              {test.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Health Details */}
                {testResults.systemHealth && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">System Health Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Database:</span>
                        <span className="ml-2 font-medium">
                          {testResults.systemHealth.database?.status || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Redis:</span>
                        <span className="ml-2 font-medium">
                          {testResults.systemHealth.redis?.status || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Job Queues:</span>
                        <span className="ml-2 font-medium">
                          {testResults.systemHealth.jobQueues?.status || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">External Services:</span>
                        <span className="ml-2 font-medium">
                          {testResults.systemHealth.externalServices?.status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!testResults && !isTesting && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tests run yet</h3>
                <p className="mt-1 text-sm text-gray-500">Click "Run API Tests" to test backend connectivity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}





