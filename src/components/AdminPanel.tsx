import React, { useState, useMemo } from "react";
import {
  Shield,
  ChevronLeft,
  Search,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  Key,
  User as UserIcon,
  ArrowLeft,
} from "lucide-react";
import bcrypt from "bcryptjs";
import type { Employee } from "../types";

interface AdminPanelProps {
  show: boolean;
  team: Employee[];
  setTeam: React.Dispatch<React.SetStateAction<Employee[]>>;
  onClose?: () => void;
}

const roleColors = {
  admin: "bg-red-100 text-red-700 border-red-200",
  manager: "bg-purple-100 text-purple-700 border-purple-200",
  editor: "bg-blue-100 text-blue-700 border-blue-200",
  viewer: "bg-gray-100 text-gray-700 border-gray-200",
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  show,
  team,
  setTeam,
  onClose,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Calculate security statistics
  const securityStats = useMemo(() => {
    const encrypted = team.filter(
      (u) => u.password && u.password.startsWith("$2"),
    ).length;
    const plainText = team.filter(
      (u) => u.password && !u.password.startsWith("$2"),
    ).length;
    const requireChange = team.filter((u) => u.requirePasswordChange).length;
    const noPassword = team.filter((u) => !u.password).length;

    return {
      encrypted,
      plainText,
      requireChange,
      noPassword,
      total: team.length,
    };
  }, [team]);

  // Filter users based on search query
  const filteredTeam = useMemo(() => {
    if (!searchQuery.trim()) return team;
    const query = searchQuery.toLowerCase();
    return team.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query),
    );
  }, [team, searchQuery]);

  if (!show) return null;

  const showMessage = (type: "success" | "error" | "info", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleResetPassword = async (userId: number, defaultPass: string) => {
    if (!window.confirm(`Reset password for this user to: ${defaultPass}?`)) {
      return;
    }

    setLoading(true);
    try {
      const hashedPassword = await bcrypt.hash(defaultPass, 10);

      setTeam((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                password: hashedPassword,
                requirePasswordChange: true,
              }
            : u,
        ),
      );

      const userName = team.find((u) => u.id === userId)?.name;
      showMessage("success", `Password reset for ${userName}`);
      setSelectedUserId(null);
    } catch (error) {
      showMessage("error", "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (userId: number) => {
    if (!newPassword.trim()) {
      showMessage("error", "Please enter a password");
      return;
    }

    if (newPassword.length < 4) {
      showMessage("error", "Password must be at least 4 characters");
      return;
    }

    setLoading(true);
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      setTeam((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                password: hashedPassword,
                requirePasswordChange: true,
              }
            : u,
        ),
      );

      const userName = team.find((u) => u.id === userId)?.name;
      showMessage("success", `Password set for ${userName}`);
      setNewPassword("");
      setSelectedUserId(null);
    } catch (error) {
      showMessage("error", "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  const handleEncryptAllPasswords = async () => {
    if (securityStats.plainText === 0) {
      showMessage("info", "All passwords are already encrypted!");
      return;
    }

    if (
      !window.confirm(
        `This will encrypt ${securityStats.plainText} plain-text password(s). All affected users will need to change their password on next login. Continue?`,
      )
    ) {
      return;
    }

    setLoading(true);
    showMessage("info", "Encrypting passwords...");

    try {
      const updatedTeam = await Promise.all(
        team.map(async (user) => {
          if (!user.password || user.password.startsWith("$2")) {
            return user;
          }

          const hashedPassword = await bcrypt.hash(user.password, 10);
          return {
            ...user,
            password: hashedPassword,
            requirePasswordChange: true,
          };
        }),
      );

      setTeam(updatedTeam);
      showMessage(
        "success",
        `Successfully encrypted ${securityStats.plainText} password(s)!`,
      );
    } catch (error) {
      showMessage("error", "Failed to encrypt passwords");
    } finally {
      setLoading(false);
    }
  };

  const isPasswordEncrypted = (password: string | undefined): boolean => {
    return !!password && password.startsWith("$2");
  };

  return (
    <div className="w-full bg-white shadow-lg overflow-y-auto flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-5 border-b shadow-md z-10">
        <div className="flex items-center gap-3 mb-4">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="p-2 bg-white/10 rounded-lg">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="font-bold text-xl">User Security</h2>
            <p className="text-xs text-red-100">Password & Access Management</p>
          </div>
        </div>

        {/* Security Overview Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 rounded-lg p-2">
            <div className="text-xs text-red-100">Total Users</div>
            <div className="text-2xl font-bold">{securityStats.total}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <div className="text-xs text-red-100">Encrypted</div>
            <div className="text-2xl font-bold flex items-center gap-1">
              {securityStats.encrypted}
              {securityStats.plainText === 0 && <CheckCircle size={16} />}
            </div>
          </div>
          {securityStats.plainText > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-2">
              <div className="text-xs text-yellow-100">Plain-text</div>
              <div className="text-2xl font-bold text-yellow-200 flex items-center gap-1">
                {securityStats.plainText}
                <AlertCircle size={16} />
              </div>
            </div>
          )}
          {securityStats.requireChange > 0 && (
            <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-2">
              <div className="text-xs text-orange-100">Needs Change</div>
              <div className="text-2xl font-bold text-orange-200">
                {securityStats.requireChange}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Message Banner */}
        {message && (
          <div
            className={`${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : message.type === "error"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-blue-50 border-blue-200 text-blue-700"
            } border p-3 rounded-lg text-sm flex items-start gap-2`}
          >
            {message.type === "success" && (
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            )}
            {message.type === "error" && (
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            )}
            {message.type === "info" && (
              <Shield size={16} className="mt-0.5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Encrypt All Passwords Button */}
        {securityStats.plainText > 0 && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle size={20} className="text-yellow-700" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  Security Warning
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {securityStats.plainText} user
                  {securityStats.plainText > 1 ? "s have" : " has"} plain-text
                  password{securityStats.plainText > 1 ? "s" : ""}. Encrypt them
                  to improve security.
                </p>
              </div>
            </div>
            <button
              onClick={handleEncryptAllPasswords}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition font-medium text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              Encrypt All Passwords
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search users by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* User Management */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <UserIcon size={16} />
            User Accounts
            <span className="text-xs font-normal text-gray-500">
              ({filteredTeam.length} of {team.length})
            </span>
          </h3>
          <div className="space-y-2">
            {filteredTeam.map((user) => {
              const encrypted = isPasswordEncrypted(user.password);
              return (
                <div
                  key={user.id}
                  className={`bg-white border ${
                    selectedUserId === user.id
                      ? "border-red-300 shadow-md"
                      : "border-gray-200"
                  } rounded-lg p-3 cursor-pointer hover:border-red-200 hover:shadow-sm transition-all`}
                  onClick={() =>
                    setSelectedUserId(
                      selectedUserId === user.id ? null : user.id,
                    )
                  }
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800">
                          {user.name}
                        </p>
                        {user.requirePasswordChange && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-medium rounded border border-orange-200">
                            NEEDS CHANGE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-medium rounded border ${
                            roleColors[user.role as keyof typeof roleColors]
                          }`}
                        >
                          {user.role.toUpperCase()}
                        </span>
                        {encrypted ? (
                          <span className="flex items-center gap-1 text-[10px] text-green-600">
                            <Lock size={10} />
                            Encrypted
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-red-600">
                            <Unlock size={10} />
                            Plain-text
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronLeft
                      size={16}
                      className={`text-gray-400 transition-transform ${
                        selectedUserId === user.id ? "rotate-[-90deg]" : ""
                      }`}
                    />
                  </div>

                  {selectedUserId === user.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      {/* Quick Reset */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Quick Reset
                        </label>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetPassword(user.id, "1234");
                          }}
                          disabled={loading}
                          className="w-full px-3 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Key size={14} />
                          Reset to Default (1234)
                        </button>
                      </div>

                      {/* Custom Password */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Set Custom Password
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") {
                                handleSetPassword(user.id);
                              }
                            }}
                            disabled={loading}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetPassword(user.id);
                            }}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Set
                          </button>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 space-y-1">
                        <div className="flex justify-between">
                          <span>Password Status:</span>
                          <span
                            className={`font-medium ${encrypted ? "text-green-600" : "text-red-600"}`}
                          >
                            {encrypted ? "Encrypted" : "Plain-text"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Requires Change:</span>
                          <span
                            className={`font-medium ${user.requirePasswordChange ? "text-orange-600" : "text-gray-600"}`}
                          >
                            {user.requirePasswordChange ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>User ID:</span>
                          <span className="font-mono">{user.id}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredTeam.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No users found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
