import { Mail, User } from "lucide-react";

const ProfileDetails = ({
  authUser,
  editMode,
  formData,
  handleInputChange,
}) => (
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
);

export default ProfileDetails;
