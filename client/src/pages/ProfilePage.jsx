
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, X } from "lucide-react";
// ✅ Import the new components
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const ProfilePage = () => {
  const { authUser, loading, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Your profile information</p>
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
              {loading ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fullName}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
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
            {/* ✅ The TransformWrapper handles all the zoom/pan logic */}
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              pinch={{ disabled: false }} // Enable pinch-to-zoom on mobile
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* Optional zoom buttons you can add */}
                  <div className="tools absolute top-2 left-2 z-10 flex gap-2">
                    <button onClick={() => zoomIn()} className="btn btn-sm btn-circle bg-base-300 text-white">+</button>
                    <button onClick={() => zoomOut()} className="btn btn-sm btn-circle bg-base-300 text-white">-</button>
                    <button onClick={() => resetTransform()} className="btn btn-sm bg-base-300 text-white">Reset</button>
                  </div>
                  {/* ✅ TransformComponent wraps the actual image */}
                  <TransformComponent>
                    <img
                      src={getProfilePicUrl()}
                      alt="Profile"
                      className="object-contain max-w-[90vw] max-h-[90vh]"
                      style={{ transition: 'none' }} // Disable transitions for a snappier zoom
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