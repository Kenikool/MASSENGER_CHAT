// // src/pages/ProfilePage.jsx

// import { useState, useEffect, useRef } from "react";
// import { useAuthStore } from "../store/useAuthStore";
// import {
//   Camera,
//   Mail,
//   User,
//   X,
//   Edit,
//   Save,
//   Globe,
//   MessageSquare,
//   FileText,
//   Award,
//   Lock,
//   Bolt,
//   Calendar,
//   Layers,
//   Circle,
//   Clock,
// } from "lucide-react";
// import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
// import { toast } from "react-hot-toast";
// import ThreeBackground from "../components/ThreeBackground";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// import axiosInstance from "../lib/axios";
// dayjs.extend(relativeTime);

// // ✅ A simple custom hook to get the previous value of a state or prop
// const usePrevious = (value) => {
//   const ref = useRef();
//   useEffect(() => {
//     ref.current = value;
//   });
//   return ref.current;
// };

// // ✅ Mapping for badge icons and descriptions
// const badgeIcons = {
//   "First Message": <MessageSquare size={48} />,
//   Chatterbox: <Award size={48} />,
//   "Early Adopter": <Calendar size={48} />,
//   "Files Shared": <FileText size={48} />,
//   "7-Day Streak": <Bolt size={48} />,
// };

// const badgeDescriptions = {
//   "First Message": "You sent your first message! Welcome to the conversation.",
//   Chatterbox: "You've sent 10+ messages! You're a true Chatterbox!",
//   "Early Adopter":
//     "You've been with us for over a year! Thanks for being an Early Adopter!",
//   "Files Shared":
//     "You shared your first file! A picture is worth a thousand words.",
//   "7-Day Streak":
//     "You've logged in for 7 days straight! What a fantastic streak!",
// };

// const ProfilePage = () => {
//   const { authUser, loading, updateProfile, updateDetails, onlineUsers } =
//     useAuthStore();
//   const [selectedImg, setSelectedImg] = useState(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [formData, setFormData] = useState({
//     fullName: authUser?.fullName || "",
//     email: authUser?.email || "",
//     about: authUser?.about || "",
//   });

//   const [userStats, setUserStats] = useState(null);
//   const [statsLoading, setStatsLoading] = useState(true);
//   const [passwordForm, setPasswordForm] = useState({
//     currentPassword: "",
//     newPassword: "",
//     confirmNewPassword: "",
//   });
//   const [isPasswordLoading, setIsPasswordLoading] = useState(false);
//   const [newlyEarnedBadge, setNewlyEarnedBadge] = useState(null);

//   const isOnline = onlineUsers.includes(authUser?._id);
//   const lastSeen = authUser?.lastSeen
//     ? dayjs(authUser.lastSeen).fromNow()
//     : "Never";

//   const prevBadgeCount = usePrevious(userStats?.badges.length);
//   useEffect(() => {
//     if (userStats?.badges.length > prevBadgeCount) {
//       const newBadge = userStats.badges[userStats.badges.length - 1];
//       setNewlyEarnedBadge(newBadge);
//     }
//   }, [userStats, prevBadgeCount]);

//   useEffect(() => {
//     const fetchUserStats = async () => {
//       try {
//         const res = await axiosInstance.get("/users/stats");
//         setUserStats(res.data);
//       } catch (error) {
//         console.error("Failed to fetch user stats:", error);
//         toast.error("Failed to load user statistics.");
//       } finally {
//         setStatsLoading(false);
//       }
//     };

//     if (authUser) {
//       fetchUserStats();
//     }
//   }, [authUser]);

//   useEffect(() => {
//     if (authUser) {
//       setFormData({
//         fullName: authUser.fullName,
//         email: authUser.email,
//         about: authUser.about || "",
//       });
//     }
//   }, [authUser]);

//   const getProfilePicUrl = () => {
//     return selectedImg || authUser?.profilePic || "/avatar.png";
//   };

