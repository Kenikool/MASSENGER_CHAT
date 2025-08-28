import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  loading: false,

  getUsers: async () => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data || [] });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      set({ users: [] });
      // Only show toast if it's not an authentication error
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || "Failed to fetch users");
      }
    } finally {
      set({ loading: false });
    }
  },
  getMessages: async (userId) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { text, image, voiceMessage, voiceDuration, hasFormatting, onUploadProgress } = messageData;
    const authUser = useAuthStore.getState().authUser;

    try {
      let imageUrl = null;
      let voiceUrl = null;

      // Handle image upload
      if (image) {
        const blob = await (await fetch(image)).blob();
        const formData = new FormData();
        formData.append("image", blob, `image-${Date.now()}.png`);

        const uploadRes = await axiosInstance.post(
          `/messages/upload`,
          formData,
          {
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onUploadProgress?.(progress);
              console.log("Image Upload Progress:", progress);
            },
          }
        );
        imageUrl = uploadRes.data.imageUrl;
      }

      // Handle voice message upload
      if (voiceMessage) {
        console.log('Uploading voice message...');
        
        // Convert base64 to blob
        const response = await fetch(voiceMessage);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append("voice", blob, `voice-${Date.now()}.webm`);
        formData.append("duration", voiceDuration.toString());

        const uploadRes = await axiosInstance.post(
          `/messages/upload-voice`,
          formData,
          {
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onUploadProgress?.(progress);
              console.log("Voice Upload Progress:", progress);
            },
          }
        );
        voiceUrl = uploadRes.data.voiceUrl;
      }

      const finalMessageData = {
        text,
        imageUrl,
        voiceUrl,
        voiceDuration,
        hasFormatting
      };

      console.log('Sending message data:', finalMessageData);

      // Create optimistic message for immediate UI update
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        text,
        image: imageUrl,
        voiceUrl,
        voiceDuration,
        hasFormatting,
        senderId: authUser._id,
        receiverId: selectedUser._id,
        status: 'sending',
        createdAt: new Date().toISOString(),
        reactions: []
      };

      // Immediately add to UI
      set({ messages: [...messages, optimisticMessage] });

      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        finalMessageData
      );

      // Replace optimistic message with real message
      set(state => ({
        messages: state.messages.map(msg => 
          msg._id === optimisticMessage._id ? res.data : msg
        )
      }));

      return res.data;
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Remove optimistic message on error
      set(state => ({
        messages: state.messages.filter(msg => !msg._id.startsWith('temp-'))
      }));
      
      toast.error(error.response?.data?.message || "Failed to send message");
      throw error;
    }
  },

  subscribeToMessages: (socket) => {
    const { selectedUser } = get();
    if (!selectedUser || !socket) return;

    console.log('Subscribing to messages for user:', selectedUser._id);

    socket.on("newMessage", (newMessage) => {
      console.log('📡 Received new message event:', {
        messageId: newMessage._id,
        text: newMessage.text,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
        timestamp: newMessage.createdAt
      });
      
      const authUser = useAuthStore.getState().authUser;
      const currentSelectedUser = get().selectedUser;
      
      console.log('📡 Socket context check:', {
        authUserId: authUser._id,
        selectedUserId: selectedUser._id,
        currentSelectedUserId: currentSelectedUser?._id,
        messageFromUser: newMessage.senderId,
        messageToUser: newMessage.receiverId
      });
      
      // Only process if we're still in the same conversation
      if (!currentSelectedUser || currentSelectedUser._id !== selectedUser._id) {
        console.log('⚠️ Ignoring message - conversation changed');
        return;
      }
      
      // Check if message belongs to current conversation
      const isRelevantMessage = 
        (newMessage.senderId === selectedUser._id && newMessage.receiverId === authUser._id) ||
        (newMessage.senderId === authUser._id && newMessage.receiverId === selectedUser._id);
      
      console.log('📡 Message relevance check:', {
        isRelevantMessage,
        condition1: newMessage.senderId === selectedUser._id && newMessage.receiverId === authUser._id,
        condition2: newMessage.senderId === authUser._id && newMessage.receiverId === selectedUser._id
      });
      
      if (isRelevantMessage) {
        // Check if message already exists (avoid duplicates)
        const currentMessages = get().messages;
        const messageExists = currentMessages.some(msg => msg._id === newMessage._id);
        
        console.log('📡 Duplicate check:', {
          messageExists,
          currentMessageCount: currentMessages.length,
          newMessageId: newMessage._id
        });
        
        if (!messageExists) {
          // Remove any optimistic messages that might match
          const filteredMessages = currentMessages.filter(msg => 
            !msg._id.startsWith('temp-') || 
            (msg.text !== newMessage.text || msg.senderId !== newMessage.senderId)
          );
          
          console.log('✅ Adding new message to store');
          set({
            messages: [...filteredMessages, newMessage],
          });
          
          // Emit a messageDelivered event back to the server if it's not my message
          if (newMessage.senderId !== authUser._id && socket) {
            console.log('📡 Emitting messageDelivered confirmation');
            socket.emit("messageDelivered", {
              messageId: newMessage._id,
              receiverId: authUser._id,
              senderId: newMessage.senderId,
            });
          }
        } else {
          console.log('⚠️ Message already exists, skipping');
        }
      } else {
        console.log('⚠️ Message not relevant to current conversation');
      }
    });
    
    // Also listen for group messages
    socket.on("newGroupMessage", (newMessage) => {
      console.log('Received new group message:', newMessage);
      // Add group message handling if needed
      const currentMessages = get().messages;
      const messageExists = currentMessages.some(msg => msg._id === newMessage._id);
      
      if (!messageExists) {
        set({
          messages: [...currentMessages, newMessage],
        });
      }
    });
  },

  unsubscribeFromMessages: (socket) => {
    if (socket) {
      console.log('Unsubscribing from messages');
      socket.off("newMessage");
      socket.off("newGroupMessage");
    }
  },

  markMessagesAsRead: (messageIds) => {
    set((state) => ({
      messages: state.messages.map((message) => {
        if (messageIds.includes(message._id) && message.status !== "read") {
          return {
            ...message,
            status: "read",
            readBy: [
              ...(message.readBy || []),
              { userId: get().authUser._id, readAt: new Date() }, // Assuming authUser is available in store
            ],
          };
        }
        return message;
      }),
    }));
  },

  markMessagesAsDelivered: (messageId) => {
    set((state) => ({
      messages: state.messages.map((message) => {
        if (message._id === messageId && message.status === "sent") {
          return { ...message, status: "delivered" };
        }
        return message;
      }),
    }));
  },
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  editMessageStore: (updatedMessage) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message._id === updatedMessage._id ? updatedMessage : message
      ),
    }));
  },

  deleteMessageStore: (messageId) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message._id === messageId
          ? { ...message, isDeleted: true, text: "", image: "" }
          : message
      ),
    }));
  },
}));
