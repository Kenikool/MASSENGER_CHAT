// import { Mail, User } from "lucide-react";

// const ProfileDetails = ({
//   authUser,
//   editMode,
//   formData,
//   handleInputChange,
// }) => (
//   <div className="space-y-6">
//     <div className="space-y-1.5">
//       <div className="text-sm text-zinc-400 flex items-center gap-2">
//         <User className="w-4 h-4" /> Full Name
//       </div>
//       {editMode ? (
//         <input
//           type="text"
//           name="fullName"
//           value={formData.fullName}
//           onChange={handleInputChange}
//           className="input input-bordered w-full"
//         />
//       ) : (
//         <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
//           {authUser?.fullName}
//         </p>
//       )}
//     </div>
//     <div className="space-y-1.5">
//       <div className="text-sm text-zinc-400 flex items-center gap-2">
//         <Mail className="w-4 h-4" /> Email Address
//       </div>
//       {editMode ? (
//         <input
//           type="email"
//           name="email"
//           value={formData.email}
//           onChange={handleInputChange}
//           className="input input-bordered w-full"
//         />
//       ) : (
//         <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
//           {authUser?.email}
//         </p>
//       )}
//     </div>
//     <div className="space-y-1.5">
//       <div className="text-sm text-zinc-400 flex items-center gap-2">
//         <User className="w-4 h-4" /> About Me
//       </div>
//       {editMode ? (
//         <textarea
//           name="about"
//           value={formData.about}
//           onChange={handleInputChange}
//           className="textarea textarea-bordered w-full"
//           rows="4"
//           placeholder="Tell us a little about yourself..."
//         ></textarea>
//       ) : (
//         <p className="px-4 py-2.5 bg-base-200 rounded-lg border whitespace-pre-line">
//           {authUser?.about || "No bio yet."}
//         </p>
//       )}
//     </div>
//   </div>
// );

// export default ProfileDetails;

// components/profile/ProfileDetails.jsx
import { 
  Mail, 
  User, 
  Lock, 
  X, 
  Globe, 
  Shield, 
  Palette, 
  Users, 
  MessageCircle,
  Calendar,
  MapPin,
  Phone,
  Link as LinkIcon,
  Github,
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
  Award
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useCallback, memo } from "react";