//   const handleImageUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.readAsDataURL(file);

//     reader.onload = async () => {
//       const base64Image = reader.result;
//       setSelectedImg(base64Image);
//       await updateProfile({ profilePic: base64Image });
//     };
//   };

//   const handleInputChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSaveDetails = async () => {
//     if (!formData.fullName || !formData.email) {
//       toast.error("Full Name and Email are required.");
//       return;
//     }
//     await updateDetails(formData);
//     setEditMode(false);
//   };

//   const handlePasswordInputChange = (e) => {
//     setPasswordForm({
//       ...passwordForm,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleChangePassword = async (e) => {
//     e.preventDefault();
//     setIsPasswordLoading(true);

//     const { newPassword, confirmNewPassword } = passwordForm;

//     if (newPassword !== confirmNewPassword) {
//       toast.error("New passwords do not match.");
//       setIsPasswordLoading(false);
//       return;
//     }

//     try {
//       await axiosInstance.put("/auth/change-password", passwordForm);
//       toast.success("Password updated successfully!");
//       setPasswordForm({
//         currentPassword: "",
//         newPassword: "",
//         confirmNewPassword: "",
//       });
//     } catch (error) {
//       toast.error(error.response?.data?.error || "Failed to change password.");
//     } finally {
//       setIsPasswordLoading(false);
//     }
//   };

//   return (
//     <div className="relative min-h-screen">
//       <ThreeBackground />

//       {loading && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm text-white">
//           <div className="flex flex-col items-center gap-2">
//             <span className="loading loading-spinner loading-lg"></span>
//             <p>Updating profile...</p>
//           </div>
//         </div>
//       )}

//       <div className="relative z-10 h-full pt-20">
//         <div className="max-w-2xl mx-auto p-4 py-8">
//           <div className="bg-base-300/50 rounded-xl p-6 space-y-8 backdrop-blur-sm border border-base-content/10">
//             <div className="text-center flex flex-col items-center gap-2">
//               <h1 className="text-2xl font-semibold">Profile</h1>
//               <p className="mt-2">Your profile information</p>
//               {!editMode ? (
//                 <button
//                   className="btn btn-sm btn-outline mt-2"
//                   onClick={() => setEditMode(true)}
//                 >
//                   <Edit size={16} /> Edit Profile
//                 </button>
//               ) : (
//                 <button
//                   className="btn btn-sm btn-outline mt-2"
//                   onClick={handleSaveDetails}
//                 >
//                   <Save size={16} /> Save Changes
//                 </button>
//               )}
//             </div>

//             <div className="flex flex-col items-center gap-4">
//               <div className="relative">
//                 <img
//                   src={getProfilePicUrl()}
//                   alt="Profile"
//                   className="size-32 rounded-full object-cover border-4 cursor-pointer"
//                   onClick={() => setIsModalOpen(true)}
//                 />
//                 <label
//                   htmlFor="avatar-upload"
//                   className={`
//                     absolute bottom-0 right-0
//                     bg-base-content hover:scale-105
//                     p-2 rounded-full cursor-pointer
//                     transition-all duration-200
//                     ${loading ? "animate-pulse pointer-events-none" : ""}
//                   `}
//                 >
//                   <Camera className="w-5 h-5 text-base-200" />
//                   <input
//                     type="file"
//                     id="avatar-upload"
//                     className="hidden"
//                     accept="image/*"
//                     onChange={handleImageUpload}
//                     disabled={loading}
//                   />
//                 </label>
//               </div>
//               <p className="text-sm text-zinc-400">
//                 {loading
//                   ? "Uploading..."
//                   : "Click the camera icon to update your photo"}
//               </p>
//             </div>

//             <div className="text-center">
//               <span
//                 className={`badge ${
//                   isOnline ? "badge-success" : "badge-ghost"
//                 }`}
//               >
//                 {isOnline ? "Online" : `Last seen ${lastSeen}`}
//               </span>
//             </div>

