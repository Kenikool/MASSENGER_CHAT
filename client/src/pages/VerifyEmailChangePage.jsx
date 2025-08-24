// src/pages/VerifyEmailChangePage.jsx

import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../lib/axios";
import { toast } from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

const VerifyEmailChangePage = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("verifying"); // verifying, success, error

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setStatus("error");
        setLoading(false);
        toast.error("Invalid verification link.");
        return;
      }

      try {
        const res = await axiosInstance.post("/auth/verify-email-change", {
          token,
        });
        toast.success(res.data.message);
        setStatus("success");
      } catch (error) {
        console.error("Email change verification failed:", error);
        toast.error(
          error.response?.data?.error || "Failed to verify email change."
        );
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <div className="bg-base-300 rounded-xl p-8 max-w-lg w-full text-center space-y-4 shadow-xl">
        {loading && (
          <>
            <LoadingSpinner size={30} />
            <h2 className="text-xl font-bold">Verifying your new email...</h2>
            <p className="text-sm text-zinc-400">
              Please wait, this may take a moment.
            </p>
          </>
        )}
        {!loading && status === "success" && (
          <>
            <CheckCircle size={48} className="text-success mx-auto" />
            <h2 className="text-2xl font-bold text-success">Success!</h2>
            <p>Your email address has been successfully updated.</p>
            <p className="text-sm text-zinc-400">
              You can now go back to your profile page.
            </p>
          </>
        )}
        {!loading && status === "error" && (
          <>
            <XCircle size={48} className="text-error mx-auto" />
            <h2 className="text-2xl font-bold text-error">
              Verification Failed
            </h2>
            <p>The verification link is invalid or has expired.</p>
            <p className="text-sm text-zinc-400">
              Please try requesting a new email change from your profile
              settings.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailChangePage;
