// frontend/src/pages/DebugPage.jsx
import { useState } from 'react';
import ServerHealthCheck from '../components/ServerHealthCheck';
import { useAuthStore } from '../store/useAuthStore';
import { useGroupStore } from '../store/useGroupStore';
import { useChatStore } from '../store/useChatStore';

const DebugPage = () => {
  const { authUser } = useAuthStore();
  const { selectedGroup } = useGroupStore();
  const { selectedUser } = useChatStore();
  const [showStoreData, setShowStoreData] = useState(false);
  
  return (
    <div className="h-screen pt-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-base-100 rounded-lg shadow-lg mb-6">
          <div className="p-4 border-b border-base-300">
            <h1 className="text-xl font-bold">Debug Tools</h1>
            <p className="text-sm text-base-content/70">
              Tools to help diagnose issues with the app
            </p>
          </div>
          
          <div className="p-4 space-y-6">
            <ServerHealthCheck />
            
            <div className="bg-base-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">App State</h3>
                <button 
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowStoreData(!showStoreData)}
                >
                  {showStoreData ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Auth Status</span>
                  <span className="px-2 py-1 bg-base-300 rounded text-sm">
                    {authUser ? 'Logged In' : 'Logged Out'}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Selected User</span>
                  <span className="px-2 py-1 bg-base-300 rounded text-sm">
                    {selectedUser ? selectedUser.fullName : 'None'}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Selected Group</span>
                  <span className="px-2 py-1 bg-base-300 rounded text-sm">
                    {selectedGroup ? selectedGroup.name : 'None'}
                  </span>
                </div>
              </div>
              
              {showStoreData && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Auth Data</span>
                    <pre className="px-2 py-1 bg-base-300 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(authUser, null, 2)}
                    </pre>
                  </div>
                  
                  {selectedUser && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">User Data</span>
                      <pre className="px-2 py-1 bg-base-300 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(selectedUser, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {selectedGroup && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Group Data</span>
                      <pre className="px-2 py-1 bg-base-300 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(selectedGroup, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-base-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Feature Quick Tests</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a href="/helper" className="btn btn-outline w-full">Test Helper</a>
                <a href="/scheduled-messages" className="btn btn-outline w-full">Test Scheduled Messages</a>
                <button className="btn btn-outline w-full" onClick={() => window.location.href = '/'}>Test Polls (Go to Groups)</button>
                <button className="btn btn-outline w-full" onClick={() => window.location.reload()}>Refresh App</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;