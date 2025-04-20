import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Paperclip, Mic } from "lucide-react";
import toast from "react-hot-toast";
import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import VoiceRecorder from "./VoiceRecorder";

// Performance optimization with memo
const MessageInput = memo(() => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [documentName, setDocumentName] = useState(null); // Just store name, not file object
  const [documentData, setDocumentData] = useState(null); // Store base64 data
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const { sendMessage, sendTypingStatus } = useChatStore();
  const typingTimeoutRef = useRef(null);

  // Performance optimization with useCallback
  const handleTypingStatus = useCallback((newText) => {
    if (newText.trim()) {
      sendTypingStatus(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 2000);
    } else {
      sendTypingStatus(false);
    }
  }, [sendTypingStatus]);

  // Handle typing indicator
  useEffect(() => {
    handleTypingStatus(text);
    
    // Cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTypingStatus(false);
    };
  }, [text, handleTypingStatus, sendTypingStatus]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDocumentChange = useCallback((e) => {
    const file = e.target.files?.[0];
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
  }, []);

  const removeImage = useCallback(() => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeDocument = useCallback(() => {
    setDocumentName(null);
    setDocumentData(null);
    if (documentInputRef.current) documentInputRef.current.value = "";
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !documentName) return;
    if (isSending) return;

    setIsSending(true);
    
    // Store the text value directly
    const messageText = text.trim();
    
    // Create document data object without any File references
    const messageDocument = documentName ? {
      data: documentData,
      name: documentName.name,
      type: documentName.type,
      size: documentName.size
    } : null;
    
    // Clear form immediately
    setText("");
    setImagePreview(null);
    setDocumentName(null);
    setDocumentData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";

    try {
      await sendMessage({
        text: messageText,  // Use the stored text value
        image: imagePreview,
        document: messageDocument
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
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
      await sendMessage({
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

  return (
    <div className="p-4 w-full border-t border-base-300/30 bg-base-100/80 backdrop-blur-sm">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg shadow-apple-sm border border-base-300/30"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-100
              flex items-center justify-center shadow-apple-sm border border-base-300/30"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {documentName && (
        <div className="mb-3 flex items-center gap-2 p-3 bg-base-200/50 rounded-lg shadow-apple-sm">
          <div className="flex-1 flex items-center gap-2">
            <Paperclip className="size-4 text-primary/70" />
            <span className="text-sm truncate">{documentName.name}</span>
          </div>
          <button
            onClick={removeDocument}
            className="w-5 h-5 rounded-full bg-base-100
            flex items-center justify-center shadow-apple-sm border border-base-300/30"
            type="button"
          >
            <X className="size-3" />
          </button>
        </div>
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
              className="w-full input rounded-full shadow-apple-sm bg-base-200/50 border-none focus:ring-2 focus:ring-primary/20"
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
              className="hidden sm:flex btn btn-circle shadow-apple-sm bg-base-200/50 border-none hover:bg-base-200"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              title="Send image"
            >
              <Image size={18} className="text-primary/80" />
            </button>

            <button
              type="button"
              className="hidden sm:flex btn btn-circle shadow-apple-sm bg-base-200/50 border-none hover:bg-base-200"
              onClick={() => documentInputRef.current?.click()}
              disabled={isSending}
              title="Send document"
            >
              <Paperclip size={18} className="text-primary/80" />
            </button>
            
            <button
              type="button"
              className="hidden sm:flex btn btn-circle shadow-apple-sm bg-base-200/50 border-none hover:bg-base-200"
              onClick={() => setIsRecording(true)}
              disabled={isSending}
              title="Record voice message"
            >
              <Mic size={18} className="text-primary/80" />
            </button>
          </div>
          <button
            type="submit"
            className={`btn btn-circle shadow-apple-sm ${isSending ? 'bg-base-200 loading' : 'bg-primary text-primary-content'}`}
            disabled={(!text.trim() && !imagePreview && !documentName) || isSending}
          >
            {!isSending && <Send size={18} />}
          </button>
        </form>
      )}
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;