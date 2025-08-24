import { Camera, Edit, Save, User } from "lucide-react";

const ProfileHeader = ({
  authUser,
  loading,
  isOnline,
  lastSeen,
  getProfilePicUrl,
  handleImageUpload,
  setIsModalOpen,
  editMode,
  setEditMode,
  handleSaveDetails,
}) => (
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
      <span className={`badge ${isOnline ? "badge-success" : "badge-ghost"}`}>
        {isOnline ? "Online" : `Last seen ${lastSeen}`}
      </span>
    </div>
  </div>
);

export default ProfileHeader;
