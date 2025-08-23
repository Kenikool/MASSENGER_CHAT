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
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data.message || "Failed to fetch users");
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
  // sendMessage: async (messageData) => {
  //   const { selectedUser, messages } = get();
  //    const { text, image, onUploadProgress } = messageData;
  //   try {

  //      let imageUrl = null;
  //     if (image) {
  //       // Convert data URL to a Blob
  //       const blob = await (await fetch(image)).blob();
  //       const formData = new FormData();
  //       formData.append("image", blob, `image-${Date.now()}.png`);

  //       // Send the image to the server with a progress callback
  //       const uploadRes = await axiosInstance.post(
  //         `/messages/upload`, // Your image upload endpoint
  //         formData,
  //         {
  //           headers: {
  //             "Content-Type": "multipart/form-data",
  //           },
  //           onUploadProgress: (progressEvent) => {
  //             const progress = Math.round(
  //               (progressEvent.loaded * 100) / progressEvent.total
  //             );
  //             onUploadProgress(progress);
  //           },
  //         }
  //       );
  //       imageUrl = uploadRes.data.imageUrl;
  //     }


  //     const res = await axiosInstance.post(
  //       `/messages/send/${selectedUser._id}`,
  //       messageData
  //     );
  //     set({ messages: [...messages, res.data] });
  //     return res.data;
  //   } catch (error) {
  //     toast.error(error.response.data.message);
  //   }
  // },


 sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { text, image, onUploadProgress } = messageData;

    try {
      let imageUrl = null;
      if (image) {
        const blob = await (await fetch(image)).blob();
        const formData = new FormData();
        formData.append("image", blob, `image-${Date.now()}.png`);

        const uploadRes = await axiosInstance.post(
          `/messages/upload`,
          formData,
          {
            // ✅ This is the correct way to pass the callback
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onUploadProgress(progress);
              // ✅ Add a console.log to debug the progress value
              console.log("Upload Progress:", progress);
            },
          }
        );
        imageUrl = uploadRes.data.imageUrl;
      }

      const finalMessageData = {
        text,
        imageUrl,
      };

      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        finalMessageData
      );

      set({ messages: [...messages, res.data] });
      return res.data;
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
      throw error;
    }
  },
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