//             <div className="space-y-6">
//               <div className="space-y-1.5">
//                 <div className="text-sm text-zinc-400 flex items-center gap-2">
//                   <User className="w-4 h-4" /> Full Name
//                 </div>
//                 {editMode ? (
//                   <input
//                     type="text"
//                     name="fullName"
//                     value={formData.fullName}
//                     onChange={handleInputChange}
//                     className="input input-bordered w-full"
//                   />
//                 ) : (
//                   <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
//                     {authUser?.fullName}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-1.5">
//                 <div className="text-sm text-zinc-400 flex items-center gap-2">
//                   <Mail className="w-4 h-4" /> Email Address
//                 </div>
//                 {editMode ? (
//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     className="input input-bordered w-full"
//                   />
//                 ) : (
//                   <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
//                     {authUser?.email}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-1.5">
//                 <div className="text-sm text-zinc-400 flex items-center gap-2">
//                   <User className="w-4 h-4" /> About Me
//                 </div>
//                 {editMode ? (
//                   <textarea
//                     name="about"
//                     value={formData.about}
//                     onChange={handleInputChange}
//                     className="textarea textarea-bordered w-full"
//                     rows="4"
//                     placeholder="Tell us a little about yourself..."
//                   ></textarea>
//                 ) : (
//                   <p className="px-4 py-2.5 bg-base-200 rounded-lg border whitespace-pre-line">
//                     {authUser?.about || "No bio yet."}
//                   </p>
//                 )}
//               </div>
//             </div>

//             <hr className="border-t border-base-content/10" />

//             <div className="mt-6">
//               <h2 className="text-lg font-medium mb-4">Statistics</h2>
//               {statsLoading ? (
//                 <div className="text-center">
//                   <span className="loading loading-spinner"></span>
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
//                   <div className="card bg-base-200 p-4 rounded-lg flex flex-col items-center">
//                     <MessageSquare size={24} className="text-primary" />
//                     <span className="text-xl font-bold mt-2">
//                       {userStats?.messagesSent}
//                     </span>
//                     <span className="text-xs text-zinc-400">Messages Sent</span>
//                   </div>
//                   <div className="card bg-base-200 p-4 rounded-lg flex flex-col items-center">
//                     <FileText size={24} className="text-secondary" />
//                     <span className="text-xl font-bold mt-2">
//                       {userStats?.filesShared}
//                     </span>
//                     <span className="text-xs text-zinc-400">Files Shared</span>
//                   </div>
//                   <div className="card bg-base-200 p-4 rounded-lg flex flex-col items-center">
//                     <Globe size={24} className="text-accent" />
//                     <span className="text-xl font-bold mt-2">
//                       {userStats?.accountAgeDays}
//                     </span>
//                     <span className="text-xs text-zinc-400">
//                       Days as Member
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <hr className="border-t border-base-content/10" />

//             <div className="mt-6">
//               <h2 className="text-lg font-medium mb-4">Badges</h2>
//               <div className="flex flex-wrap gap-2 justify-center">
//                 {userStats?.badges.length > 0 ? (
//                   userStats.badges.map((badge, index) => (
//                     <div
//                       key={index}
//                       className="badge badge-lg badge-outline gap-2 px-3 py-3 rounded-full"
//                     >
//                       {badgeIcons[badge] || <Award size={16} />}
//                       <span className="ml-1">{badge}</span>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-center text-sm text-zinc-400">
//                     No badges earned yet.
//                   </p>
//                 )}
//               </div>
//             </div>

//             <hr className="border-t border-base-content/10" />

