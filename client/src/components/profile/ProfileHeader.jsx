import { Camera, Edit, Save, User } from "lucide-react";
import { useSocketContext } from "../../hooks/useSocketContext";

const ProfileHeader = ({
  authUser,
  loading,
  getProfilePicUrl,
  handleImageUpload,
  setIsModalOpen,
  editMode,
  setEditMode,
  handleSaveDetails,
}) => {
  const { onlineUsers } = useSocketContext();
  const isOnline = onlineUsers.includes(authUser?._id);
  const lastSeen = authUser?.lastSeen
    ? new Date(authUser.lastSeen).toLocaleString()
    : "Never";

  return (
  <div className="text-center flex flex-col items-center gap-2">
    <div className="flex justify-between items-center w-full max-w-xs">
      <div></div>
      <h1 className="text-2xl font-semibold">Profile</h1>
      {!editMode ? (
        <button
          className="btn btn-sm btn-outline mt-2"
          onClick={() => setEditMode(true)}
        >
          <Edit size={16} />
        </button>
      ) : (
        <button
          className="btn btn-sm btn-outline mt-2"
          onClick={handleSaveDetails}
        >
          <Save size={16} />
        </button>
      )}
    </div>
    <p className="mt-2">Your profile information</p>
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <img
          src={getProfilePicUrl()}
          alt="Profile"
          className="size-32 rounded-full object-cover border-4 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        />
        <label
          htmlFor="avatar-upload"
          className={`
            absolute bottom-0 right-0
            bg-base-content hover:scale-105
            p-2 rounded-full cursor-pointer
            transition-all duration-200
            ${loading ? "animate-pulse pointer-events-none" : ""}
          `}
        >
          <Camera className="w-5 h-5 text-base-200" />
          <input
            type="file"
            id="avatar-upload"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={loading}
          />
        </label>
      </div>
      <p className="text-sm text-zinc-400">
        {loading
          ? "Uploading..."
          : "Click the camera icon to update your photo"}
      </p>
    </div>
    <div className="text-center">
      <div className={`flex items-center justify-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
        isOnline 
          ? "bg-green-100 text-green-800 border border-green-200" 
          : "bg-gray-100 text-gray-600 border border-gray-200"
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
        }`}></div>
        <span>
          {isOnline ? "Online" : `Last seen ${lastSeen}`}
        </span>
      </div>
    </div>
  </div>
  );
};

export default ProfileHeader;
