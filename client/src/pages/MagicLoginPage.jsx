import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";
import { CheckCircle, XCircle } from "lucide-react";

const MagicLoginPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login, checkAuth } = useAuthStore();
  const [status, setStatus] = useState("loggingIn"); // 'loggingIn', 'success', 'error'
  const [message, setMessage] = useState("Logging you in...");

  useEffect(() => {
    const processMagicLogin = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid magic login link.");
        return;
      }

      try {
        setStatus("loggingIn");
        setMessage("Verifying magic link...");

        // Make API call to backend magic login endpoint
        const response = await fetch(
          `https://massenger-chat.onrender.com/api/auth/magic-login/${token}`,
          {
            method: "GET",
            credentials: "include", // Include cookies
          }
        );

        if (response.ok) {
          setStatus("success");
          setMessage("Login successful! Redirecting...");

          // Check auth status and redirect
          setTimeout(async () => {
            try {
              // Trigger auth check to update the store
              await checkAuth();
              navigate("/");
            } catch (error) {
              console.error("Auth check failed:", error);
              navigate("/");
            }
          }, 1500);
        } else {
          const errorData = await response.json();
          setStatus("error");
          setMessage(
            errorData.error ||
              "Magic login failed. The link may be invalid or expired."
          );
          toast.error(errorData.error || "Magic login failed.");
          setTimeout(() => navigate("/login"), 5000);
        }
      } catch (error) {
        console.error("Magic login error:", error);
        setStatus("error");
        setMessage("Magic login failed. The link may be invalid or expired.");
        toast.error("Magic login failed.");
        setTimeout(() => navigate("/login"), 5000);
      }
    };

    processMagicLogin();
  }, [token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <div className="bg-base-200 p-8 rounded-lg shadow-xl space-y-4">
        {status === "loggingIn" && (
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size={30} />
            <h1 className="text-2xl font-bold">{message}</h1>
          </div>
        )}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="size-12 text-success" />
            <h1 className="text-2xl font-bold">Success!</h1>
            <p>{message}</p>
            <button
              onClick={() => navigate("/")}
              className="btn btn-primary mt-4"
            >
              Go to Chat
            </button>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="size-12 text-error" />
            <h1 className="text-2xl font-bold">Error</h1>
            <p>{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="btn btn-primary mt-4"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MagicLoginPage;
