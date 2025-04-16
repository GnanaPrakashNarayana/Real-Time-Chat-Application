import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Paperclip } from "lucide-react"; // Import Paperclip icon
import toast from "react-hot-toast";
import React, { useEffect, useRef, useState } from 'react';

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const { sendMessage, sendTypingStatus } = useChatStore();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (text.trim()) {
      sendTypingStatus(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 2000);
    } else {
      sendTypingStatus(false);
    }
    
    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTypingStatus(false);
    };
  }, [text, sendTypingStatus]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
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
    
    setDocumentFile({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
    });
    
    toast.success(`File selected: ${file.name}`);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDocument = () => {
    setDocumentFile(null);
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

  // In frontend/src/components/MessageInput.jsx
// Update the handleSendMessage function:

const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!text.trim() && !imagePreview && !documentFile) return;
  if (isSending) return; // Prevent double-sending

  setIsSending(true);
  
  // Store values in variables to clear inputs immediately
  const messageText = text.trim();
  const messageImage = imagePreview;
  
  // Fix: Create document data properly
  let messageDocument = null;
  if (documentFile) {
    try {
      const fileData = await readFileAsDataURL(documentFile.file);
      messageDocument = {
        data: fileData,
        name: documentFile.name,
        type: documentFile.type,
        size: documentFile.size,
        file: documentFile.file // Ensure file is included
      };
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Failed to process document file");
      setIsSending(false);
      return;
    }
  }
  
  // Clear form immediately for better UX
  setText("");
  setImagePreview(null);
  setDocumentFile(null);
  if (fileInputRef.current) fileInputRef.current.value = "";
  if (documentInputRef.current) documentInputRef.current.value = "";

  try {
    await sendMessage({
      text: messageText,
      image: messageImage,
      document: messageDocument,
    });
  } catch (error) {
    console.error("Failed to send message:", error);
  } finally {
    setIsSending(false);
  }
};

  // Helper function to read file as data URL
  // Make sure this helper function is correctly implemented in both MessageInput.jsx and GroupMessageInput.jsx

const readFileAsDataURL = (file) => {
  if (!file) {
    return Promise.reject(new Error("No file provided"));
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

  // Add this to both MessageInput.jsx and GroupMessageInput.jsx
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
];

// In handleDocumentChange function
if (!ALLOWED_FILE_TYPES.includes(file.type)) {
  toast.error("File type not supported. Please upload a PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, or TXT file.");
  return;
}

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

      {documentFile && (
        <div className="mb-3 flex items-center gap-2 p-2 bg-base-200 rounded-lg">
          <div className="flex-1 flex items-center gap-2">
            <Paperclip className="size-4" />
            <span className="text-sm truncate">{documentFile.name}</span>
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
        </div>
        <button
          type="submit"
          className={`btn btn-sm btn-circle ${isSending ? 'loading' : ''}`}
          disabled={(!text.trim() && !imagePreview && !documentFile) || isSending}
        >
          {!isSending && <Send size={22} />}
        </button>
      </form>
    </div>
  );
};
export default MessageInput;