import { X, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useSocketContext } from "../hooks/useSocketContext";
import { toast } from "react-hot-toast";
import axiosInstance from "../lib/axios";
import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";

const ChatHeader = memo(({ isTyping }) => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { authUser } = useAuthStore();
  const { onlineUsers } = useSocketContext();
  const navigate = useNavigate();
  // Remove userStatus state and useEffect for fetching it, as it's already in selectedUser
  // const [userStatus, setUserStatus] = useState("Offline");

  // useEffect(() => {
  //   const fetchUserStatus = async () => {
  //     if (!selectedUser) return;
  //     try {
  //       const res = await axiosInstance.get(
  //         `/users/profile/${selectedUser._id}`
  //       );
  //       setUserStatus(res.data.status);
  //     } catch (error) {
  //       console.error("Failed to fetch user status:", error);
  //       toast.error("Failed to fetch user status.");
  //       setUserStatus("Offline"); // Fallback to offline on error
  //     }
  //   };
  //   fetchUserStatus();
  // }, [selectedUser]);

  const displayStatus = isTyping
    ? "Typing..."
    : selectedUser?.status ||
      (onlineUsers.includes(selectedUser?._id) ? "Online" : "Offline");

  const handleViewProfile = () => {
    if (selectedUser?._id) {
      navigate(`/profile/${selectedUser._id}`);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar - Clickable to view profile */}
          <div
            className="avatar cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleViewProfile}
            title="View Profile"
          >
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info - Clickable to view profile */}
          <div
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleViewProfile}
            title="View Profile"
          >
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">{displayStatus}</p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
});
export default ChatHeader;
