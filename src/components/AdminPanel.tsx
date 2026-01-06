import React, { useState } from "react";
import { Shield, ChevronLeft } from "lucide-react";
import bcrypt from "bcryptjs";
import type { Employee } from "../types";

interface AdminPanelProps {
  show: boolean;
  team: Employee[];
  setTeam: React.Dispatch<React.SetStateAction<Employee[]>>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  show,
  team,
  setTeam,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  if (!show) return null;

  const handleResetPassword = async (userId: number, defaultPass: string) => {
    if (!window.confirm(`Reset password for this user to: ${defaultPass}?`)) {
      return;
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash(defaultPass, 10);

    setTeam((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              password: hashedPassword,
              requirePasswordChange: true,
            }
          : u
      )
    );

    setMessage(`Password reset for ${team.find((u) => u.id === userId)?.name}`);
    setTimeout(() => setMessage(""), 3000);
    setSelectedUserId(null);
  };

  const handleSetPassword = async (userId: number) => {
    if (!newPassword) {
      setMessage("Please enter a password");
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    setTeam((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              password: hashedPassword,
              requirePasswordChange: true,
            }
          : u
      )
    );

    setMessage(`Password set for ${team.find((u) => u.id === userId)?.name}`);
    setTimeout(() => setMessage(""), 3000);
    setNewPassword("");
    setSelectedUserId(null);
  };

  const handleEncryptAllPasswords = async () => {
    const plainTextCount = team.filter(
      (u) => u.password && !u.password.startsWith("$2")
    ).length;

    if (plainTextCount === 0) {
      setMessage("All passwords are already encrypted!");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    if (
      !window.confirm(
        `This will encrypt ${plainTextCount} plain-text password(s). All users will need to change their password on next login. Continue?`
      )
    ) {
      return;
    }

    setMessage("Encrypting passwords...");

    const updatedTeam = await Promise.all(
      team.map(async (user) => {
        // Check if password is already hashed
        if (!user.password || user.password.startsWith("$2")) {
          return user;
        }

        // Hash the plain text password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return {
          ...user,
          password: hashedPassword,
          requirePasswordChange: true,
        };
      })
    );

    setTeam(updatedTeam);
    setMessage(`Successfully encrypted ${plainTextCount} password(s)!`);
    setTimeout(() => setMessage(""), 5000);
  };

  return (
    <div className="w-80 bg-white border-l shadow-lg overflow-y-auto flex flex-col h-full">
      <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 flex items-center justify-between border-b shadow-md">
        <div className="flex items-center gap-2">
          <Shield size={20} />
          <h2 className="font-bold text-lg">Admin Panel</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded text-sm">
            {message}
          </div>
        )}

        {/* Encrypt All Passwords Button */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Shield size={16} className="text-yellow-600" />
            Security Actions
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Encrypt all plain-text passwords in the database. This is a one-time
            operation.
          </p>
          <button
            onClick={handleEncryptAllPasswords}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium text-sm shadow-sm"
          >
            🔒 Encrypt All Passwords
          </button>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 mb-3">User Management</h3>
          <div className="space-y-2">
            {team.map((user) => (
              <div
                key={user.id}
                className="bg-gray-50 border rounded p-3 cursor-pointer hover:bg-gray-100"
                onClick={() =>
                  setSelectedUserId(selectedUserId === user.id ? null : user.id)
                }
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  {selectedUserId === user.id && (
                    <ChevronLeft size={16} className="text-gray-400" />
                  )}
                </div>

                {selectedUserId === user.id && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetPassword(user.id, "1234");
                      }}
                      className="w-full px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition text-sm font-medium"
                    >
                      Reset to Default (1234)
                    </button>

                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-2 py-1 border rounded text-xs"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPassword(user.id);
                        }}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-xs font-medium"
                      >
                        Set
                      </button>
                    </div>

                    <div className="text-[11px] text-gray-500 bg-gray-100 p-2 rounded">
                      <p>
                        <strong>Requires Password Change:</strong>{" "}
                        {user.requirePasswordChange ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
