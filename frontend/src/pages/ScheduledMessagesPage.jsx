// frontend/src/pages/ScheduledMessagesPage.jsx
import { useEffect, useState } from 'react';
import { useScheduledMessageStore } from '../store/useScheduledMessageStore';
import { Clock, Loader2, Trash, MessageSquare, Users, Calendar, Edit, Send } from 'lucide-react';
import { formatDateRelative } from '../lib/utils'; // We'll add this function

const ScheduledMessagesPage = () => {
  const { 
    scheduledMessages, 
    getScheduledMessages, 
    deleteScheduledMessage,
    updateScheduledMessage,
    isLoading, 
    isDeleting 
  } = useScheduledMessageStore();
  
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  
  useEffect(() => {
    getScheduledMessages();
  }, [getScheduledMessages]);

  // Format a date for display
  const formatScheduleDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
  
  // Handle delete confirmation
  const handleDelete = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this scheduled message?')) {
      await deleteScheduledMessage(messageId);
    }
  };
  
  // Handle edit message
  const startEdit = (message) => {
    setEditingMessage(message._id);
    setEditText(message.text || '');
  };
  
  // Save edited message
  const saveEdit = async (messageId) => {
    await updateScheduledMessage(messageId, { text: editText });
    setEditingMessage(null);
  };
  
  // Cancel edit
  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  return (
    <div className="h-screen bg-base-200 pt-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-base-100 rounded-lg shadow-lg">
          <div className="p-4 border-b border-base-300 flex items-center gap-3">
            <Clock className="size-6 text-primary" />
            <h1 className="text-xl font-bold">Scheduled Messages</h1>
          </div>
          
          <div className="p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="size-10 animate-spin text-primary mb-4" />
                <p>Loading scheduled messages...</p>
              </div>
            ) : scheduledMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Clock className="size-16 text-base-content/20 mb-4" />
                <h2 className="text-lg font-semibold mb-2">No scheduled messages</h2>
                <p className="text-base-content/60 max-w-md">
                  You haven't scheduled any messages yet. Use the clock icon in the message input to schedule messages for later.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledMessages.map(message => (
                  <div key={message._id} className="border border-base-300 rounded-lg p-4 hover:bg-base-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {message.receiverId ? (
                              <MessageSquare className="size-5 text-primary" />
                            ) : (
                              <Users className="size-5 text-primary" />
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium">
                            {message.receiverId ? message.receiverId.fullName : message.groupId?.name || "Unknown recipient"}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-base-content/60">
                            <Calendar className="size-3" />
                            <span>{formatScheduleDate(message.scheduledFor)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        {editingMessage !== message._id && (
                          <>
                            <button 
                              onClick={() => startEdit(message)}
                              className="btn btn-ghost btn-circle btn-sm"
                              disabled={isDeleting}
                            >
                              <Edit className="size-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(message._id)}
                              className="btn btn-ghost btn-circle btn-sm text-error"
                              disabled={isDeleting}
                            >
                              <Trash className="size-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {editingMessage === message._id ? (
                      <div className="space-y-2">
                        <textarea
                          className="textarea textarea-bordered w-full"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={cancelEdit}
                            className="btn btn-ghost btn-sm"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => saveEdit(message._id)}
                            className="btn btn-primary btn-sm"
                            disabled={!editText.trim()}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {message.text && (
                          <p className="mb-2">{message.text}</p>
                        )}
                        {message.image && (
                          <div className="mb-2">
                            <img 
                              src={message.image} 
                              alt="Scheduled message attachment" 
                              className="max-w-[200px] rounded-md"
                            />
                          </div>
                        )}
                        {message.document && (
                          <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg mb-2 max-w-xs">
                            <div className="flex-1 truncate text-sm">
                              {message.document.name || "Document"}
                            </div>
                          </div>
                        )}
                        {message.voiceMessage && (
                          <div className="p-2 bg-base-200 rounded-lg mb-2 max-w-xs">
                            <span className="text-sm">Voice message</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledMessagesPage;