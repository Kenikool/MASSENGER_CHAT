import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
  authUser: null,
  loading: false,
  checkingAuth: true,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
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
    } catch (error) {
      console.log("error in signUp: ", error.message);
      toast.error("Failed to create account", error.response.data.message);
    } finally {
      set({ loading: false });
    }
  },
  login: async (formData) => {
    set({ loading: true });
    try {
      const res = await axiosInstance.post("/auth/login", formData);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error(error.response?.data.message);
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
      toast.error(error.response.data.message);
    }
  },
  updateProfile: async(data) =>{
    set({loading: true})
    try{
      const res = await axiosInstance.put("/auth/update-profile", data)
      //set({authUser: res.data})
      toast.suceess("Profile Update Successfully")

      await get().checkAuth();
    }catch(error){
    // const errorMessage = error.response?.data?.message 
    // //"Failed to update profile due to a network error.";
    // toast.error(errorMessage);
    }
    finally{
      set({loading: false})
    }
  }
}));
