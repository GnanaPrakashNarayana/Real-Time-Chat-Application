// frontend/src/components/ScheduledMessagesDebug.jsx (NEW FILE)
import { useState } from 'react';
import { axiosInstance } from '../lib/axios';
import { RefreshCw, Play } from 'lucide-react';
import toast from 'react-hot-toast';

const ScheduledMessagesDebug = () => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  
  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/debug/scheduler-status');
      setStatus(res.data);
      toast.success('Scheduler status fetched successfully');
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
      toast.error('Failed to fetch scheduler status');
    } finally {
      setIsLoading(false);
    }
  };
  
  const triggerScheduler = async () => {
    setIsTriggering(true);
    try {
      const res = await axiosInstance.post('/debug/trigger-scheduler');
      setStatus(res.data.stats);
      toast.success('Scheduler triggered successfully');
      
      // Refresh scheduled messages list if there's a callback for it
      if (typeof window.refreshScheduledMessages === 'function') {
        window.refreshScheduledMessages();
      }
    } catch (error) {
      console.error('Error triggering scheduler:', error);
      toast.error('Failed to trigger scheduler');
    } finally {
      setIsTriggering(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div className="p-4 bg-base-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Scheduler Debug Tools</h3>
        <div className="flex gap-2">
          <button 
            className="btn btn-sm btn-outline" 
            onClick={fetchStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            Status
          </button>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={triggerScheduler}
            disabled={isTriggering}
          >
            <Play className="size-4" />
            Trigger Now
          </button>
        </div>
      </div>
      
      {status ? (
        <div className="space-y-4">
          <div className="bg-base-100 p-3 rounded-lg">
            <h4 className="font-medium mb-2">Scheduler Status</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-base-content/70">Last Run:</div>
              <div>{formatDate(status.lastRun)}</div>
              
              <div className="text-base-content/70">Currently Running:</div>
              <div>{status.isCurrentlyRunning ? 'Yes' : 'No'}</div>
            </div>
          </div>
          
          {status.stats && (
            <div className="bg-base-100 p-3 rounded-lg">
              <h4 className="font-medium mb-2">Run Statistics</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-base-content/70">Total Runs:</div>
                <div>{status.stats.totalRuns}</div>
                
                <div className="text-base-content/70">Successful Runs:</div>
                <div>{status.stats.successfulRuns}</div>
                
                <div className="text-base-content/70">Failed Runs:</div>
                <div>{status.stats.failedRuns}</div>
                
                <div className="text-base-content/70">Messages Processed:</div>
                <div>{status.stats.messagesProcessed}</div>
                
                <div className="text-base-content/70">Messages Failed:</div>
                <div>{status.stats.messagesFailed}</div>
                
                {status.stats.lastErrorMessage && (
                  <>
                    <div className="text-base-content/70">Last Error:</div>
                    <div className="text-error">{status.stats.lastErrorMessage}</div>
                    
                    <div className="text-base-content/70">Error Time:</div>
                    <div>{formatDate(status.stats.lastErrorTimestamp)}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-base-content/70">
          Click the "Status" button to fetch scheduler information
        </div>
      )}
      
      <div className="mt-4 border-t border-base-300 pt-3">
        <p className="text-xs text-base-content/60">
          These tools help debug the scheduled messages system. "Status" shows the scheduler state, while 
          "Trigger Now" manually runs the scheduler to process any pending messages.
        </p>
      </div>
    </div>
  );
};

export default ScheduledMessagesDebug;