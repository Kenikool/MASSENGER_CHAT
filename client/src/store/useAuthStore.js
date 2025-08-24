// import { create } from "zustand";
// import axiosInstance from "../lib/axios";
// import toast from "react-hot-toast";
// import { io } from "socket.io-client";

// const BASE_URL =
//   import.meta.env.MODE === "development" ? "http://localhost:9000" : "/";

// export const useAuthStore = create((set, get) => ({
//   authUser: null,
//   loading: false,
//   checkingAuth: true,
//   onlineUsers: [],
//   socket: null,

//   checkAuth: async () => {
//     try {
//       const res = await axiosInstance.get("/auth/check");
//       set({ authUser: res.data });
//       get().connectSocket();
//     } catch (error) {
//       set({ authUser: null });
//       console.log("error in checkAuth: ", error.message);
//     } finally {
//       set({ checkingAuth: false });
//     }
//   },

//   signup: async (data) => {
//     set({ loading: true });

//     try {
//       const res = await axiosInstance.post("/auth/signup", data);
//       set({ authUser: res.data });
//       toast.success("Account created successfully");
//       get().connectSocket();
//     } catch (error) {
//       console.log("error in signUp: ", error.message);
//       toast.error("Failed to create account", error.response.data.message);
//     } finally {
//       set({ loading: false });
//     }
//   },

//   login: async (data) => {
//     set({ loading: true });

//     try {
//       const res = await axiosInstance.post("/auth/login", data);
//       set({ authUser: res.data });
//       toast.success("Logged in successfully");

//       get().connectSocket();
//     } catch (error) {
//       toast.error(error.response.data.message);
//     } finally {
//       set({ loading: false });
//     }
//   },
//   logout: async () => {
//     // ✅ Only one, corrected logout function
//     try {
//       await axiosInstance.post("/auth/logout");
//       set({ authUser: null, onlineUsers: [] });
//       toast.success("Logged out successfully");
//       get().disconnectSocket();
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed to log out");
//     }
//   },
//   updateProfile: async (data) => {
//     set({ isUpdatingProfile: true });
//     try {
//       const res = await axiosInstance.put("/auth/update-profile", data);
//       set({ authUser: res.data });
//       toast.success("Profile updated successfully");
//     } catch (error) {
//       console.log("error in update profile:", error);
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isUpdatingProfile: false });
//     }
//   },
//   updateDetails: async (data) => {
//     set({ loading: true });
//     try {
//       await axiosInstance.put("/auth/update-details", data);
//       toast.success("Profile Details Updated Successfully");
//       await get().checkAuth(); // Re-authenticate and update user data
//     } catch (error) {
//       const errorMessage =
//         error.response?.data?.message ||
//         "Failed to update profile details due to a network error.";
//       toast.error(errorMessage);
//     } finally {
//       set({ loading: false });
//     }
//   },

//   connectSocket: () => {
//     const { authUser } = get();
//     if (!authUser || get().socket?.connected) return;

//     const socket = io(BASE_URL, {
//       query: {
//         userId: authUser._id,
//       },
//     });
//     socket.connect();

//     set({ socket: socket });

//     socket.on("getOnlineUsers", (userIds) => {
//       set({ onlineUsers: userIds });
//     });
//   },
//   disconnectSocket: () => {
//     if (get().socket?.connected) get().socket.disconnect();
//   },
// }));

import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:9000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  loading: false,
  checkingAuth: true,
  onlineUsers: [],
  socket: null,
  needsTwoFactor: false, // NEW: State to track if 2FA is required

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
      console.log("error in checkAuth: ", error.message);
    } finally {
      set({ checkingAuth: false });
    }
  },

  signup: async (data) => {
    set({ loading: true });

    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      console.log("error in signUp: ", error.message);
      toast.error("Failed to create account", error.response.data.message);
    } finally {
      set({ loading: false });
    }
  },

  login: async (data) => {
    set({ loading: true, needsTwoFactor: false }); // Reset 2FA state on new login attempt

    try {
      const res = await axiosInstance.post("/auth/login", data);
      // NEW: Check if the backend response requires 2FA
      if (res.data.needsTwoFactor) {
        set({ needsTwoFactor: true });
        toast.success("Please enter your 2FA code.");
        return;
      }

      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ loading: false });
    }
  },
  // NEW: Function to verify the 2FA token and complete the login
  verifyTwoFactor: async (token) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/auth/login/2fa", { token });
      set({ authUser: res.data, needsTwoFactor: false });
      toast.success("Login successful!");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message || "Invalid 2FA code.");
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    // ✅ Only one, corrected logout function
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null, onlineUsers: [] });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to log out");
    }
  },
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  updateDetails: async (data) => {
    set({ loading: true });
    try {
      await axiosInstance.put("/auth/update-details", data);
      toast.success("Profile Details Updated Successfully");
      await get().checkAuth(); // Re-authenticate and update user data
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to update profile details due to a network error.";
      toast.error(errorMessage);
    } finally {
      set({ loading: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
