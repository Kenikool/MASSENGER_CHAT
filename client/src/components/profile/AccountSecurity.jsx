import { useState, useEffect } from "react";
import { Lock, KeyRound } from "lucide-react";
import axiosInstance from "../../lib/axios";
import { toast } from "react-hot-toast";

const AccountSecurity = ({ authUser, checkAuth }) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorQRCode, setTwoFactorQRCode] = useState("");
  const [is2faLoading, setIs2faLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    authUser?.isTwoFactorEnabled
  );

  // Sync internal state with the authUser prop
  useEffect(() => {
    setTwoFactorEnabled(authUser?.isTwoFactorEnabled);
  }, [authUser]);

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
      // Re-fetch user data from the store to ensure it's up-to-date
      await checkAuth();
    } catch (error) {
      toast.error(error.response?.data?.error || "Invalid code");
    } finally {
      setIs2faLoading(false);
    }
  };

  return (
    <>
      <div className="mt-6 bg-base-300 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={20} />
          <h2 className="text-lg font-medium">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Current Password</span>
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordInputChange}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">New Password</span>
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordInputChange}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Confirm New Password</span>
            </label>
            <input
              type="password"
              name="confirmNewPassword"
              value={passwordForm.confirmNewPassword}
              onChange={handlePasswordInputChange}
              className="input input-bordered w-full"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isPasswordLoading}
          >
            {isPasswordLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Change Password"
            )}
          </button>
        </form>
      </div>
      <hr className="border-t border-base-content/10" />
      <div className="mt-6 bg-base-300 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={20} />
          <h2 className="text-lg font-medium">Two-Factor Authentication</h2>
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
                  1. Scan this QR code with your authenticator app (e.g., Google
                  Authenticator).
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
    </>
  );
};

export default AccountSecurity;
