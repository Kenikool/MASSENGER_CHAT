import { useState, useEffect } from "react";
import { QrCode, Lock, X, Shield } from "lucide-react";
import { toast } from "react-hot-toast";
import axiosInstance from "../../lib/axios";

const TwoFactorAuth = ({ isOpen, onClose, authUser, checkAuth }) => {
  const [secret, setSecret] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authUser?.isTwoFactorEnabled && isOpen) {
      setupTwoFactor();
    }
  }, [isOpen, authUser]);

  const setupTwoFactor = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/setup-two-factor");
      setSecret(res.data.secret);
      setQrCode(res.data.qrCode);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to set up 2FA.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/verify-two-factor", {
        token,
      });
      toast.success(res.data.message);
      await checkAuth(); // Re-fetch user data to update the state
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Invalid token. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disable two-factor authentication?"
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/disable-two-factor");
      toast.success(res.data.message);
      await checkAuth(); // Re-fetch user data
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to disable 2FA.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-base-100 rounded-lg p-6 max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 btn btn-sm btn-circle btn-ghost"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield size={20} /> Two-Factor Authentication
        </h2>

        {authUser?.isTwoFactorEnabled ? (
          <div className="space-y-4 text-center">
            <p className="text-success text-lg">
              2FA is currently **enabled**.
            </p>
            <p className="text-sm">
              You are logged in with 2FA enabled. For future logins, you will
              need to enter a code from your authenticator app.
            </p>
            <button
              onClick={handleDisable}
              className="btn btn-error w-full mt-4"
              disabled={loading}
            >
              {loading ? "Disabling..." : "Disable 2FA"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p>
              To enable 2FA, scan the QR code below with your preferred
              authenticator app (e.g., Google Authenticator, Authy).
            </p>

            {loading && (
              <div className="text-center">
                <span className="loading loading-spinner"></span>
                <p>Generating QR Code...</p>
              </div>
            )}

            {!loading && qrCode && (
              <>
                <div className="flex justify-center my-4">
                  <img
                    src={qrCode}
                    alt="QR Code for 2FA"
                    className="w-48 h-48"
                  />
                </div>
                <div className="text-center text-sm text-base-content/70">
                  Can't scan the code? Use this key: **{secret}**
                </div>
              </>
            )}

            <form onSubmit={handleVerify} className="mt-4">
              <label className="label">
                <span className="label-text">
                  Enter the 6-digit code from your app:
                </span>
              </label>
              <div className="relative">
                <QrCode
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                />
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="••••••"
                  className="input input-bordered w-full pl-10"
                  maxLength="6"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full mt-4"
                disabled={!qrCode || loading}
              >
                {loading ? "Verifying..." : "Enable 2FA"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuth;
