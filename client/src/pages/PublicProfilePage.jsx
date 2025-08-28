import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { 
  XCircle, 
  User as UserIcon, 
  Settings, 
  Calendar,
  Award,
  MessageCircle,
  ArrowLeft,
  Shield,
  Globe,
  Link as LinkIcon,
  Github,
  Twitter,
  Instagram,
  Linkedin,
  Facebook
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const PublicProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { setSelectedUser } = useChatStore();
  const [profile, setProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/users/profile/${userId}`);
        setProfile(res.data);
        
        // Fetch public stats if available
        if (res.data.isPublic) {
          setStatsLoading(true);
          try {
            const statsRes = await axiosInstance.get(`/users/public-stats/${userId}`);
            setUserStats(statsRes.data);
          } catch (statsErr) {
            console.log('Public stats not available');
          } finally {
            setStatsLoading(false);
          }
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [userId]);
  
  const handleStartChat = () => {
    if (profile && authUser) {
      setSelectedUser(profile);
      navigate('/');
    }
  };
  
  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <LoadingSpinner size={30} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center p-4">
        <XCircle className="size-12 text-error mb-4" />
        <h2 className="text-2xl font-bold">Error</h2>
        <p className="text-base-content/70">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center p-4">
        <UserIcon className="size-12 text-base-content/40 mb-4" />
        <h2 className="text-2xl font-bold">Profile Not Found</h2>
        <p className="text-base-content/70">
          The user profile could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Back Button */}
      <div className="mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="btn btn-ghost gap-2"
        >
          <ArrowLeft size={20} />
          Back
        </button>
      </div>
      
      <div className="bg-base-200 rounded-xl shadow-xl p-6 lg:p-8 space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          <div className="avatar mb-4">
            <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img
                src={profile.profilePic || "/avatar.png"}
                alt={profile.fullName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold">{profile.fullName}</h1>
          
          {profile.status && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <p className="text-primary text-sm font-medium">
                {profile.status}
              </p>
            </div>
          )}
          
          {profile.about && (
            <p className="text-base-content/70 mt-3 max-w-prose text-lg">
              {profile.about}
            </p>
          )}
          
          {/* Action Buttons */}
          {authUser && authUser._id !== userId && (
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleStartChat}
                className="btn btn-primary gap-2"
              >
                <MessageCircle size={18} />
                Start Chat
              </button>
            </div>
          )}
        </div>
        
        {/* Profile Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Basic Info */}
          <div className="space-y-4 p-4 bg-base-100 rounded-lg">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              Profile Information
            </h3>
            
            <div className="space-y-3">
              {profile.createdAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-base-content/60" />
                  <div>
                    <p className="text-sm text-base-content/60">Joined</p>
                    <p className="font-medium">{formatJoinDate(profile.createdAt)}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-base-content/60" />
                <div>
                  <p className="text-sm text-base-content/60">Profile Visibility</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      profile.isPublic ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <p className="font-medium">{profile.isPublic ? 'Public' : 'Private'}</p>
                  </div>
                </div>
              </div>
              
              {profile.profileTheme && profile.profileTheme !== 'default' && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-base-content/60" />
                  <div>
                    <p className="text-sm text-base-content/60">Theme</p>
                    <p className="font-medium capitalize">{profile.profileTheme}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Statistics */}
          {userStats && (
            <div className="space-y-4 p-4 bg-base-100 rounded-lg">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Public Statistics
              </h3>
              
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size={20} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-base-200 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{userStats.messageCount || 0}</p>
                    <p className="text-sm text-base-content/60">Messages</p>
                  </div>
                  <div className="text-center p-3 bg-base-200 rounded-lg">
                    <p className="text-2xl font-bold text-secondary">{userStats.badgeCount || 0}</p>
                    <p className="text-sm text-base-content/60">Badges</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>



        {/* Social Media Links */}
        {profile.socialMediaLinks &&
          Object.keys(profile.socialMediaLinks).length > 0 && (
            <div className="border-t border-base-content/10 pt-6 mt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                Social Media
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(profile.socialMediaLinks).map(
                  ([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-base-100 hover:bg-base-300 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {platform.toLowerCase() === 'github' && <Github className="w-5 h-5 text-gray-800" />}
                        {platform.toLowerCase() === 'twitter' && <Twitter className="w-5 h-5 text-blue-500" />}
                        {platform.toLowerCase() === 'instagram' && <Instagram className="w-5 h-5 text-pink-500" />}
                        {platform.toLowerCase() === 'linkedin' && <Linkedin className="w-5 h-5 text-blue-600" />}
                        {platform.toLowerCase() === 'facebook' && <Facebook className="w-5 h-5 text-blue-700" />}
                        {!['github', 'twitter', 'instagram', 'linkedin', 'facebook'].includes(platform.toLowerCase()) && <LinkIcon className="w-5 h-5" />}
                        <span className="font-medium capitalize">{platform}</span>
                      </div>
                    </a>
                  )
                )}
              </div>
            </div>
          )}

        {/* Public Badges */}
        {profile.publicBadges && profile.publicBadges.length > 0 && (
          <div className="border-t border-base-content/10 pt-6 mt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Achievements ({profile.publicBadges.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {profile.publicBadges.map((badge, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-base-100 rounded-lg border border-success/30">
                  <Award className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Profile Link for Own Profile */}
        {authUser && authUser._id === userId && (
          <div className="text-center mt-8 border-t border-base-content/10 pt-6">
            <button 
              onClick={() => navigate('/profile')}
              className="btn btn-outline btn-primary gap-2"
            >
              <Settings className="w-5 h-5" /> 
              Edit Your Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfilePage;