const ProfileDetails = memo(
  ({ authUser, editMode, formData, handleInputChange, handleSaveDetails }) => {
    const [showEmailChange, setShowEmailChange] = useState(false);
    const [emailForm, setEmailForm] = useState({
      newEmail: "",
      currentPassword: "",
    });
    const [allUsers, setAllUsers] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [showAllUsers, setShowAllUsers] = useState(false);

    const { authUser: storedAuthUser, setAuthUser } = useAuthStore();
    const { users, getUsers } = useChatStore();

    const [isPublic, setIsPublic] = useState(
      authUser?.isPublic != undefined ? authUser?.isPublic : true
    );
    const [publicBadges, setPublicBadges] = useState(
      authUser?.publicBadges || []
    );
    const [userStatus, setUserStatus] = useState(authUser?.status || "Online");

    // Fetch all users and stats on component mount
    useEffect(() => {
      const fetchData = async () => {
        try {
          // Fetch all users
          await getUsers();
          
          // Fetch user statistics
          setLoadingStats(true);
          const statsRes = await axiosInstance.get('/users/stats');
          setUserStats(statsRes.data);
        } catch (error) {
          console.error('Failed to fetch data:', error);
          toast.error('Failed to load user data');
        } finally {
          setLoadingStats(false);
        }
      };
      
      if (authUser) {
        fetchData();
      }
    }, [authUser, getUsers]);

    // Update allUsers when users change
    useEffect(() => {
      setAllUsers(users || []);
    }, [users]);

    const handleStatusChange = useCallback(
      async (e) => {
        const newStatus = e.target.value;
        setUserStatus(newStatus);
        try {
          const res = await axiosInstance.put("/users/profile-customization", {
            status: newStatus,
          });
          setAuthUser({ ...storedAuthUser, status: newStatus });
          toast.success(res.data.message || "User status updated.");
        } catch (error) {
          toast.error(
            error.response?.data?.error || "Failed to update user status."
          );
          setUserStatus(authUser?.status || "Online"); // Revert on error
        }
      },
      [authUser?.status, setAuthUser, storedAuthUser]
    );

    const handleTogglePublic = useCallback(async () => {
      const newIsPublic = !isPublic;
      setIsPublic(newIsPublic);
      try {
        const res = await axiosInstance.put("/users/profile-customization", {
          isPublic: newIsPublic,
        });
        setAuthUser({ ...storedAuthUser, isPublic: newIsPublic });
        toast.success(res.data.message || "Profile visibility updated.");
      } catch (error) {
        toast.error(
          error.response?.data?.error || "Failed to update profile visibility."
        );
        setIsPublic(!newIsPublic); // Revert on error
      }
    }, [isPublic, setAuthUser, storedAuthUser]);

    const handleBadgeToggle = useCallback(
      async (badge) => {
        let newPublicBadges;
        if (publicBadges.includes(badge)) {
          newPublicBadges = publicBadges.filter((b) => b !== badge);
        } else {
          newPublicBadges = [...publicBadges, badge];
        }
        setPublicBadges(newPublicBadges);
        try {
          const res = await axiosInstance.put("/users/profile-customization", {
            publicBadges: newPublicBadges,
          });
          setAuthUser({ ...storedAuthUser, publicBadges: newPublicBadges });
          toast.success(res.data.message || "Public badges updated.");
        } catch (error) {
          toast.error(
            error.response?.data?.error || "Failed to update badges."
          );
          setPublicBadges(publicBadges); // Revert on error
        }
      },
      [publicBadges, setAuthUser, storedAuthUser]
    );

    const handleEmailInputChange = useCallback((e) => {
      setEmailForm((prevEmailForm) => ({
        ...prevEmailForm,
        [e.target.name]: e.target.value,
      }));
    }, []);

    const requestEmailChange = useCallback(
      async (e) => {
        e.preventDefault();
        if (!emailForm.newEmail || !emailForm.currentPassword) {
          toast.error("Please fill in both fields.");
          return;
        }

        // Call the new API endpoint
        try {
          const res = await axiosInstance.post(
            "/auth/request-email-change",
            emailForm
          );
          toast.success(res.data.message);
          setShowEmailChange(false);
          setEmailForm({ newEmail: "", currentPassword: "" });
        } catch (error) {
          toast.error(
            error.response?.data?.error || "Failed to request email change."
          );
        }
      },
      [emailForm]
    );

    const handleThemeChange = useCallback(
      async (e) => {
        const newTheme = e.target.value;
        try {
          const res = await axiosInstance.put("/users/profile-customization", {
            profileTheme: newTheme,
          });
          setAuthUser({ ...storedAuthUser, profileTheme: newTheme });
          toast.success(res.data.message || "Profile theme updated.");
        } catch (error) {
          toast.error(error.response?.data?.error || "Failed to update theme.");
        }
      },
      [setAuthUser, storedAuthUser]
    );

    const handleSocialLinkChange = useCallback(
      async (platform, url) => {
        const newLinks = { ...authUser.socialMediaLinks, [platform]: url };
        setAuthUser({ ...storedAuthUser, socialMediaLinks: newLinks });
        try {
          await axiosInstance.put("/users/profile-customization", {
            socialMediaLinks: newLinks,
          });
        } catch (error) {
          toast.error(
            error.response?.data?.error || "Failed to update social link."
          );
          setAuthUser({
            ...storedAuthUser,
            socialMediaLinks: authUser.socialMediaLinks,
          }); // Revert on error
        }
      },
      [authUser.socialMediaLinks, setAuthUser, storedAuthUser]
    );

    const handleRemoveSocialLink = useCallback(
      async (platform) => {
        const newLinks = { ...authUser.socialMediaLinks };
        delete newLinks[platform];
        try {
          const res = await axiosInstance.put("/users/profile-customization", {
            socialMediaLinks: newLinks,
          });
          setAuthUser({ ...storedAuthUser, socialMediaLinks: newLinks });
          toast.success(res.data.message || "Social link removed.");
        } catch (error) {
          toast.error(error.response?.data?.error || "Failed to remove link.");
          setAuthUser({
            ...storedAuthUser,
            socialMediaLinks: authUser.socialMediaLinks,
          }); // Revert on error
        }
      },
      [authUser.socialMediaLinks, setAuthUser, storedAuthUser]
    );

    const handleAddSocialLink = useCallback(
      async (platform, url) => {
        const newLinks = {
          ...authUser.socialMediaLinks,
          [platform.toLowerCase()]: url,
        };
        try {
          const res = await axiosInstance.put("/users/profile-customization", {
            socialMediaLinks: newLinks,
          });
          setAuthUser({ ...storedAuthUser, socialMediaLinks: newLinks });
          toast.success(res.data.message || "Social link added.");
        } catch (error) {
          toast.error(error.response?.data?.error || "Failed to add link.");
          setAuthUser({
            ...storedAuthUser,
            socialMediaLinks: authUser.socialMediaLinks,
          }); // Revert on error
        }
      },
      [authUser.socialMediaLinks, setAuthUser, storedAuthUser]
    );

    return (
      <div className="space-y-6">
        {/* User ID & Account Information */}
        <div className="space-y-4 p-4 bg-base-200/30 rounded-lg border border-base-300/50">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">User ID</div>
              <p className="px-3 py-2 bg-base-200 rounded-lg border text-xs font-mono">
                {authUser?._id}
              </p>
            </div>
            
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Account Created</div>
              <p className="px-3 py-2 bg-base-200 rounded-lg border">
                {authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </p>
            </div>
            
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Last Updated</div>
              <p className="px-3 py-2 bg-base-200 rounded-lg border">
                {authUser?.updatedAt ? new Date(authUser.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </p>
            </div>
            
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Account Age</div>
              <p className="px-3 py-2 bg-base-200 rounded-lg border">
                {authUser?.accountAgeDays ? `${authUser.accountAgeDays} days` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Basic Profile Information */}
        <div className="space-y-4 p-4 bg-base-200/30 rounded-lg border border-base-300/50">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </h3>
          
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
            <div className="flex items-center gap-2">
              <p className="flex-1 px-4 py-2.5 bg-base-200 rounded-lg border">
                {authUser?.email}
              </p>
              {authUser?.isVerified && (
                <div className="badge badge-success badge-sm">Verified</div>
              )}
            </div>
            <button
              className="btn btn-sm btn-outline btn-block mt-2"
              onClick={() => setShowEmailChange(!showEmailChange)}
            >
              {showEmailChange ? "Cancel" : "Change Email Address"}
            </button>
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

        {showEmailChange && (
          <form
            onSubmit={requestEmailChange}
            className="space-y-4 p-4 bg-base-100 rounded-lg"
          >
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <Mail size={16} /> New Email
                </span>
              </label>
              <input
                type="email"
                name="newEmail"
                value={emailForm.newEmail}
                onChange={handleEmailInputChange}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <Lock size={16} /> Current Password
                </span>
              </label>
              <input
                type="password"
                name="currentPassword"
                value={emailForm.currentPassword}
                onChange={handleEmailInputChange}
                className="input input-bordered w-full"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Send Verification Link
            </button>
          </form>
        )}

        {/* Security & Authentication Status */}
        <div className="space-y-4 p-4 bg-base-200/30 rounded-lg border border-base-300/50">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security & Authentication
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Email Verification</div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  authUser?.isVerified ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={authUser?.isVerified ? 'text-green-600' : 'text-red-600'}>
                  {authUser?.isVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Two-Factor Authentication</div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  authUser?.isTwoFactorEnabled ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className={authUser?.isTwoFactorEnabled ? 'text-green-600' : 'text-gray-600'}>
                  {authUser?.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Active Sessions</div>
              <p className="px-3 py-2 bg-base-200 rounded-lg border">
                {authUser?.sessions?.length || 0} session(s)
              </p>
            </div>
            
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Last Seen</div>
              <p className="px-3 py-2 bg-base-200 rounded-lg border">
                {authUser?.lastSeen ? new Date(authUser.lastSeen).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Online Status & Preferences */}
        <div className="space-y-4 p-4 bg-base-200/30 rounded-lg border border-base-300/50">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Status & Preferences
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Online Status</div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  authUser?.isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span>{authUser?.isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">User Status</div>
              <p className="px-3 py-2 bg-base-200 rounded-lg border">
                {authUser?.status || 'Online'}
              </p>
            </div>
            
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Profile Visibility</div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  authUser?.isPublic ? 'bg-blue-500' : 'bg-gray-400'
                }`}></div>
                <span>{authUser?.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Profile Theme</div>
              <p className="px-3 py-2 bg-base-200 rounded-lg border capitalize">
                {authUser?.profileTheme || 'Default'}
              </p>
            </div>
          </div>
        </div>

        {/* Badges & Achievements */}
        <div className="space-y-4 p-4 bg-base-200/30 rounded-lg border border-base-300/50">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Award className="w-5 h-5" />
            Badges & Achievements
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Total Badges</div>
              <p className="px-3 py-2 bg-base-200 rounded-lg border">
                {authUser?.badges?.length || 0} badges earned
              </p>
            </div>
            
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400">Public Badges</div>
              <p className="px-3 py-2 bg-base-200 rounded-lg border">
                {authUser?.publicBadges?.length || 0} badges visible
              </p>
            </div>
          </div>
          
          {authUser?.badges && authUser.badges.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-zinc-400">Earned Badges</div>
              <div className="flex flex-wrap gap-2">
                {authUser.badges.map((badge, index) => (
                  <div key={index} className="badge badge-primary badge-lg">
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Social Media Links */}
        {authUser?.socialMediaLinks && Object.keys(authUser.socialMediaLinks).length > 0 && (
          <div className="space-y-4 p-4 bg-base-200/30 rounded-lg border border-base-300/50">
            <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Social Media Links
            </h3>
            
            <div className="space-y-2">
              {Object.entries(authUser.socialMediaLinks).map(([platform, url]) => (
                <div key={platform} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    {platform.toLowerCase() === 'github' && <Github className="w-4 h-4" />}
                    {platform.toLowerCase() === 'twitter' && <Twitter className="w-4 h-4" />}
                    {platform.toLowerCase() === 'instagram' && <Instagram className="w-4 h-4" />}
                    {platform.toLowerCase() === 'linkedin' && <Linkedin className="w-4 h-4" />}
                    {platform.toLowerCase() === 'facebook' && <Facebook className="w-4 h-4" />}
                    {!['github', 'twitter', 'instagram', 'linkedin', 'facebook'].includes(platform.toLowerCase()) && <LinkIcon className="w-4 h-4" />}
                    <span className="font-medium capitalize">{platform}</span>
                  </div>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-focus text-sm truncate flex-1"
                  >
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Mode Controls */}
        {editMode && (
          <div className="space-y-4">
            {/* User Status Selector */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">My Status</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={userStatus}
                onChange={handleStatusChange}
              >
                <option value="Online">Online</option>
                <option value="Away">Away</option>
                <option value="Busy">Busy</option>
                <option value="Offline">Offline</option>
              </select>
            </div>

            {/* Public Profile Toggle */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={isPublic}
                  onChange={handleTogglePublic}
                />
                <span className="label-text">Make Profile Public</span>
              </label>
              <p className="text-xs text-zinc-500 mt-1">
                Allow other users to view your profile picture, bio, and
                selected badges.
              </p>
            </div>

            {/* Public Badges Selection (only if profile is public) */}
            {isPublic && authUser?.badges && authUser.badges.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Select Public Badges:</p>
                <div className="flex flex-wrap gap-2">
                  {authUser.badges.map((badge) => (
                    <button
                      key={badge}
                      type="button"
                      className={`btn btn-sm ${
                        publicBadges.includes(badge)
                          ? "btn-primary"
                          : "btn-outline"
                      }`}
                      onClick={() => handleBadgeToggle(badge)}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Badges selected here will be visible on your public profile.
                </p>
              </div>
            )}

            {/* Profile Theme Selector */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Profile Theme</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={authUser?.profileTheme || "default"}
                onChange={handleThemeChange}
              >
                <option value="default">Default</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="cupcake">Cupcake</option>
                <option value="retro">Retro</option>
                <option value="cyberpunk">Cyberpunk</option>
                <option value="valentine">Valentine</option>
              </select>
            </div>

            {/* Social Media Links */}
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">Social Media Links:</p>
              {Object.entries(authUser?.socialMediaLinks || {}).map(
                ([platform, url]) => (
                  <div key={platform} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={url}
                      onChange={(e) =>
                        handleSocialLinkChange(platform, e.target.value)
                      }
                      placeholder={`Enter ${platform} URL`}
                    />
                    <button
                      className="btn btn-error btn-square btn-sm"
                      onClick={() => handleRemoveSocialLink(platform)}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )
              )}

              <button
                className="btn btn-outline btn-primary btn-sm"
                onClick={async () => {
                  const platform = prompt(
                    "Enter social media platform (e.g., twitter, github):"
                  );
                  if (platform) {
                    const url = prompt("Enter URL:");
                    if (url) {
                      handleAddSocialLink(platform, url);
                    }
                  }
                }}
              >
                Add Social Link
              </button>
            </div>

            {/* If not in email change flow, show general save button */}
            {!showEmailChange && (
              <button
                onClick={handleSaveDetails}
                className="btn btn-success w-full mt-4"
              >
                Save Profile Details
              </button>
            )}
          </div>
        )}

        {/* User Statistics Section */}
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">My Statistics</h3>
          </div>
          
          {loadingStats ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : userStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title text-xs">Messages Sent</div>
                <div className="stat-value text-2xl text-primary">{userStats.messageCount || 0}</div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title text-xs">Files Shared</div>
                <div className="stat-value text-2xl text-secondary">{userStats.fileCount || 0}</div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title text-xs">Badges Earned</div>
                <div className="stat-value text-2xl text-accent">{authUser?.badges?.length || 0}</div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-title text-xs">Account Age</div>
                <div className="stat-value text-2xl text-info">{authUser?.accountAgeDays || 0}d</div>
              </div>
            </div>
          ) : (
            <p className="text-base-content/60">No statistics available</p>
          )}
        </div>

        {/* All Users Section */}
        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Community ({allUsers.length} users)</h3>
            </div>
            <button
              onClick={() => setShowAllUsers(!showAllUsers)}
              className="btn btn-sm btn-outline"
            >
              {showAllUsers ? 'Hide' : 'Show'} All Users
            </button>
          </div>
          
          {showAllUsers && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allUsers.length > 0 ? (
                allUsers.map((user) => (
                  <div key={user._id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        <img 
                          src={user.profilePic || '/avatar.png'} 
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.fullName}</p>
                      <p className="text-sm text-base-content/60 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.badges && user.badges.length > 0 && (
                        <div className="badge badge-primary badge-sm">
                          {user.badges.length} badges
                        </div>
                      )}
                      <div className={`w-3 h-3 rounded-full ${
                        user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} title={user.isOnline ? 'Online' : 'Offline'}></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-base-content/60 py-4">No users found</p>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => toast.info('Export feature coming soon!')}
            >
              <Calendar className="w-4 h-4" />
              Export Data
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => toast.info('Backup feature coming soon!')}
            >
              <Shield className="w-4 h-4" />
              Backup Chat
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => window.open('/settings', '_blank')}
            >
              <Palette className="w-4 h-4" />
              App Settings
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => toast.info('Help center coming soon!')}
            >
              <LinkIcon className="w-4 h-4" />
              Help Center
            </button>
          </div>
        </div>

        {/* Privacy & Security Info */}
        <div className="space-y-2 mt-8 p-4 bg-base-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-success" />
            <span className="text-sm font-medium">Privacy & Security</span>
          </div>
          <ul className="text-xs text-base-content/70 space-y-1 ml-6">
            <li>• Your messages are encrypted in transit</li>
            <li>• Profile visibility can be controlled above</li>
            <li>• You can delete your account anytime in settings</li>
            <li>• We don't share your data with third parties</li>
          </ul>
        </div>
      </div>
    );
  }
);

export default ProfileDetails;
