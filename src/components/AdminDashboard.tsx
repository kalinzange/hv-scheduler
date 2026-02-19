import React, { useState } from "react";
import { Shield, Users, Settings2, X } from "lucide-react";
import type {
  FeatureKey,
  FeatureToggles,
  NonAdminRoleId,
  OverrideType,
  ShiftOptionsByRole,
} from "../types";

const ROLE_LABELS: Record<NonAdminRoleId, string> = {
  viewer: "Reader",
  editor: "Escalator",
  manager: "Manager",
};

const FEATURE_CATALOG: Array<{
  key: FeatureKey;
  label: string;
  description: string;
}> = [
  {
    key: "viewCalendar",
    label: "Calendar View",
    description: "Show the schedule grid and navigation tools.",
  },
  {
    key: "editSchedule",
    label: "Edit Schedule",
    description: "Allow shift edits and draft changes.",
  },
  {
    key: "bulkActions",
    label: "Bulk Actions",
    description: "Enable bulk shift actions and mass updates.",
  },
  {
    key: "viewRequests",
    label: "Requests Inbox",
    description: "Show pending requests and approvals.",
  },
  {
    key: "publishSchedule",
    label: "Publish Schedule",
    description: "Allow publishing draft schedules.",
  },
  {
    key: "exportCsv",
    label: "Export CSV",
    description: "Enable CSV export for reporting.",
  },
  {
    key: "fileBackup",
    label: "Backup Tools",
    description: "Allow save/load of JSON backups.",
  },
  {
    key: "viewStats",
    label: "Stats",
    description: "Show analytics and workload summaries.",
  },
  {
    key: "viewAnnual",
    label: "Annual View",
    description: "Enable year-wide schedule view.",
  },
  {
    key: "configPanel",
    label: "Settings Panel",
    description: "Allow editing system configuration.",
  },
  {
    key: "viewCoverage",
    label: "Coverage Analysis",
    description: "Show coverage, risks, and staffing alerts.",
  },
];

const EDITOR_SHIFT_OPTIONS: Array<{ id: OverrideType; label: string }> = [
  { id: "M", label: "Morning (M)" },
  { id: "T", label: "Afternoon (T)" },
  { id: "N", label: "Night (N)" },
  { id: "F", label: "Day Off (F)" },
  { id: "V", label: "Vacation (V)" },
  { id: "S", label: "Sick Leave (S)" },
];

interface AdminDashboardProps {
  featureToggles: FeatureToggles;
  onToggleFeature: (role: NonAdminRoleId, feature: FeatureKey) => void;
  shiftOptionsByRole: ShiftOptionsByRole;
  onUpdateShiftOptionsByRole: (options: ShiftOptionsByRole) => void;
  onOpenAdminPanel: () => void;
  teamCount: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  featureToggles,
  onToggleFeature,
  shiftOptionsByRole,
  onUpdateShiftOptionsByRole,
  onOpenAdminPanel,
  teamCount,
}) => {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<NonAdminRoleId>("editor");

  const visibleFeatures = FEATURE_CATALOG.filter(
    (feature) => feature.key !== "viewRequests",
  );

  const isFeatureDisabled = (role: NonAdminRoleId, _feature: FeatureKey) => {
    return false;
  };

  const toggleRoleShiftOption = (
    role: NonAdminRoleId,
    option: OverrideType,
  ) => {
    const current = shiftOptionsByRole[role] || [];
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    onUpdateShiftOptionsByRole({
      ...shiftOptionsByRole,
      [role]: next,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Shield size={16} /> System Admin Console
            </div>
            <h2 className="text-2xl font-bold mt-1">Operations Overview</h2>
            <p className="text-sm text-slate-300 mt-1">
              Identity controls, access governance, and policy oversight.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <div className="rounded-lg bg-white/10 border border-white/20 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Users size={14} /> Team
            </div>
            <div className="text-2xl font-semibold mt-1">{teamCount}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-slate-700">
              Security Operations
            </h3>
            <p className="text-xs text-slate-500">
              Manage credentials, resets, and access enforcement.
            </p>
          </div>
          <button
            onClick={onOpenAdminPanel}
            className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-slate-50"
          >
            <Shield size={14} /> User Security
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-slate-700">
              Role Visibility Controls
            </h3>
            <p className="text-xs text-slate-500">
              Configure which options appear for each access mode.
            </p>
          </div>
          <button
            onClick={() => setOptionsOpen(true)}
            className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-slate-50"
          >
            <Settings2 size={14} /> Configure
          </button>
        </div>
        <div className="text-[11px] text-slate-500 mt-3">
          Changes apply immediately and affect the UI for each role.
        </div>
      </div>

      {optionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <h4 className="text-sm font-bold text-slate-700">
                  Role Visibility Settings
                </h4>
                <p className="text-xs text-slate-500">
                  Toggle exactly which options are visible per role.
                </p>
              </div>
              <button
                onClick={() => setOptionsOpen(false)}
                className="p-2 rounded hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ROLE_LABELS) as NonAdminRoleId[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition ${
                      activeRole === role
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>

              <div className="rounded-lg border bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-700">
                  Shift Options for {ROLE_LABELS[activeRole]}
                </div>
                <div className="text-[11px] text-slate-500 mb-2">
                  Select which shift options are visible for this role.
                </div>
                <div className="flex flex-wrap gap-2">
                  {EDITOR_SHIFT_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className="inline-flex items-center gap-2 text-xs text-slate-600"
                    >
                      <input
                        type="checkbox"
                        className="rounded w-4 h-4"
                        checked={(
                          shiftOptionsByRole[activeRole] || []
                        ).includes(option.id)}
                        onChange={() =>
                          toggleRoleShiftOption(activeRole, option.id)
                        }
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleFeatures.map((feature) => {
                  const disabled = isFeatureDisabled(activeRole, feature.key);
                  return (
                    <label
                      key={feature.key}
                      className={`border rounded-lg p-3 flex items-start gap-3 ${
                        disabled ? "bg-slate-50 text-slate-300" : "bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 rounded w-4 h-4"
                        checked={featureToggles.roles[activeRole][feature.key]}
                        onChange={() =>
                          onToggleFeature(activeRole, feature.key)
                        }
                        disabled={disabled}
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-700">
                          {feature.label}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {feature.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t px-5 py-3">
              <div className="text-[11px] text-slate-500">
                Feature visibility affects the UI. Enforce critical policies in
                backend services.
              </div>
              <button
                onClick={() => setOptionsOpen(false)}
                className="px-3 py-1.5 text-xs border rounded-md hover:bg-slate-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