//             <div className="mt-6 bg-base-300 rounded-xl p-6 space-y-4">
//               <div className="flex items-center gap-2 mb-4">
//                 <Lock size={20} />
//                 <h2 className="text-lg font-medium">Change Password</h2>
//               </div>
//               <form onSubmit={handleChangePassword} className="space-y-4">
//                 <div className="form-control">
//                   <label className="label">
//                     <span className="label-text">Current Password</span>
//                   </label>
//                   <input
//                     type="password"
//                     name="currentPassword"
//                     value={passwordForm.currentPassword}
//                     onChange={handlePasswordInputChange}
//                     className="input input-bordered w-full"
//                     required
//                   />
//                 </div>
//                 <div className="form-control">
//                   <label className="label">
//                     <span className="label-text">New Password</span>
//                   </label>
//                   <input
//                     type="password"
//                     name="newPassword"
//                     value={passwordForm.newPassword}
//                     onChange={handlePasswordInputChange}
//                     className="input input-bordered w-full"
//                     required
//                   />
//                 </div>
//                 <div className="form-control">
//                   <label className="label">
//                     <span className="label-text">Confirm New Password</span>
//                   </label>
//                   <input
//                     type="password"
//                     name="confirmNewPassword"
//                     value={passwordForm.confirmNewPassword}
//                     onChange={handlePasswordInputChange}
//                     className="input input-bordered w-full"
//                     required
//                   />
//                 </div>
//                 <button
//                   type="submit"
//                   className="btn btn-primary w-full"
//                   disabled={isPasswordLoading}
//                 >
//                   {isPasswordLoading ? (
//                     <span className="loading loading-spinner"></span>
//                   ) : (
//                     "Change Password"
//                   )}
//                 </button>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>

//       {isModalOpen && (
//         <dialog
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
//           open
//         >
//           <div className="relative flex items-center justify-center max-w-full max-h-full">
//             <button
//               onClick={() => setIsModalOpen(false)}
//               className="absolute top-2 right-2 text-white bg-base-300 rounded-full p-2 z-10"
//               aria-label="Close"
//             >
//               <X size={24} />
//             </button>
//             <TransformWrapper
//               initialScale={1}
//               minScale={0.5}
//               maxScale={4}
//               pinch={{ disabled: false }}
//             >
//               {({ zoomIn, zoomOut, resetTransform }) => (
//                 <>
//                   <div className="tools absolute top-2 left-2 z-10 flex gap-2">
//                     <button
//                       onClick={() => zoomIn()}
//                       className="btn btn-sm btn-circle bg-base-300 text-white"
//                     >
//                       +
//                     </button>
//                     <button
//                       onClick={() => zoomOut()}
//                       className="btn btn-sm btn-circle bg-base-300 text-white"
//                     >
//                       -
//                     </button>
//                     <button
//                       onClick={() => resetTransform()}
//                       className="btn btn-sm bg-base-300 text-white"
//                     >
//                       Reset
//                     </button>
//                   </div>
//                   <TransformComponent>
//                     <img
//                       src={getProfilePicUrl()}
//                       alt="Profile"
//                       className="object-contain max-w-[90vw] max-h-[90vh]"
//                       style={{ transition: "none" }}
//                     />
//                   </TransformComponent>
//                 </>
//               )}
//             </TransformWrapper>
//           </div>
//         </dialog>
//       )}

//       {newlyEarnedBadge && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
//           <div className="card bg-base-100 p-8 text-center max-w-sm w-full space-y-4 relative">
//             <button
//               onClick={() => setNewlyEarnedBadge(null)}
//               className="absolute top-2 right-2 btn btn-ghost btn-sm btn-circle"
//             >
//               <X size={20} />
//             </button>
//             <h2 className="text-2xl font-bold text-success">
//               Congratulations!
//             </h2>
//             <p className="text-lg">You've earned a new badge:</p>
//             <div className="flex flex-col items-center space-y-2">
//               <div className="text-success">{badgeIcons[newlyEarnedBadge]}</div>
//               <p className="text-xl font-semibold">{newlyEarnedBadge}</p>
//             </div>
//             <p className="text-sm text-zinc-400">
//               {badgeDescriptions[newlyEarnedBadge]}
//             </p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProfilePage;

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Camera,
  Mail,
  User,
  X,
  Edit,
  Save,
  Globe,
  MessageSquare,
  FileText,
  Award,
  Lock,
  Bolt,
  Calendar,
  Layers,
  Circle,
  Clock,
  KeyRound, // NEW: Icon for 2FA
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { toast } from "react-hot-toast";
import ThreeBackground from "../components/ThreeBackground";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import axiosInstance from "../lib/axios";
dayjs.extend(relativeTime);

