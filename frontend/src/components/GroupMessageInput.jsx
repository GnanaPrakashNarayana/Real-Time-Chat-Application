// frontend/src/components/GroupMessageInput.jsx
import { useRef, useState, useEffect } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { Image, Send, X, Paperclip, Mic, Clock, BarChart2 } from "lucide-react";
import toast from "react-hot-toast";
import VoiceRecorder from "./VoiceRecorder";
import ScheduleMessageModal from "./modals/ScheduleMessageModal";
import PollCreator from "./polls/PollCreator";

const GroupMessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [documentName, setDocumentName] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const { sendGroupMessage, sendGroupTypingStatus, selectedGroup } = useGroupStore();
  const typingTimeoutRef = useRef(null);

  // Handle typing indicator
  useEffect(() => {
    if (text.trim()) {
      sendGroupTypingStatus(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        sendGroupTypingStatus(false);
      }, 2000);
    } else {
      sendGroupTypingStatus(false);
    }
    
    // Cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendGroupTypingStatus(false);
    };
  }, [text, sendGroupTypingStatus]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    
    // Store only the name and size - no file object
    setDocumentName({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    
    // Read file as data URL immediately
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentData(reader.result);
      toast.success(`File selected: ${file.name}`);
    };
    reader.onerror = () => {
      toast.error("Error reading file");
      setDocumentName(null);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDocument = () => {
    setDocumentName(null);
    setDocumentData(null);
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !documentName) return;
    if (isSending) return;

    setIsSending(true);
    try {
      // Create document data object without any File references
      const messageDocument = documentName ? {
        data: documentData,
        name: documentName.name,
        type: documentName.type,
        size: documentName.size
      } : null;
      
      await sendGroupMessage({
        text: text.trim(),
        image: imagePreview,
        document: messageDocument,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      setDocumentName(null);
      setDocumentData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (documentInputRef.current) documentInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send group message");
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle sending voice message
  const handleSendVoiceMessage = async (voiceData) => {
    if (!voiceData || !voiceData.data) {
      toast.error("Invalid voice recording");
      return;
    }
    
    setIsRecording(false);
    setIsSending(true);
    
    try {
      await sendGroupMessage({
        voiceMessage: {
          data: voiceData.data,
          duration: voiceData.duration
        }
      });
      toast.success("Voice message sent");
    } catch (error) {
      console.error("Failed to send voice message:", error);
      toast.error("Failed to send voice message");
    } finally {
      setIsSending(false);
    }
  };

  // Open schedule modal
  const handleOpenScheduleModal = () => {
    if (!text.trim() && !imagePreview && !documentName) {
      toast.error("Please enter a message to schedule");
      return;
    }
    
    setShowScheduleModal(true);
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {documentName && (
        <div className="mb-3 flex items-center gap-2 p-2 bg-base-200 rounded-lg">
          <div className="flex-1 flex items-center gap-2">
            <Paperclip className="size-4" />
            <span className="text-sm truncate">{documentName.name}</span>
          </div>
          <button
            onClick={removeDocument}
            className="w-5 h-5 rounded-full bg-base-300
            flex items-center justify-center"
            type="button"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
      
      {showPollCreator && (
        <PollCreator onClose={() => setShowPollCreator(false)} />
      )}
      
      {isRecording ? (
        <VoiceRecorder
          onSend={handleSendVoiceMessage}
          onCancel={() => setIsRecording(false)}
        />
      ) : (
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              className="w-full input input-bordered rounded-lg input-sm sm:input-md"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isSending}
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <input
              type="file"
              className="hidden"
              ref={documentInputRef}
              onChange={handleDocumentChange}
            />

            <button
              type="button"
              className="hidden sm:flex btn btn-circle"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              title="Send image"
            >
              <Image size={20} />
            </button>
            
            <button
              type="button"
              className="hidden sm:flex btn btn-circle"
              onClick={() => documentInputRef.current?.click()}
              disabled={isSending}
              title="Send document"
            >
              <Paperclip size={20} />
            </button>
            
            <button
              type="button"
              className="hidden sm:flex btn btn-circle"
              onClick={() => setIsRecording(true)}
              disabled={isSending}
              title="Record voice message"
            >
              <Mic size={20} />
            </button>
            
            <button
              type="button"
              className="hidden sm:flex btn btn-circle"
              onClick={() => setShowPollCreator(true)}
              disabled={isSending}
              title="Create poll"
            >
              <BarChart2 size={20} />
            </button>
            
            <button
              type="button"
              className="hidden sm:flex btn btn-circle"
              onClick={handleOpenScheduleModal}
              disabled={isSending || (!text.trim() && !imagePreview && !documentName)}
              title="Schedule message"
            >
              <Clock size={20} />
            </button>
          </div>
          <button
            type="submit"
            className={`btn btn-sm btn-circle ${isSending ? 'loading' : ''}`}
            disabled={(!text.trim() && !imagePreview && !documentName) || isSending}
          >
            {!isSending && <Send size={22} />}
          </button>
        </form>
      )}
      
      {/* Schedule Message Modal */}
      <ScheduleMessageModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        groupId={selectedGroup?._id}
        message={{
          text,
          image: imagePreview,
          document: documentName ? {
            data: documentData,
            name: documentName.name,
            type: documentName.type,
            size: documentName.size
          } : null
        }}
      />
    </div>
  );
};

export default GroupMessageInput;