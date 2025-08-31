// src/store/useAuthStore.js

import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
import.meta.env.MODE === "development"
    ? "http://localhost:9000/api"
    : "https://massenger-chat.onrender.com/api";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  loading: false,
  checkingAuth: true,
  needsTwoFactor: false,
  showNewBadge: null,

  markBadgeAsSeen: async (badgeName) => {
    try {
      // Update the user profile on the backend to mark the badge as seen
      await axiosInstance.put("/auth/mark-badge-seen", { badgeName }); // Update the local state to prevent the modal from showing again

      set((state) => ({
        authUser: {
          ...state.authUser,
          seenBadges: [...(state.authUser.seenBadges || []), badgeName],
        },
      }));
    } catch (error) {
      console.error("Failed to mark badge as seen:", error);
    }
  },
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      if (res.data && res.data._id) {
        set({ authUser: res.data });
      } else {
        set({ authUser: null });
      }
    } catch (error) {
      set({ authUser: null });
      console.error("Error in checkAuth:", error.message);
    } finally {
      set({ checkingAuth: false });
    }
  },

  signup: async (data) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      toast.success(res.data.message);
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to create account. Please try again.";
      toast.error(errorMessage);
      console.error("Error in signUp:", error.message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  login: async ({ email, password, token = "" }) => {
    set({ loading: true, needsTwoFactor: false });
    try {
      const res = await axiosInstance.post("/auth/login", {
        email,
        password,
        token,
      });

      if (res.data.needsTwoFactor) {
        set({ needsTwoFactor: true });
        toast.success("Please enter your 2FA code.");
        return res.data;
      }

      set({ authUser: res.data, needsTwoFactor: false });
      toast.success("Logged in successfully");
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Invalid credentials.";
      toast.error(errorMessage);
      console.error("Error in login:", error.message);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to log out.";
      toast.error(errorMessage);
      console.error("Error in logout:", error.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error in update profile:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update profile.";
      toast.error(errorMessage);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  updateDetails: async (data) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.put("/auth/update-details", data);
      set({ authUser: res.data });
      toast.success("Profile Details Updated Successfully");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to update profile details due to a network error.";
      toast.error(errorMessage);
      console.error("Error in update details:", error);
    } finally {
      set({ loading: false });
    }
  }, // NEW FUNCTION: This is for handling the email change

  requestEmailChange: async ({ newEmail, currentPassword }) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/auth/request-email-change", {
        newEmail,
        currentPassword,
      });
      toast.success(res.data.message);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to request email change.";
      toast.error(errorMessage);
      console.error("Error in requestEmailChange:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },


}));
