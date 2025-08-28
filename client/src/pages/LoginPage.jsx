// src/pages/LoginPage.jsx

import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import ResendVerification from "../components/ResendVerification"; // ✅ Import the new component
import { toast } from "react-hot-toast";
import axiosInstance from "../lib/axios";
import LoadingSpinner from "../components/LoadingSpinner";
const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    token: "",
  });
  const [magicLoading, setMagicLoading] = useState(false);
  const { login, loading, needsTwoFactor } = useAuthStore();
  const navigate = useNavigate();

  // ✅ Add a new state to store the login error
  const [loginError, setLoginError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData);
      // If login is successful, clear any previous error and navigate
      setLoginError(null);
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      // ✅ Capture the specific error message from the backend
      setLoginError(error.response?.data?.message);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData);
      setLoginError(null);
      navigate("/");
    } catch (error) {
      console.error("2FA login failed:", error);
      setLoginError(error.response?.data?.message);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Conditional rendering logic
  const isEmailUnverified =
    loginError === "Please verify your email address before logging in.";

  const handleRequestMagicLink = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address.");
      return;
    }
    setMagicLoading(true);
    try {
      const res = await axiosInstance.post("/auth/request-magic-link", {
        email: formData.email,
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send magic link.");
    } finally {
      setMagicLoading(false);
    }
  };

  return (
    <div className="h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Welcome Back</h1>
              <p className="text-base-content/60">Sign in to your account</p>
            </div>
          </div>

          {/* ✅ Conditionally render based on the error message */}
          {isEmailUnverified ? (
            <ResendVerification email={formData.email} />
          ) : (
            <form
              onSubmit={needsTwoFactor ? handleTwoFactorSubmit : handleSubmit}
              className="space-y-6"
            >
              {!needsTwoFactor && (
                <>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Email</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-base-content/40" />
                      </div>
                      <input
                        type="email"
                        className={`input input-bordered w-full pl-10`}
                        placeholder="you@example.com"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Password</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-base-content/40" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`input input-bordered w-full pl-10`}
                        placeholder="••••••••"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-base-content/40" />
                        ) : (
                          <Eye className="h-5 w-5 text-base-content/40" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestMagicLink}
                    className="btn btn-outline btn-sm w-full"
                    disabled={magicLoading}
                  >
                    {magicLoading ? (
                      <LoadingSpinner />
                    ) : (
                      "Login with Magic Link"
                    )}
                  </button>
                </>
              )}
              {needsTwoFactor && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Two-Factor Code
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-base-content/40" />
                    </div>
                    <input
                      type="text"
                      className={`input input-bordered w-full pl-10`}
                      placeholder="6-digit code"
                      name="token"
                      value={formData.token}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
              {/* ✅ Display a general error message if needed */}
              {loginError && !isEmailUnverified && (
                <div className="text-center text-error">{loginError}</div>
              )}
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          )}

          <div className="text-center">
            <p className="text-base-content/60">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="link link-primary">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
      <AuthImagePattern
        title={"Welcome back!"}
        subtitle={
          "Sign in to continue your conversations and catch up with your messages."
        }
      />
    </div>
  );
};

export default LoginPage;
