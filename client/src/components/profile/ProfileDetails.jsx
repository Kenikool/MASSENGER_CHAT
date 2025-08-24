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
import { Mail, User, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

const ProfileDetails = ({
  authUser,
  editMode,
  formData,
  handleInputChange,
  handleSaveDetails,
}) => {
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });

  const handleEmailInputChange = (e) => {
    setEmailForm({
      ...emailForm,
      [e.target.name]: e.target.value,
    });
  };

  const requestEmailChange = async (e) => {
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
  };

  return (
    <div className="space-y-6">
      {/* Existing Full Name & About Me sections */}
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
        <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
          {authUser?.email}
        </p>
        <button
          className="btn btn-sm btn-outline btn-block mt-2"
          onClick={() => setShowEmailChange(!showEmailChange)}
        >
          {showEmailChange ? "Cancel" : "Change Email Address"}
        </button>
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

      {/* If not in email change flow, show general save button */}
      {editMode && !showEmailChange && (
        <button
          onClick={handleSaveDetails}
          className="btn btn-success w-full mt-4"
        >
          Save Profile Details
        </button>
      )}
    </div>
  );
};

export default ProfileDetails;
