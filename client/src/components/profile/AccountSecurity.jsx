// src/components/profile/AccountSecurity.jsx

import { useState } from "react";
import { Lock, Shield, LogOut, Mail } from "lucide-react";
import TwoFactorAuth from "./TwoFactorAuth"; // Your component
import ChangePassword from "./ChangePassword"; // Your component
import EmailChangeForm from "./EmailChangeForm";
import { useAuthStore } from "../../store/useAuthStore";

const AccountSecurity = ({ authUser }) => {
  const { logout, checkAuth } = useAuthStore();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  return (
    <div className="space-y-4">
      {/* Email Address */}
      <div className="space-y-1.5">
        <div className="text-sm text-zinc-400 flex items-center gap-2">
          <Mail className="w-4 h-4" /> Email Address
        </div>
        <p className="px-4 py-2.5 bg-base-200 rounded-lg border">
          {authUser?.email}
        </p>
        <EmailChangeForm />
      </div>

      {/* Change Password Button */}
      <button
        className="btn btn-ghost w-full"
        onClick={() => setShowPasswordChange(true)}
      >
        <Lock className="w-5 h-5" /> Change Password
      </button>

      {/* Two-Factor Auth Button */}
      <button
        className="btn btn-ghost w-full"
        onClick={() => setShowTwoFactor(true)}
      >
        <Shield className="w-5 h-5" /> Two-Factor Authentication
      </button>

      {/* Logout Button */}
      <button onClick={logout} className="btn btn-error w-full">
        <LogOut className="w-5 h-5" /> Logout
      </button>

      {/* Change Password Modal (Your Component) */}
      {showPasswordChange && (
        <ChangePassword
          isOpen={showPasswordChange}
          onClose={() => setShowPasswordChange(false)}
        />
      )}

      {/* Two-Factor Auth Modal (Your Component) */}
      {showTwoFactor && (
        <TwoFactorAuth
          isOpen={showTwoFactor}
          onClose={() => setShowTwoFactor(false)}
          authUser={authUser}
          checkAuth={checkAuth}
        />
      )}
    </div>
  );
};

export default AccountSecurity;
