// frontend/src/components/modals/ScheduleMessageModal.jsx
import { useState } from 'react';
import { X, Clock, Send } from 'lucide-react';
import DateTimePicker from '../DateTimePicker';
import { useScheduledMessageStore } from '../../store/useScheduledMessageStore';
import toast from 'react-hot-toast';

const ScheduleMessageModal = ({ isOpen, onClose, receiverId = null, groupId = null, message = {} }) => {
  const [scheduledFor, setScheduledFor] = useState(null);
  const [text, setText] = useState(message.text || '');
  
  const { createScheduledMessage, isCreating } = useScheduledMessageStore();
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scheduledFor) {
      toast.error("Please select a time to schedule the message");
      return;
    }
    
    if (!text.trim() && !message.image && !message.document && !message.voiceMessage) {
      toast.error("Please enter a message");
      return;
    }
    
    const scheduledMessage = {
      receiverId,
      groupId,
      text: text.trim(),
      image: message.image,
      document: message.document,
      voiceMessage: message.voiceMessage,
      scheduledFor: scheduledFor.toISOString()
    };
    
    const success = await createScheduledMessage(scheduledMessage);
    if (success) {
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <h3 className="text-lg font-semibold">Schedule Message</h3>
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-circle btn-sm"
            disabled={isCreating}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Message preview */}
          <div className="bg-base-100 rounded-3xl border border-base-200 p-5 mb-6">
            <h4 className="text-sm font-medium text-base-content/60 mb-2">Message</h4>
            <textarea 
              className="textarea w-full border-none p-0 resize-none bg-transparent focus:outline-none" 
              placeholder="Type your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              disabled={isCreating}
            />
            
            {/* Attachments preview */}
            {(message.image || message.document || message.voiceMessage) && (
              <div className="mt-3 pt-3 border-t border-base-200">
                <div className="text-sm font-medium text-base-content/60 mb-2">Attachments</div>
                <div className="flex flex-wrap gap-2">
                  {message.image && (
                    <div className="bg-base-200 rounded-lg p-2 text-xs">
                      Image attachment
                    </div>
                  )}
                  {message.document && (
                    <div className="bg-base-200 rounded-lg p-2 text-xs">
                      {message.document.name || "Document"}
                    </div>
                  )}
                  {message.voiceMessage && (
                    <div className="bg-base-200 rounded-lg p-2 text-xs">
                      Voice message
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Schedule picker */}
          <div>
            <h4 className="text-sm font-medium mb-2">Schedule for</h4>
            <DateTimePicker onSelect={setScheduledFor} disabled={isCreating} />
          </div>
          
          {/* Submit button */}
          <div className="mt-6">
            <button 
              type="submit"
              className="btn btn-primary w-full rounded-full"
              disabled={isCreating || !text.trim()}
            >
              {isCreating ? (
                "Scheduling..."
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send className="size-4" />
                  Schedule
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMessageModal;