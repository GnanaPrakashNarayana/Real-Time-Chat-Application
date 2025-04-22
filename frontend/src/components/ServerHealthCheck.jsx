// frontend/src/components/ServerHealthCheck.jsx
import { useState, useEffect } from 'react';
import { axiosInstance } from '../lib/axios';
import { Check, X, AlertTriangle, RefreshCw } from 'lucide-react';

const ServerHealthCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState({});
  
  const endpoints = [
    { name: 'Authentication', path: '/auth/check', method: 'get', authorized: true },
    { name: 'Messages', path: '/messages/users', method: 'get', authorized: true },
    { name: 'Groups', path: '/groups', method: 'get', authorized: true },
    { name: 'Scheduled Messages', path: '/scheduled-messages', method: 'get', authorized: true },
    { name: 'Helper', path: '/helper/chat', method: 'post', data: { message: 'Hi' }, authorized: true },
    { name: 'CORS', path: '/cors-test', method: 'get', authorized: false },
  ];
  
  const checkHealth = async () => {
    setIsChecking(true);
    const newResults = {};
    
    for (const endpoint of endpoints) {
      try {
        if (endpoint.method === 'get') {
          await axiosInstance.get(endpoint.path);
        } else if (endpoint.method === 'post') {
          await axiosInstance.post(endpoint.path, endpoint.data || {});
        }
        newResults[endpoint.name] = { status: 'success' };
      } catch (error) {
        console.error(`Error checking ${endpoint.name}:`, error);
        newResults[endpoint.name] = { 
          status: 'error', 
          message: error.response?.data?.message || error.message
        };
      }
    }
    
    setResults(newResults);
    setIsChecking(false);
  };
  
  useEffect(() => {
    // Optional: automatically check on component mount
    // checkHealth();
  }, []);
  
  return (
    <div className="p-4 bg-base-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Server Health Check</h3>
        <button 
          className="btn btn-sm btn-primary" 
          onClick={checkHealth}
          disabled={isChecking}
        >
          {isChecking ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="size-4" />
              Check Server
            </>
          )}
        </button>
      </div>
      
      <div className="space-y-2">
        {Object.keys(results).length === 0 ? (
          <p className="text-center text-base-content/70">Click the button to check server health</p>
        ) : (
          endpoints.map(endpoint => (
            <div 
              key={endpoint.name}
              className="flex items-center justify-between py-2 px-3 bg-base-100 rounded-lg"
            >
              <span>{endpoint.name}</span>
              <div className="flex items-center">
                {results[endpoint.name]?.status === 'success' ? (
                  <Check className="size-5 text-success" />
                ) : results[endpoint.name]?.status === 'error' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-error max-w-[150px] truncate">
                      {results[endpoint.name]?.message}
                    </span>
                    <X className="size-5 text-error" />
                  </div>
                ) : (
                  <AlertTriangle className="size-5 text-warning" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <p className="mt-4 text-xs text-base-content/60 text-center">
        This tool helps diagnose if the server endpoints are accessible.
      </p>
    </div>
  );
};

export default ServerHealthCheck;