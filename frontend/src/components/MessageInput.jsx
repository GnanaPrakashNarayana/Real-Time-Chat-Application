import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import React, { useEffect, useRef, useState } from 'react';

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [documentName, setDocumentName] = useState(null); // Just store name, not file object
  const [documentData, setDocumentData] = useState(null); // Store base64 data
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const { sendMessage, sendTypingStatus } = useChatStore();
  const typingTimeoutRef = useRef(null);

  // Keep existing useEffect code for typing status

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

  // In frontend/src/components/MessageInput.jsx
  // Find the handleSendMessage function and update it:

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
          disabled={(!text.trim() && !imagePreview && !documentName) || isSending}
        >
          {!isSending && <Send size={22} />}
        </button>
      </form>
    </div>
  );
};
export default MessageInput;