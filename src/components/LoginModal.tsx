import React, { useState, useEffect } from "react";
import { Lock, UserCheck, AlertCircle, CheckCircle } from "lucide-react";
import bcrypt from "bcryptjs";
import type { Employee, Translations, RoleId } from "../types";
import { getAuth, signInWithCustomToken } from "firebase/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: RoleId | null;
  team: Employee[];
  onLoginSuccess: (role: RoleId, name: string, userId: number) => void;
  onTeamUpdate: (updater: (prev: Employee[]) => Employee[]) => void;
  t: Translations;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  team,
  onLoginSuccess,
  onTeamUpdate,
  t,
}) => {
  const [password, setPassword] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isChangeMode, setIsChangeMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setSelectedUser("");
      setError("");
      setSuccessMsg("");
      setIsChangeMode(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, targetRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (targetRole === "manager" || targetRole === "admin") {
      try {
        // Validate inputs before sending
        if (!password || password.length < 1 || password.length > 500) {
          setError("Invalid password format");
          return;
        }

        const cloudFunctionUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;
        if (!cloudFunctionUrl) {
          setError("Server configuration error. Contact administrator.");
          return;
        }

        const res = await fetch(cloudFunctionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "cors",
          body: JSON.stringify({ role: targetRole, password }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          if (res.status === 429) {
            setError("Too many login attempts. Try again later.");
          } else if (res.status === 401) {
            setError(t.invalidPass);
          } else {
            setError(errorData.error || t.invalidPass);
          }
          return;
        }

        const data = await res.json();
        const token = data?.token;

        if (!token || typeof token !== "string") {
          setError("Invalid server response");
          return;
        }

        const auth = getAuth();
        // Ensure we are not still on an anonymous session before custom token login
        try {
          await auth.signOut();
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn("[Login] signOut before custom token failed", e);
          }
        }

        await signInWithCustomToken(auth, token);
        const name = targetRole === "admin" ? "Admin" : "Diretor";
        onLoginSuccess(targetRole, name, 0);
        onClose();
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.error("Login error:", err);
        }
        setError(
          err?.code === "auth/invalid-custom-token"
            ? "Session expired. Try again."
            : t.invalidPass
        );
      }
    } else if (targetRole === "editor") {
      if (!selectedUser) {
        setError(t.selectUser);
        return;
      }
      const user = team.find((u) => u.id === +selectedUser);
      if (!user) return;

      const userPass = user.password || "1234";

      // Check if password is hashed (bcrypt hashes start with $2a$ or $2b$)
      const isHashed = userPass.startsWith("$2");
      let passwordMatches = false;

      if (isHashed) {
        // Compare with hashed password
        passwordMatches = await bcrypt.compare(password, userPass);
      } else {
        // Plain text comparison (for legacy passwords)
        passwordMatches = password === userPass;
      }

      if (passwordMatches) {
        // Check if password change is required
        if (
          user.requirePasswordChange ||
          !user.password ||
          user.password === "1234"
        ) {
          setIsChangeMode(true);
          setError("");
          setSuccessMsg("");
          return;
        }
        onLoginSuccess("editor", user.name, user.id);
        onClose();
      } else {
        setError(t.invalidPass);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError(t.selectUser);
      return;
    }
    const user = team.find((u) => u.id === +selectedUser);
    if (!user) return;

    const currentStoredPass = user.password || "1234";

    // Verify current password (handle both hashed and plain text)
    const isHashed = currentStoredPass.startsWith("$2");
    let currentPasswordMatches = false;

    if (isHashed) {
      currentPasswordMatches = await bcrypt.compare(
        password,
        currentStoredPass
      );
    } else {
      currentPasswordMatches = password === currentStoredPass;
    }

    if (!currentPasswordMatches) {
      setError(t.invalidPass);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.passMismatch);
      return;
    }
    if (newPassword.length < 3) {
      setError("Password too short");
      return;
    }

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update state with hashed password and clear the requirePasswordChange flag
    onTeamUpdate((prevTeam) =>
      prevTeam.map((u) =>
        u.id === +selectedUser
          ? { ...u, password: hashedPassword, requirePasswordChange: false }
          : u
      )
    );

    setSuccessMsg(t.passChanged);
    // After successful password change, log the user in
    setTimeout(() => {
      onLoginSuccess("editor", user.name, user.id);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
        <div className="bg-indigo-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
            {targetRole === "manager" ? (
              <Lock size={32} />
            ) : (
              <UserCheck size={32} />
            )}
          </div>
          <h3 className="text-xl font-bold text-white">
            {isChangeMode ? t.changePass : t.loginRequired}
          </h3>
          <p className="text-indigo-200 text-sm mt-1">
            {targetRole === "manager" ? t.managerLoginDesc : t.userLoginDesc}
          </p>
        </div>
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100 animate-shake mb-4">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-green-100 mb-4">
              <CheckCircle size={16} /> {successMsg}
            </div>
          )}

          {!isChangeMode && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {targetRole === "editor" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.selectUser}
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                  >
                    <option value="">{t.selectUser}</option>
                    {team.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} - {u.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.password}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Lock size={16} />
                  {t.login}
                </button>
              </div>
              {targetRole === "editor" && (
                <button
                  type="button"
                  onClick={() => setIsChangeMode(true)}
                  className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {t.changePass}
                </button>
              )}
            </form>
          )}

          {isChangeMode && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded mb-4 flex items-start gap-2">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">
                    Password Change Required
                  </div>
                  <div className="text-xs">
                    You must change your password before continuing. Updating
                    password for:{" "}
                    <strong>
                      {team.find((u) => u.id === +selectedUser)?.name}
                    </strong>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t.password} (Current)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t.newPass}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {t.confirmPass}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsChangeMode(false)}
                  className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded"
                >
                  {t.backToLogin}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-bold text-white bg-green-600 rounded"
                >
                  {t.changePass}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
