import React, { useState, useEffect, useMemo } from "react";
import {
  Lock,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import bcrypt from "bcryptjs";
import type { Employee, Translations, RoleId } from "../types";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import { APP_ID } from "../config/constants";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: RoleId | null;
  team: Employee[];
  onLoginSuccess: (role: RoleId, name: string, userId: number) => void;
  onTeamUpdate: (updater: (prev: Employee[]) => Employee[]) => void;
  t: Translations;
  tokenExpiredMsg?: string; // Message when token expires
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  team,
  onLoginSuccess,
  onTeamUpdate,
  t,
  tokenExpiredMsg = "",
}) => {
  const [password, setPassword] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isChangeMode, setIsChangeMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [storedToken, setStoredToken] = useState<string | null>(null);

  const groupedTeam = useMemo(() => {
    const buckets = team.reduce<Record<string, Employee[]>>((acc, member) => {
      const roleKey = member.role || "Other";
      if (!acc[roleKey]) acc[roleKey] = [];
      acc[roleKey].push(member);
      return acc;
    }, {});

    const priorityRoles = ["GCC", "Field Dispatch", "Remote Ops"];
    
    return Object.entries(buckets)
      .sort(([roleA], [roleB]) => {
        const indexA = priorityRoles.indexOf(roleA);
        const indexB = priorityRoles.indexOf(roleB);
        
        // If both roles are in priority list, sort by their priority order
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // If only roleA is in priority list, it comes first
        if (indexA !== -1) return -1;
        // If only roleB is in priority list, it comes first
        if (indexB !== -1) return 1;
        // If neither is in priority list, sort alphabetically
        return roleA.localeCompare(roleB);
      })
      .map(([role, members]) => ({
        role,
        members: members.slice().sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [team]);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setSelectedUser("");
      setError("");
      setSuccessMsg("");
      setIsChangeMode(false);
      setNewPassword("");
      setConfirmPassword("");
      setIsLoading(false);
      setStoredToken(null);
    }
  }, [isOpen, targetRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (targetRole === "manager" || targetRole === "admin") {
      try {
        // Validate inputs before sending
        if (!password || password.length < 1 || password.length > 500) {
          setError("Invalid password format");
          setIsLoading(false);
          return;
        }

        const cloudFunctionUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;
        if (!cloudFunctionUrl) {
          setError("Server configuration error. Contact administrator.");
          setIsLoading(false);
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
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        const token = data?.token;

        if (!token || typeof token !== "string") {
          setError("Invalid server response");
          setIsLoading(false);
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
        // Persist token and role for session recovery
        sessionStorage.setItem("firebaseToken", token);
        sessionStorage.setItem("firebaseTokenRole", targetRole);
        const name = targetRole === "admin" ? "Admin" : "Diretor";
        onLoginSuccess(targetRole, name, 0);
        onClose();
        setIsLoading(false);
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.error("Login error:", err);
        }
        setError(
          err?.code === "auth/invalid-custom-token"
            ? "Session expired. Try again."
            : t.invalidPass,
        );
        setIsLoading(false);
      }
    } else if (targetRole === "editor") {
      if (!selectedUser) {
        setError(t.selectUser);
        setIsLoading(false);
        return;
      }
      const user = team.find((u) => u.id === +selectedUser);
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const cloudFunctionUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;
        if (!cloudFunctionUrl) {
          setError("Server configuration error. Contact administrator.");
          setIsLoading(false);
          return;
        }

        const res = await fetch(cloudFunctionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "cors",
          body: JSON.stringify({
            role: "editor",
            password,
            userId: user.id,
            team: team.map((t) => ({
              id: t.id,
              name: t.name,
              password: t.password,
            })),
          }),
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
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        const token = data?.token;

        if (!token || typeof token !== "string") {
          setError("Invalid server response");
          setIsLoading(false);
          return;
        }

        const auth = getAuth();
        try {
          await auth.signOut();
        } catch (e) {
          if (import.meta.env.DEV) {
            console.warn("[Login] signOut before custom token failed", e);
          }
        }

        // Authenticate with Firebase FIRST, before checking requirePasswordChange
        await signInWithCustomToken(auth, token);

        // Wait for auth state to fully propagate (critical for Firestore permissions)
        await new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
              unsubscribe();
              resolve(undefined);
            }
          });
          // Fallback timeout after 2 seconds
          setTimeout(() => {
            unsubscribe();
            resolve(undefined);
          }, 2000);
        });

        sessionStorage.setItem("firebaseToken", token);
        sessionStorage.setItem("firebaseTokenRole", "editor");

        // Always call onLoginSuccess to set user permissions in app state
        onLoginSuccess("editor", user.name, user.id);

        // Check if user needs to change password
        if (user.requirePasswordChange) {
          // User is now authenticated and app knows they're an editor
          // Keep modal open for password change
          setIsChangeMode(true);
          setIsLoading(false);
          return;
        }

        // Normal login - user doesn't need to change password, close modal
        onClose();
        setIsLoading(false);
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.error("Editor login error:", err);
        }
        setError(
          err?.code === "auth/invalid-custom-token"
            ? "Session expired. Try again."
            : t.invalidPass,
        );
        setIsLoading(false);
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
        currentStoredPass,
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

    setIsLoading(true);

    try {
      // Hash the new password before saving
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update team array with new password directly in Firestore
      // This bypasses the normal save batcher and role-based filtering
      const updatedTeam = team.map((u) =>
        u.id === +selectedUser
          ? { ...u, password: hashedPassword, requirePasswordChange: false }
          : u,
      );

      const db = getFirestore();
      const dataDocRef = doc(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "shift_scheduler",
        "global_state",
      );

      await updateDoc(dataDocRef, {
        team: updatedTeam,
        lastUpdated: Date.now(),
      });

      // Also update local state so the UI reflects the change
      onTeamUpdate(() => updatedTeam);

      setSuccessMsg(t.passChanged);

      // User is already authenticated and logged into app
      // Just close modal after password change
      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 800);
    } catch (error) {
      console.error("Password change error:", error);
      setError("Failed to change password. Please try again.");
      setIsLoading(false);
    }
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
          {tokenExpiredMsg && (
            <div className="bg-orange-50 text-orange-700 p-3 rounded-lg text-sm flex items-center gap-2 border border-orange-200 mb-4">
              <AlertCircle size={16} /> {tokenExpiredMsg}
            </div>
          )}
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
                    {groupedTeam.map(({ role, members }) => (
                      <optgroup key={role} label={role}>
                        {members.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </optgroup>
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
                  disabled={isLoading}
                  className="flex-1 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t.login}ing...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      {t.login}
                    </>
                  )}
                </button>
              </div>
              {targetRole === "editor" && (
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedUser) {
                      setError(t.selectUser);
                      return;
                    }
                    setIsChangeMode(true);
                    setError("");
                    setSuccessMsg("");
                  }}
                  className={`w-full text-sm font-medium rounded-lg px-3 py-2 border transition ${
                    selectedUser
                      ? "text-indigo-600 bg-indigo-50 border-indigo-100 hover:text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 active:translate-y-[1px]"
                      : "text-gray-400 cursor-not-allowed bg-gray-50 border-gray-200"
                  }`}
                  disabled={!selectedUser}
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
