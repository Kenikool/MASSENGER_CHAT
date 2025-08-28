import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useSocketContext } from "../hooks/useSocketContext";
import { useNavigate } from "react-router-dom";
const Sidebar = () => {
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { authUser } = useAuthStore();
  const { onlineUsers } = useSocketContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch users if user is authenticated
    if (authUser) {
      getUsers();
    }
  }, [getUsers, authUser]);

  const filteredUsers = showOnlineOnly
    ? (users || []).filter((user) => onlineUsers.includes(user._id))
    : users || [];

  const handleViewProfile = (e, userId) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    navigate(`/profile/${userId}`);
  };
  if (isUsersLoading || !authUser) {
    return <SidebarSkeleton />;
  }
  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        {/* TODO: Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>
      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3 group
              hover:bg-base-300 transition-all duration-200
              ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
              {/* Profile view button */}
              <button
                onClick={(e) => handleViewProfile(e, user._id)}
                className="absolute -top-1 -right-1 size-7 bg-primary/90 hover:bg-primary text-primary-content rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                title={`View ${user.fullName}'s profile`}
              >
                <User className="size-4" />
              </button>
            </div>

            {/* User info - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="flex items-center gap-1 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  onlineUsers.includes(user._id) 
                    ? "bg-green-500" 
                    : "bg-gray-400"
                }`}></div>
                <span className={onlineUsers.includes(user._id) ? "text-green-600" : "text-zinc-400"}>
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
