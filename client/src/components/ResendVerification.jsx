import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";

const ResendVerification = ({ email }) => {
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post("/auth/resend-verification", {
        email,
      });
      toast.success(response.data.message);
    } catch (error) {
      console.error("Resend failed:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to resend email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Mail className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Email Not Verified</h2>
      <p className="text-base-content/60 mb-4">
        Your email address has not been verified. Please check your inbox for
        the verification link.
      </p>
      <button
        onClick={handleResend}
        className="btn btn-primary btn-sm"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Resend Verification Email"
        )}
      </button>
      <p className="text-sm mt-2 text-base-content/50">
        Didn't receive the email? Check your spam folder.
      </p>
    </div>
  );
};

export default ResendVerification;
