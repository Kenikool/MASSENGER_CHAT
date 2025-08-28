import React, {
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  useCallback,
} from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Award,
  Bolt,
  Calendar,
  FileText,
  MessageSquare,
  X,
  Lock,
  Shield,
  LogOut,
  Mail,
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { toast } from "react-hot-toast";
import ThreeBackground from "../components/ThreeBackground";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import axiosInstance from "../lib/axios";

// Import components
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileDetails from "../components/profile/ProfileDetails";
// import UserStats from "../components/profile/UserStats"; // Lazy loaded
// import BadgesDisplay from "../components/profile/BadgesDisplay"; // Lazy loaded
import BadgeProgressBar from "../components/profile/BadgeProgressBar";
import Leaderboard from "../components/profile/Leaderboard";
import TwoFactorAuth from "../components/profile/TwoFactorAuth";
import ChangePassword from "../components/profile/ChangePassword";
import EmailChangeForm from "../components/profile/EmailChangeForm";

const LazyUserStats = lazy(() => import("../components/profile/UserStats"));
const LazyBadgesDisplay = lazy(() =>
  import("../components/profile/BadgesDisplay")
);

dayjs.extend(relativeTime);

// Custom hook to get previous value
const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

// Data for badges (can be moved to a separate file if it grows)
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
  const {
    authUser,
    loading,
    updateProfile,
    updateDetails,
    checkingAuth,
    onlineUsers,
    logout,
    checkAuth,
    markBadgeAsSeen,
  } = useAuthStore();
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
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState(null);
  const [progressData, setProgressData] = useState({});
  const [progressLoading, setProgressLoading] = useState(true); // Security-related state

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  // Online status is now handled in ProfileHeader component

  const prevBadges = usePrevious(authUser?.badges);
  useEffect(() => {
    // Check if a new badge has been earned
    if (userStats?.badges.length > (prevBadges?.length || 0)) {
      const newlyEarned = userStats.badges.find(
        (badge) => !authUser.seenBadges.includes(badge)
      );
      if (newlyEarned) {
        setNewlyEarnedBadge(newlyEarned);
      }
    }
  }, [userStats, prevBadges, authUser?.seenBadges]);

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
    const fetchProgressData = async () => {
      try {
        const res = await axiosInstance.get("/gamification/progress");
        setProgressData(res.data);
      } catch (error) {
        console.error("Failed to fetch progress data:", error);
      } finally {
        setProgressLoading(false);
      }
    };

    if (authUser) {
      fetchProgressData();
    }
  }, [authUser]);

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

  const handleImageUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Image = reader.result;
        setSelectedImg(base64Image);
        await updateProfile({ profilePic: base64Image });
      };
    },
    [updateProfile]
  );

  const handleInputChange = useCallback((e) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [e.target.name]: e.target.value,
    }));
  }, []);

  const handleSaveDetails = useCallback(async () => {
    if (!formData.fullName) {
      toast.error("Full Name is required.");
      return;
    }
    await updateDetails({ fullName: formData.fullName, about: formData.about });
    setEditMode(false);
  }, [formData.fullName, formData.about, updateDetails]);

  const handleBadgeModalClose = useCallback(() => {
    markBadgeAsSeen(newlyEarnedBadge);
    setNewlyEarnedBadge(null);
  }, [markBadgeAsSeen, newlyEarnedBadge]);

  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>   
         {" "}
      </div>
    );
  }

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
                        {/* Profile Header */}           {" "}
            <ProfileHeader
              authUser={authUser}
              loading={loading}
              getProfilePicUrl={getProfilePicUrl}
              handleImageUpload={handleImageUpload}
              setIsModalOpen={setIsModalOpen}
              editMode={editMode}
              setEditMode={setEditMode}
              handleSaveDetails={handleSaveDetails}
            />
                        {/* Profile Details */}           {" "}
            <ProfileDetails
              authUser={authUser}
              editMode={editMode}
              formData={formData}
              handleInputChange={handleInputChange}
            />
                        <hr className="border-t border-base-content/10" />     
                 {" "}
            {/* Account Security section */}   
            <div className="space-y-4">
              {/* Email Address with Change Option */}
              <div className="space-y-1.5">
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Address
                </div>
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
                  {authUser?.email}
                </p>
                <EmailChangeForm />
              </div>
                            {/* Change Password Button */}             {" "}
              <button
                className="btn btn-ghost w-full"
                onClick={() => setShowPasswordChange(true)}
              >
                                <Lock className="w-5 h-5" /> Change Password    
                         {" "}
              </button>
                            {/* Two-Factor Auth Button */}             {" "}
              <button
                className="btn btn-ghost w-full"
                onClick={() => setShowTwoFactor(true)}
              >
                                <Shield className="w-5 h-5" /> Two-Factor
                Authentication              {" "}
              </button>
                            {/* Logout Button */}             {" "}
              <button onClick={logout} className="btn btn-error w-full">
                                <LogOut className="w-5 h-5" /> Logout          
                   {" "}
              </button>
                         {" "}
            </div>
                        <hr className="border-t border-base-content/10" />     
                  {/* Gamification Section */}           {" "}
            <div className="space-y-4">
                           {" "}
              <h2 className="text-2xl font-bold">Your Progress</h2>             {" "}
              {progressLoading ? (
                <div className="flex justify-center">
                                   {" "}
                  <span className="loading loading-spinner"></span>             
                   {" "}
                </div>
              ) : Object.keys(progressData).length > 0 ? (
                Object.keys(progressData).map((badgeName) => (
                  <BadgeProgressBar
                    key={badgeName}
                    badgeName={badgeName}
                    current={progressData[badgeName].current}
                    goal={progressData[badgeName].goal}
                  />
                ))
              ) : (
                <p className="text-center text-zinc-400">
                                    Start messaging to earn your first badge!  
                               {" "}
                </p>
              )}
                         {" "}
            </div>
                        <hr className="border-t border-base-content/10" />     
                 {" "}
            <Suspense
              fallback={
                <div className="flex justify-center">
                  <span className="loading loading-spinner"></span>
                </div>
              }
            >
              <LazyUserStats
                userStats={userStats}
                statsLoading={statsLoading}
              />
            </Suspense>
                        <hr className="border-t border-base-content/10" />     
                 {" "}
            <Suspense
              fallback={
                <div className="flex justify-center">
                  <span className="loading loading-spinner"></span>
                </div>
              }
            >
              <LazyBadgesDisplay
                userStats={userStats}
                badgeIcons={badgeIcons}
              />
            </Suspense>
                        <hr className="border-t border-base-content/10" />     
                  {/* Leaderboard */}
                        <Leaderboard />         {" "}
          </div>
                 {" "}
        </div>
             {" "}
      </div>
            {/* Modals are kept outside the main layout */}     {" "}
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
                                       {" "}
                    <button
                      onClick={() => resetTransform()}
                      className="btn btn-sm bg-base-300 text-white"
                    >
                                            Reset                    {" "}
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
              onClick={handleBadgeModalClose}
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
            {/* Change Password Modal */}     {" "}
      {showPasswordChange && (
        <ChangePassword
          isOpen={showPasswordChange}
          onClose={() => setShowPasswordChange(false)}
        />
      )}
      {/* Two-Factor Auth Modal */}
      {showTwoFactor && (
        <TwoFactorAuth
          isOpen={showTwoFactor}
          onClose={() => setShowTwoFactor(false)}
          authUser={authUser}
          checkAuth={checkAuth}
        />
      )}
    </div>
  );
};
export default ProfilePage;
