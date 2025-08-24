import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import Navbar from "./components/Navbar";
import AuthImagePattern from "./components/AuthImagePattern";
import { Toaster } from "react-hot-toast";
import NotFound from "./components/NotFound";
import { useAuthStore } from "./store/useAuthStore";
import LoadingSpinner from "./components/LoadingSpinner";
import { useThemeStore } from "./store/useThemeStore";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import VerifyEmailChangePage from "./pages/VerifyEmailChangePage";
const App = () => {
  const { checkingAuth, checkAuth, authUser } = useAuthStore();

  const { theme } = useThemeStore();
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log("AuthUser", authUser);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex justify-center items-center mx-auto">
        <LoadingSpinner size={30} />
      </div>
    );
  }
  return (
    <div data-theme={theme} className="bg-base-100 min-h-screen">
      <Navbar />
      <div className="pt-16">
        <Routes>
          <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/signup"
            element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
          />
          <Route
            path="/profile"
            element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/settings"
            element={authUser ? <SettingsPage /> : <Navigate to="/login" />}
          />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route
            path="/verify-email-change"
            element={<VerifyEmailChangePage />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </div>
  );
};

export default App;