// ✅ A simple custom hook to get the previous value of a state or prop
const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

// ✅ Mapping for badge icons and descriptions
const badgeIcons = {
  "First Message": <MessageSquare size={48} />,
  Chatterbox: <Award size={48} />,
  "Early Adopter": <Calendar size={48} />,
  "Files Shared": <FileText size={48} />,
  "7-Day Streak": <Bolt size={48} />,
};

const badgeDescriptions = {
  "First Message": "You sent your first message! Welcome to the conversation.",
  Chatterbox: "You've sent 10+ messages! You're a true Chatterbox!",
  "Early Adopter":
    "You've been with us for over a year! Thanks for being an Early Adopter!",
  "Files Shared":
    "You shared your first file! A picture is worth a thousand words.",
  "7-Day Streak":
    "You've logged in for 7 days straight! What a fantastic streak!",
};

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

  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState(null);
  const [twoFactorToken, setTwoFactorToken] = useState(""); // NEW
  const [twoFactorQRCode, setTwoFactorQRCode] = useState(""); // NEW
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    authUser?.isTwoFactorEnabled || false
  ); // NEW
  const [is2faLoading, setIs2faLoading] = useState(false); // NEW

  const isOnline = onlineUsers.includes(authUser?._id);
  const lastSeen = authUser?.lastSeen
    ? dayjs(authUser.lastSeen).fromNow()
    : "Never";

  const prevBadgeCount = usePrevious(userStats?.badges.length);
  useEffect(() => {
    if (userStats?.badges.length > prevBadgeCount) {
      const newBadge = userStats.badges[userStats.badges.length - 1];
      setNewlyEarnedBadge(newBadge);
    }
  }, [userStats, prevBadgeCount]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await axiosInstance.get("/users/stats");
        setUserStats(res.data);
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
        toast.error("Failed to load user statistics.");
      } finally {
        setStatsLoading(false);
      }
    };

    if (authUser) {
      fetchUserStats();
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      setFormData({
        fullName: authUser.fullName,
        email: authUser.email,
        about: authUser.about || "",
      });
      setTwoFactorEnabled(authUser.isTwoFactorEnabled || false);
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

  const handlePasswordInputChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsPasswordLoading(true);

    const { newPassword, confirmNewPassword } = passwordForm;

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      setIsPasswordLoading(false);
      return;
    }

    try {
      await axiosInstance.put("/auth/change-password", passwordForm);
      toast.success("Password updated successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to change password.");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // NEW: 2FA handlers
  const handleSetupTwoFactor = async () => {
    setIs2faLoading(true);
    try {
      const res = await axiosInstance.post("/auth/2fa/setup");
      setTwoFactorQRCode(res.data.qrCode);
      toast.success("Scan the QR code to set up 2FA");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to set up 2FA");
    } finally {
      setIs2faLoading(false);
    }
  };

  const handleVerifyTwoFactor = async () => {
    if (!twoFactorToken) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setIs2faLoading(true);
    try {
      await axiosInstance.post("/auth/2fa/verify", { token: twoFactorToken });
      setTwoFactorEnabled(true);
      setTwoFactorQRCode("");
      setTwoFactorToken("");
      toast.success("2FA enabled successfully!");
      // Re-fetch user data to update the authUser state
      await useAuthStore.getState().checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid code");
    } finally {
      setIs2faLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
            <ThreeBackground />     {" "}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm text-white">
                   {" "}
          <div className="flex flex-col items-center gap-2">
                       {" "}
            <span className="loading loading-spinner loading-lg"></span>       
                <p>Updating profile...</p>         {" "}
          </div>
                 {" "}
        </div>
      )}
           {" "}
      <div className="relative z-10 h-full pt-20">
               {" "}
        <div className="max-w-2xl mx-auto p-4 py-8">
                   {" "}
          <div className="bg-base-300/50 rounded-xl p-6 space-y-8 backdrop-blur-sm border border-base-content/10">
                       {" "}
            <div className="text-center flex flex-col items-center gap-2">
                            <h1 className="text-2xl font-semibold">Profile</h1> 
                          <p className="mt-2">Your profile information</p>     
                     {" "}
              {!editMode ? (
                <button
                  className="btn btn-sm btn-outline mt-2"
                  onClick={() => setEditMode(true)}
                >
                                    <Edit size={16} /> Edit Profile            
                     {" "}
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-outline mt-2"
                  onClick={handleSaveDetails}
                >
                                    <Save size={16} /> Save Changes            
                     {" "}
                </button>
              )}
                         {" "}
            </div>
                       {" "}
            <div className="flex flex-col items-center gap-4">
                           {" "}
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
                                   {" "}
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={loading}
                  />
                                 {" "}
                </label>
                             {" "}
              </div>
                           {" "}
              <p className="text-sm text-zinc-400">
                               {" "}
                {loading
                  ? "Uploading..."
                  : "Click the camera icon to update your photo"}
                             {" "}
              </p>
                         {" "}
            </div>
                       {" "}
            <div className="text-center">
                           {" "}
              <span
                className={`badge ${
                  isOnline ? "badge-success" : "badge-ghost"
                }`}
              >
                                {isOnline ? "Online" : `Last seen ${lastSeen}`} 
                           {" "}
              </span>
                         {" "}
            </div>
                       {" "}
            <div className="space-y-6">
                           {" "}
              <div className="space-y-1.5">
                               {" "}
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Full Name      
                           {" "}
                </div>
                               {" "}
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
                                        {authUser?.fullName}                 {" "}
                  </p>
                )}
                             {" "}
              </div>
                           {" "}
              <div className="space-y-1.5">
                               {" "}
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> Email Address  
                               {" "}
                </div>
                               {" "}
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
                                        {authUser?.email}                 {" "}
                  </p>
                )}
                             {" "}
              </div>
                           {" "}
              <div className="space-y-1.5">
                               {" "}
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                                    <User className="w-4 h-4" /> About Me      
                           {" "}
                </div>
                               {" "}
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
                               {" "}
                  </p>
                )}
                             {" "}
              </div>
                         {" "}
            </div>
                        <hr className="border-t border-base-content/10" />     
                 {" "}
            <div className="mt-6">
                           {" "}
              <h2 className="text-lg font-medium mb-4">Statistics</h2>         
                 {" "}
              {statsLoading ? (
                <div className="text-center">
                                   {" "}
                  <span className="loading loading-spinner"></span>             
                   {" "}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                                   {" "}
                  <div className="card bg-base-200 p-4 rounded-lg flex flex-col items-center">
                                       {" "}
                    <MessageSquare size={24} className="text-primary" />       
                               {" "}
                    <span className="text-xl font-bold mt-2">
                                            {userStats?.messagesSent}           
                             {" "}
                    </span>
                                       {" "}
                    <span className="text-xs text-zinc-400">Messages Sent</span>
                                     {" "}
                  </div>
                                   {" "}
                  <div className="card bg-base-200 p-4 rounded-lg flex flex-col items-center">
                                       {" "}
                    <FileText size={24} className="text-secondary" />           
                           {" "}
                    <span className="text-xl font-bold mt-2">
                                            {userStats?.filesShared}           
                             {" "}
                    </span>
                                       {" "}
                    <span className="text-xs text-zinc-400">Files Shared</span> 
                                   {" "}
                  </div>
                                   {" "}
                  <div className="card bg-base-200 p-4 rounded-lg flex flex-col items-center">
                                       {" "}
                    <Globe size={24} className="text-accent" />                 
                     {" "}
                    <span className="text-xl font-bold mt-2">
                                            {userStats?.accountAgeDays}         
                               {" "}
                    </span>
                                       {" "}
                    <span className="text-xs text-zinc-400">
                                            Days as Member                    {" "}
                    </span>
                                     {" "}
                  </div>
                                 {" "}
                </div>
              )}
                         {" "}
            </div>
                        <hr className="border-t border-base-content/10" />     
                 {" "}
            <div className="mt-6">
                            <h2 className="text-lg font-medium mb-4">Badges</h2>
                           {" "}
              <div className="flex flex-wrap gap-2 justify-center">
                               {" "}
                {userStats?.badges.length > 0 ? (
                  userStats.badges.map((badge, index) => (
                    <div
                      key={index}
                      className="badge badge-lg badge-outline gap-2 px-3 py-3 rounded-full"
                    >
                                           {" "}
                      {badgeIcons[badge] || <Award size={16} />}               
                            <span className="ml-1">{badge}</span>               
                       {" "}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-zinc-400">
                                        No badges earned yet.                  {" "}
                  </p>
                )}
                             {" "}
              </div>
                         {" "}
            </div>
                        <hr className="border-t border-base-content/10" />     
                 {" "}
            <div className="mt-6 bg-base-300 rounded-xl p-6 space-y-4">
                           {" "}
              <div className="flex items-center gap-2 mb-4">
                                <Lock size={20} />               {" "}
                <h2 className="text-lg font-medium">Change Password</h2>       
                     {" "}
              </div>
                           {" "}
              <form onSubmit={handleChangePassword} className="space-y-4">
                               {" "}
                <div className="form-control">
                                   {" "}
                  <label className="label">
                                       {" "}
                    <span className="label-text">Current Password</span>       
                             {" "}
                  </label>
                                   {" "}
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    className="input input-bordered w-full"
                    required
                  />
                                 {" "}
                </div>
                               {" "}
                <div className="form-control">
                                   {" "}
                  <label className="label">
                                       {" "}
                    <span className="label-text">New Password</span>           
                         {" "}
                  </label>
                                   {" "}
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    className="input input-bordered w-full"
                    required
                  />
                                 {" "}
                </div>
                               {" "}
                <div className="form-control">
                                   {" "}
                  <label className="label">
                                       {" "}
                    <span className="label-text">Confirm New Password</span>   
                                 {" "}
                  </label>
                                   {" "}
                  <input
                    type="password"
                    name="confirmNewPassword"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordInputChange}
                    className="input input-bordered w-full"
                    required
                  />
                                 {" "}
                </div>
                               {" "}
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={isPasswordLoading}
                >
                                   {" "}
                  {isPasswordLoading ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Change Password"
                  )}
                                 {" "}
                </button>
                             {" "}
              </form>
                         {" "}
            </div>
            <hr className="border-t border-base-content/10" />
            <div className="mt-6 bg-base-300 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound size={20} />
                <h2 className="text-lg font-medium">
                  Two-Factor Authentication
                </h2>
              </div>
              {!twoFactorEnabled ? (
                <div>
                  <p className="text-sm text-zinc-400">
                    Protect your account with an extra layer of security.
                  </p>
                  <button
                    className="btn btn-primary mt-4"
                    onClick={handleSetupTwoFactor}
                    disabled={is2faLoading}
                  >
                    {is2faLoading ? (
                      <span className="loading loading-spinner" />
                    ) : (
                      "Enable 2FA"
                    )}
                  </button>

                  {twoFactorQRCode && (
                    <div className="mt-6 flex flex-col items-center">
                      <p className="mb-4 text-center text-sm">
                        1. Scan this QR code with your authenticator app (e.g.,
                        Google Authenticator).
                      </p>
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <img
                          src={twoFactorQRCode}
                          alt="2FA QR Code"
                          className="w-40 h-40"
                        />
                      </div>
                      <p className="mt-4 text-center text-sm">
                        2. Enter the 6-digit code from the app below.
                      </p>
                      <input
                        type="text"
                        placeholder="Enter 2FA code"
                        className="input input-bordered w-full max-w-xs mt-4"
                        value={twoFactorToken}
                        onChange={(e) => setTwoFactorToken(e.target.value)}
                      />
                      <button
                        className="btn btn-success w-full max-w-xs mt-2"
                        onClick={handleVerifyTwoFactor}
                        disabled={is2faLoading}
                      >
                        {is2faLoading ? (
                          <span className="loading loading-spinner" />
                        ) : (
                          "Verify and Enable"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p>Two-factor authentication is currently **enabled**.</p>
                  <button className="btn btn-error mt-4" disabled>
                    Disable 2FA (Not Implemented)
                  </button>
                </div>
              )}
            </div>
                     {" "}
          </div>
                 {" "}
        </div>
             {" "}
      </div>
           {" "}
      {isModalOpen && (
        <dialog
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          open
        >
                   {" "}
          <div className="relative flex items-center justify-center max-w-full max-h-full">
                       {" "}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-white bg-base-300 rounded-full p-2 z-10"
              aria-label="Close"
            >
                            <X size={24} />           {" "}
            </button>
                       {" "}
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              pinch={{ disabled: false }}
            >
                           {" "}
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                                   {" "}
                  <div className="tools absolute top-2 left-2 z-10 flex gap-2">
                                       {" "}
                    <button
                      onClick={() => zoomIn()}
                      className="btn btn-sm btn-circle bg-base-300 text-white"
                    >
                                            +                    {" "}
                    </button>
                                       {" "}
                    <button
                      onClick={() => zoomOut()}
                      className="btn btn-sm btn-circle bg-base-300 text-white"
                    >
                                            -                    {" "}
                    </button>
                                     
                    <button
                      onClick={() => resetTransform()}
                      className="btn btn-sm bg-base-300 text-white"
                    >
                      Reset
                    </button>
                                     {" "}
                  </div>
                                   {" "}
                  <TransformComponent>
                                       {" "}
                    <img
                      src={getProfilePicUrl()}
                      alt="Profile"
                      className="object-contain max-w-[90vw] max-h-[90vh]"
                      style={{ transition: "none" }}
                    />
                                     {" "}
                  </TransformComponent>
                                 {" "}
                </>
              )}
                         {" "}
            </TransformWrapper>
                     {" "}
          </div>
                 {" "}
        </dialog>
      )}
           {" "}
      {newlyEarnedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                   {" "}
          <div className="card bg-base-100 p-8 text-center max-w-sm w-full space-y-4 relative">
                       {" "}
            <button
              onClick={() => setNewlyEarnedBadge(null)}
              className="absolute top-2 right-2 btn btn-ghost btn-sm btn-circle"
            >
                            <X size={20} />           {" "}
            </button>
                       {" "}
            <h2 className="text-2xl font-bold text-success">
                            Congratulations!            {" "}
            </h2>
                        <p className="text-lg">You've earned a new badge:</p>   
                   {" "}
            <div className="flex flex-col items-center space-y-2">
                           {" "}
              <div className="text-success">{badgeIcons[newlyEarnedBadge]}</div>
                           {" "}
              <p className="text-xl font-semibold">{newlyEarnedBadge}</p>       
                 {" "}
            </div>
                       {" "}
            <p className="text-sm text-zinc-400">
                            {badgeDescriptions[newlyEarnedBadge]}           {" "}
            </p>
                     {" "}
          </div>
                 {" "}
        </div>
      )}
         {" "}
    </div>
  );
};

export default ProfilePage;
