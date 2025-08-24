// pages/EmailVerificationPage.jsx
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import axiosInstance from "../lib/axios";

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        const res = await axiosInstance.get(
          `/auth/verify-account?token=${token}`
        );
        setStatus("success");
        setMessage(
          res.data.message ||
            "Email verified successfully! Redirecting you now..."
        );
        // The backend redirects the user, but you can add a manual client-side redirect as a fallback
        // setTimeout(() => {
        //     window.location.href = '/chat';
        // }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.error ||
            "Failed to verify email. The link may have expired."
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <div className="bg-base-200 p-8 rounded-lg shadow-xl space-y-4">
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-12 animate-spin text-primary" />
            <h1 className="text-2xl font-bold">{message}</h1>
          </div>
        )}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="size-12 text-success" />
            <h1 className="text-2xl font-bold">Success!</h1>
            <p>{message}</p>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="size-12 text-error" />
            <h1 className="text-2xl font-bold">Error</h1>
            <p>{message}</p>
            <Link to="/login" className="btn btn-primary mt-4">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;
