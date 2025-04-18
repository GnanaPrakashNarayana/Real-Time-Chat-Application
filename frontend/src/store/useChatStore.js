// frontend/src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { createSafeDocumentObject } from "../lib/documentUtils";

export const useChatStore = create((set, get) => ({
  /* ------------- STATE ------------- */
  messages: [],
  users: [],
  selectedUser: null,

  isUsersLoading: false,
  isMessagesLoading: false,

  isTyping: false,
  typingUsers: {}, // keyed by userId

  smartReplies: [],
  isLoadingSmartReplies: false,

  isMarkingRead: false,
  sendRetries: {},

  /* ---------- CONTACTS ---------- */

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/auth/users");
      set({ users: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn’t load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /* ---------- MESSAGES ---------- */

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });

    /* Helper‑bot conversation is stored locally */
    if (userId === "helper") {
      const cached = JSON.parse(localStorage.getItem("helperMessages") || "[]");
      set({ messages: cached, isMessagesLoading: false });
      return;
    }

    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    /* ========  CHAT WITH HELPER BOT  ======== */
    if (selectedUser && selectedUser._id === "helper") {
      const tempId = Date.now().toString();

      // optimistic “sending…” bubble
      const userMsg = {
        _id: tempId,
        senderId: authUser._id,
        receiverId: "helper",
        text: messageData.text,
        createdAt: new Date().toISOString(),
        sending: true
      };
      set({ messages: [...messages, userMsg] });

      try {
        const res = await axiosInstance.post("/ai/chat", {
          message: messageData.text
        });

        const botMsg = {
          _id: res.data.id,
          senderId: "helper",
          receiverId: authUser._id,
          text: res.data.text,
          createdAt: new Date().toISOString()
        };

        set((s) => ({
          messages: s.messages
            .map((m) =>
              m._id === tempId ? { ...m, sending: false } : m
            )
            .concat(botMsg)
        }));

        /* persist the whole thread locally */
        const history = JSON.parse(
          localStorage.getItem("helperMessages") || "[]"
        );
        localStorage.setItem(
          "helperMessages",
          JSON.stringify([...history, userMsg, botMsg])
        );
      } catch {
        toast.error("Helper bot failed to respond");
      }
      return; // stop here, don’t hit regular API
    }
    /* ========================================= */

    /* === NORMAL USER‑TO‑USER MESSAGE FLOW === */

    const tempId = Date.now().toString();

    let tempDocument = null;
    if (messageData.document) {
      tempDocument = createSafeDocumentObject(messageData.document);
    }

    let tempVoiceMessage = null;
    if (messageData.voiceMessage) {
      tempVoiceMessage = {
        data: messageData.voiceMessage.data,
        duration: messageData.voiceMessage.duration
      };
    }

    const tempMessage = {
      _id: tempId,
      senderId: authUser._id,
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
      const apiPayload = { ...messageData };
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        apiPayload
      );

      // replace temp with actual message from server
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === tempId ? res.data : m
        )
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Message failed");
      // mark as failed
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === tempId ? { ...m, sending: false, failed: true } : m
        )
      }));
    }
  },

  /* ---------- READ RECEIPTS ---------- */

  markMessagesAsRead: async () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    // debounce
    if (get().isMarkingRead) return;

    try {
      set({ isMarkingRead: true });

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.senderId === selectedUser._id ? { ...msg, read: true } : msg
        )
      }));

      await axiosInstance.put(`/messages/read/${selectedUser._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      set({ isMarkingRead: false });
    }
  },

  /* ---------- TYPING INDICATORS ---------- */

  setTyping: (userId, isTyping) => {
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: isTyping }
    }));
  },

  /* ---------- SMART REPLIES ---------- */

  getSmartReplies: async (message) => {
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length < 2
    )
      return;

    set({ isLoadingSmartReplies: true });
    try {
      // context = last 5 messages
      const recent = get().messages
        .slice(-5)
        .map((m) => m.text)
        .filter(Boolean);

      let endpoint = "/smart-replies/generate";
      let payload = { message };

      if (recent.length > 1) {
        endpoint = "/smart-replies/generate-with-context";
        payload = { message, context: recent };
      }

      const res = await axiosInstance.post(endpoint, payload);

      if (Array.isArray(res.data.replies) && res.data.replies.length) {
        set({ smartReplies: res.data.replies, isLoadingSmartReplies: false });
      } else {
        set({ smartReplies: [], isLoadingSmartReplies: false });
      }
    } catch (err) {
      console.error("Smart‑reply error:", err);
      set({ smartReplies: [], isLoadingSmartReplies: false });
    }
  },

  clearSmartReplies: () => set({ smartReplies: [] })
}));
