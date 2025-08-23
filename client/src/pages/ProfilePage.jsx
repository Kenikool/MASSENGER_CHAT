import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, X, Edit, Save, Globe } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { toast } from "react-hot-toast";
import ThreeBackground from "../components/ThreeBackground";
import dayjs from "dayjs"; // ✅ Import dayjs
import relativeTime from "dayjs/plugin/relativeTime"; // ✅ Import relativeTime plugin
dayjs.extend(relativeTime);
const ProfilePage = () => {
  const { authUser, loading, updateProfile, updateDetails, onlineUsers } =
    useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    email: authUser?.email || "",
    about: authUser?.about || "",
  });

  // Check if the user is online
  const isOnline = onlineUsers.includes(authUser?._id);

  // Get the last seen timestamp
  const lastSeen = authUser?.lastSeen
    ? dayjs(authUser.lastSeen).fromNow()
    : "Never";

  useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser.fullName,
        email: authUser.email,
        about: authUser.about || "",
      });
    }
  }, [authUser]);

  const getProfilePicUrl = () => {
    return selectedImg || authUser?.profilePic || "/avatar.png";
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveDetails = async () => {
    if (!formData.fullName || !formData.email) {
      toast.error("Full Name and Email are required.");
      return;
    }
    await updateDetails(formData);
    setEditMode(false);
  };

  return (
    <div className="relative min-h-screen">
      <ThreeBackground />

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm text-white">
          <div className="flex flex-col items-center gap-2">
            <span className="loading loading-spinner loading-lg"></span>
            <p>Updating profile...</p>
          </div>
        </div>
      )}

      <div className="relative z-10 h-full pt-20">
        <div className="max-w-2xl mx-auto p-4 py-8">
          {/* ✅ Change the background color to a lighter tone and add transparency */}
          <div className="bg-base-300/50 rounded-xl p-6 space-y-8 backdrop-blur-sm border border-base-content/10">
            <div className="text-center flex flex-col items-center gap-2">
              <h1 className="text-2xl font-semibold">Profile</h1>
              <p className="mt-2">Your profile information</p>
              {!editMode ? (
                <button
                  className="btn btn-sm btn-outline mt-2"
                  onClick={() => setEditMode(true)}
                >
                  <Edit size={16} /> Edit Profile
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-outline mt-2"
                  onClick={handleSaveDetails}
                >
                  <Save size={16} /> Save Changes
                </button>
              )}
            </div>

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

            <div className="space-y-6">
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </div>
                {editMode ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                    {authUser?.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Address
                </div>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                  />
                ) : (
                  <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                    {authUser?.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <User className="w-4 h-4" /> About Me
                </div>
                {editMode ? (
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleInputChange}
                    className="textarea textarea-bordered w-full"
                    rows="4"
                    placeholder="Tell us a little about yourself..."
                  ></textarea>
                ) : (
                  <p className="px-4 py-2.5 bg-base-200 rounded-lg border whitespace-pre-line">
                    {authUser?.about || "No bio yet."}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 bg-base-300 rounded-xl p-6">
              <h2 className="text-lg font-medium mb-4">Account Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                  <span>Member Since</span>
                  <span>{authUser.createdAt?.split("T")[0]}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Account Status</span>
                  <span className="text-green-500">Active</span>
                </div>
              </div>
              {/* ✅ Display Online/Last Seen Status */}
              <div className="flex items-center justify-center gap-2">
                {isOnline ? (
                  <div className="flex items-center gap-1 text-green-500 font-semibold">
                    <Globe size={16} /> Online
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-zinc-400">
                    <Globe size={16} /> Last seen: {lastSeen}
                  </div>
                )}
              </div>
              <hr className="border-t border-zinc-700" />
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <dialog
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          open
        >
          <div className="relative flex items-center justify-center max-w-full max-h-full">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-white bg-base-300 rounded-full p-2 z-10"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              pinch={{ disabled: false }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="tools absolute top-2 left-2 z-10 flex gap-2">
                    <button
                      onClick={() => zoomIn()}
                      className="btn btn-sm btn-circle bg-base-300 text-white"
                    >
                      +
                    </button>
                    <button
                      onClick={() => zoomOut()}
                      className="btn btn-sm btn-circle bg-base-300 text-white"
                    >
                      -
                    </button>
                    <button
                      onClick={() => resetTransform()}
                      className="btn btn-sm bg-base-300 text-white"
                    >
                      Reset
                    </button>
                  </div>
                  <TransformComponent>
                    <img
                      src={getProfilePicUrl()}
                      alt="Profile"
                      className="object-contain max-w-[90vw] max-h-[90vh]"
                      style={{ transition: "none" }}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default ProfilePage;
