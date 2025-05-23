// frontend/src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { createSafeDocumentObject } from "../lib/documentUtils"; 

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isTyping: false,
  typingUsers: {}, // Store typing status keyed by user ID
  isMarkingRead: false,
  sendRetries: {},

  markMessagesAsRead: async () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    // Use a debounce mechanism
    if (get().isMarkingRead) return;
    
    try {
      set({ isMarkingRead: true });
      
      // Update local state first for responsive UI
      set(state => ({
        messages: state.messages.map(msg => 
          msg.senderId === selectedUser._id ? {...msg, read: true} : msg
        )
      }));
      
      // Add timeout to reduce frequency of API calls
      setTimeout(async () => {
        try {
          await axiosInstance.put(`/messages/read/${selectedUser._id}`);
          
          // Emit socket event only if API call succeeds
          const socket = useAuthStore.getState().socket;
          if (socket && socket.emit) {
            try {
              socket.emit("messageRead", {
                senderId: selectedUser._id,
                receiverId: useAuthStore.getState().authUser._id
              });
            } catch (socketError) {
              console.error("Error emitting messageRead event:", socketError);
            }
          }
        } catch (error) {
          console.log("Error marking messages as read:", error);
          // Don't show this error to the user - it's not critical
        } finally {
          set({ isMarkingRead: false });
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error preparing to mark messages as read:", error);
      set({ isMarkingRead: false });
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const tempId = Date.now().toString();
    
    // Create a temp document object without any File references
    let tempDocument = null;
    if (messageData.document) {
      tempDocument = {
        name: messageData.document.name || 'Document',
        type: messageData.document.type || 'application/octet-stream',
        size: messageData.document.size || 0,
      };
    }
    
    // Handle voice message preview
    let tempVoiceMessage = null;
    if (messageData.voiceMessage) {
      tempVoiceMessage = {
        duration: messageData.voiceMessage.duration || 0
      };
    }
    
    // Create temporary message object with correct property references
    const tempMessage = {
      _id: tempId,
      senderId: useAuthStore.getState().authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text, 
      image: messageData.image,
      document: tempDocument,
      voiceMessage: tempVoiceMessage,
      createdAt: new Date().toISOString(),
      sending: true
    };
    
    set({ messages: [...messages, tempMessage] });
    
    try {
      // Create a clean copy without any references to file objects
      const apiMessageData = {
        text: messageData.text,
        image: messageData.image,
        document: messageData.document ? {
          data: messageData.document.data,
          name: messageData.document.name,
          type: messageData.document.type,
          size: messageData.document.size
        } : null,
        voiceMessage: messageData.voiceMessage ? {
          data: messageData.voiceMessage.data,
          duration: messageData.voiceMessage.duration
        } : null
      };
      
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, apiMessageData);
      
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === tempId ? res.data : msg
        )
      }));
      
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === tempId ? {...msg, sending: false, failed: true} : msg
        )
      }));
      return false;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.warn("Cannot subscribe to messages: Socket not available");
      return;
    }

    try {
      socket.on("newMessage", (newMessage) => {
        try {
          console.log("🔔 Received newMessage event:", newMessage);
          
          if (!newMessage || typeof newMessage !== 'object') {
            console.warn("Received invalid message data:", newMessage);
            return;
          }
          
          // Extract the sender ID properly whether it's an object or string
          const messageSenderId = typeof newMessage.senderId === 'object' 
            ? newMessage.senderId._id 
            : newMessage.senderId;
          
          // Extract the receiver ID properly
          const messageReceiverId = typeof newMessage.receiverId === 'object'
            ? newMessage.receiverId._id
            : newMessage.receiverId;
          
          console.log("🔍 Message details - Sender:", messageSenderId, "Receiver:", messageReceiverId);
          console.log("🔍 Current context - Selected user:", selectedUser._id, "Current user:", useAuthStore.getState().authUser._id);
            
          const currentUserId = useAuthStore.getState().authUser._id;
          
          // Only process message if:
          // 1. It's from the selected user to current user (normal incoming)
          // 2. It's from current user to selected user (normal outgoing) AND not scheduled
          if ((messageSenderId === selectedUser._id && messageReceiverId === currentUserId) || 
              (messageSenderId === currentUserId && messageReceiverId === selectedUser._id && !newMessage._isScheduled)) {
            
            console.log("✅ Adding message via newMessage event");
            set(state => ({
              messages: [...state.messages, newMessage],
            }));
            
            // Mark message as read if it's from the other person
            if (messageSenderId === selectedUser._id) {
              get().markMessagesAsRead();
            }
          } else {
            console.log("❌ Message not handled by newMessage event");
          }
        } catch (messageError) {
          console.error("Error handling newMessage event:", messageError);
        }
      });
      
      // Listen for typing indicators with error handling
      socket.on("userTyping", (data) => {
        try {
          if (!data || typeof data !== 'object') {
            console.warn("Received invalid userTyping data:", data);
            return;
          }
          
          if (data.senderId === selectedUser._id) {
            set(state => ({
              typingUsers: {
                ...state.typingUsers,
                [data.senderId]: data.isTyping
              }
            }));
          }
        } catch (typingError) {
          console.error("Error handling userTyping event:", typingError);
        }
      });
      
      // Listen for read receipts with error handling
      socket.on("messagesRead", (readerId) => {
        try {
          if (readerId === selectedUser._id) {
            set(state => ({
              messages: state.messages.map(msg => 
                msg.senderId === useAuthStore.getState().authUser._id ? {...msg, read: true} : msg
              )
            }));
          }
        } catch (readError) {
          console.error("Error handling messagesRead event:", readError);
        }
      });
      
      // Listen for message reactions with error handling
      socket.on("messageReaction", (data) => {
        try {
          if (!data || typeof data !== 'object') {
            console.warn("Received invalid messageReaction data:", data);
            return;
          }
          
          const { messageId, reaction, removed } = data;
          if (!messageId) return;
          
          set(state => ({
            messages: state.messages.map(msg => {
              if (msg._id === messageId) {
                // Ensure reactions is always an array
                const currentReactions = Array.isArray(msg.reactions) ? msg.reactions : [];
                
                // If reaction was removed
                if (removed) {
                  return {
                    ...msg,
                    reactions: currentReactions.filter(r => 
                      !(r.userId === reaction?.userId && r.emoji === reaction?.emoji)
                    )
                  };
                }
                
                // If new reaction was added and it's valid
                if (reaction && typeof reaction === 'object' && reaction.emoji) {
                  return {
                    ...msg,
                    reactions: [...currentReactions, reaction]
                  };
                }
                return msg;
              }
              return msg;
            })
          }));
        } catch (reactionError) {
          console.error("Error handling messageReaction event:", reactionError);
        }
      });

      // Listen for scheduled messages specifically
      socket.on("scheduledMessageSent", (data) => {
        try {
          console.log("📅 Received scheduledMessageSent event:", data);
          
          if (!data || !data.message) {
            console.warn("Received invalid scheduled message data");
            return;
          }
          
          const message = data.message;
          
          // Mark message as scheduled to avoid duplicate processing
          message._isScheduled = true;
          
          // Extract IDs properly
          const messageSenderId = typeof message.senderId === 'object' 
            ? message.senderId._id 
            : message.senderId;
          
          const messageReceiverId = typeof message.receiverId === 'object'
            ? message.receiverId._id
            : message.receiverId;
          
          const currentUserId = useAuthStore.getState().authUser._id;
          
          // CRITICAL: Ensure sender ID is explicitly the current user (authUser)
          // This forces the UI to render it as an outgoing message
          if (messageSenderId !== currentUserId) {
            console.log("⚠️ Correcting senderId to match current user");
            message.senderId = currentUserId;
          }
          
          // Only add the message if:
          // 1. The current user is the sender
          // 2. The selected user is the receiver
          if (messageSenderId === currentUserId && selectedUser && messageReceiverId === selectedUser._id) {
            console.log("✅ Adding scheduled message to chat");
            set(state => ({
              messages: [...state.messages, message]
            }));
          } else {
            console.log("❌ Scheduled message not for current chat");
          }
        } catch (error) {
          console.error("Error handling scheduledMessageSent event:", error);
        }
      });
    } catch (subscribeError) {
      console.error("Error setting up message subscription:", subscribeError);
    }
  },
  
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    try {
      socket.off("newMessage");
      socket.off("userTyping");
      socket.off("messagesRead");
      socket.off("messageReaction");
      socket.off("scheduledMessageSent");
    } catch (error) {
      console.error("Error unsubscribing from messages:", error);
    }
  },

  // Send typing status with error handling
  sendTypingStatus: (isTyping) => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    
    try {
      socket.emit("typing", {
        receiverId: selectedUser._id,
        isTyping
      });
    } catch (error) {
      console.error("Error sending typing status:", error);
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/react/${messageId}`, { emoji });
      
      // Update message in state
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? res.data : msg
        )
      }));
      
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to react to message");
      return false;
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
  },
}));