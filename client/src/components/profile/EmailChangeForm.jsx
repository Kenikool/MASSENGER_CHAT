// src/components/profile/EmailChangeForm.jsx

import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "react-hot-toast";

const EmailChangeForm = () => {
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    currentPassword: "",
  });

  // Use the requestEmailChange function and loading state from the auth store
  const { requestEmailChange, loading } = useAuthStore();

  const handleEmailInputChange = (e) => {
    setEmailForm({
      ...emailForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailForm.newEmail || !emailForm.currentPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    // Call the centralized function from the store
    try {
      await requestEmailChange(emailForm);
      setShowEmailChange(false);
      setEmailForm({ newEmail: "", currentPassword: "" });
    } catch (error) {
      // The error is already handled by the store, but you can add
      // additional client-side logic here if needed.
      console.error("Email change request failed:", error);
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        className="btn btn-sm btn-outline btn-block mt-2"
        onClick={() => setShowEmailChange(!showEmailChange)}
      >
        {showEmailChange ? "Cancel" : "Change Email Address"}
      </button>
      {showEmailChange && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 p-4 bg-base-100 rounded-lg"
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
          <div className="form-control mt-2">
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
          <button
            type="submit"
            className="btn btn-primary w-full mt-4"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Verification Link"}
          </button>
        </form>
      )}
    </div>
  );
};

export default EmailChangeForm;
