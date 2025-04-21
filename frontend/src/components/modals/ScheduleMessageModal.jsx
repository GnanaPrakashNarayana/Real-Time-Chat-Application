// frontend/src/components/modals/ScheduleMessageModal.jsx
import { useState } from 'react';
import { X, Clock, Send } from 'lucide-react';
import DateTimePicker from '../DateTimePicker';
import { useScheduledMessageStore } from '../../store/useScheduledMessageStore';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="size-5" />
            Schedule Message
          </h3>
          <button 
            onClick={onClose} 
            className="btn btn-ghost btn-circle btn-sm"
            disabled={isCreating}
          >
            <X className="size-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Message</span>
            </label>
            <textarea 
              className="textarea textarea-bordered w-full" 
              placeholder="Enter your message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              disabled={isCreating}
            />
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Schedule for</span>
            </label>
            <DateTimePicker 
              onSelect={setScheduledFor} 
              disabled={isCreating}
            />
          </div>
          
          {/* Preview of attachments if any */}
          {(message.image || message.document || message.voiceMessage) && (
            <div className="bg-base-200 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Attachments</h4>
              {message.image && <div className="text-sm">Image attachment</div>}
              {message.document && (
                <div className="text-sm">{message.document.name || "Document attachment"}</div>
              )}
              {message.voiceMessage && <div className="text-sm">Voice message</div>}
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={isCreating || !text.trim()}
            >
              {isCreating ? (
                <>Loading...</>
              ) : (
                <>
                  <Send className="size-4" />
                  Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMessageModal;