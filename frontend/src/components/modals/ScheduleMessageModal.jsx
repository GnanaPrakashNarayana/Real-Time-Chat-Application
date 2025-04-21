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
      toast.error("Please enter a message or add an attachment");
      return;
    }
    
    const scheduledMessage = {
      receiverId,
      groupId,
      text: text.trim(),
      image: message.image ? { data: message.image.data, name: message.image.name } : null, 
      document: message.document ? { data: message.document.data, name: message.document.name, type: message.document.type, size: message.document.size } : null,
      voiceMessage: message.voiceMessage ? { data: message.voiceMessage.data, duration: message.voiceMessage.duration } : null,
      scheduledFor: scheduledFor.toISOString()
    };
    
    const success = await createScheduledMessage(scheduledMessage);
    if (success) {
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl shadow-xl w-full max-w-lg mx-auto flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 flex-shrink-0">
          <h3 className="text-xl font-semibold">Schedule Message</h3>
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:bg-base-200"
            disabled={isCreating}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div>
            <label htmlFor="schedule-message-text" className="block text-sm font-medium text-base-content/80 mb-2">
              Message Content
            </label>
            <textarea 
              id="schedule-message-text"
              className="textarea textarea-bordered w-full resize-none bg-base-100 focus:ring-1 focus:ring-primary focus:border-primary" 
              placeholder="Type your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              disabled={isCreating}
            />
          </div>
          
          {(message.image || message.document || message.voiceMessage) && (
            <div className="pt-4 border-t border-base-200">
              <h4 className="text-sm font-medium text-base-content/80 mb-2">Attachments</h4>
              <div className="flex flex-wrap gap-2">
                {message.image && (
                  <div className="badge badge-outline gap-1 p-3">
                    <i className="fas fa-image"></i>
                    Image
                  </div>
                )}
                {message.document && (
                  <div className="badge badge-outline gap-1 p-3">
                     <i className="fas fa-file-alt"></i>
                    {message.document.name || "Document"}
                  </div>
                )}
                {message.voiceMessage && (
                  <div className="badge badge-outline gap-1 p-3">
                     <i className="fas fa-microphone"></i>
                    Voice message
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-base-content/80 mb-2">Schedule for</h4>
            <div className="bg-base-200/50 rounded-lg p-4 border border-base-300">
              <DateTimePicker onSelect={setScheduledFor} disabled={isCreating} />
            </div>
          </div>
          
          <div className="pt-4 border-t border-base-300 mt-auto flex-shrink-0">
            <button 
              type="submit"
              className={`btn btn-primary w-full ${isCreating ? 'loading' : ''}`}
              disabled={isCreating || (!text.trim() && !message.image && !message.document && !message.voiceMessage) || !scheduledFor}
            >
              {!isCreating && <Send className="size-4" />}
              {isCreating ? "Scheduling..." : "Schedule Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMessageModal;