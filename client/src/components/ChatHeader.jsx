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

  const isSelectedUserOnline = onlineUsers.includes(selectedUser?._id);

  const displayStatus = isTyping
    ? "Typing..."
    : isSelectedUserOnline
    ? "Online"
    : selectedUser?.status || "Offline";

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
              {isSelectedUserOnline && (
                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
              )}
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
