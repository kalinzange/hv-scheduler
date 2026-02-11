import React from "react";
import { Shield, Users } from "lucide-react";
import type { FeatureKey, FeatureToggles, NonAdminRoleId } from "../types";

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

interface AdminDashboardProps {
  featureToggles: FeatureToggles;
  onToggleFeature: (role: NonAdminRoleId, feature: FeatureKey) => void;
  onOpenAdminPanel: () => void;
  teamCount: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  featureToggles,
  onToggleFeature,
  onOpenAdminPanel,
  teamCount,
}) => {
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
        <h3 className="text-sm font-bold text-slate-700 mb-3">
          Feature Controls by Role
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">Feature</th>
                {Object.keys(ROLE_LABELS).map((role) => (
                  <th key={role} className="py-2 pr-4">
                    {ROLE_LABELS[role as NonAdminRoleId]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_CATALOG.map((feature) => (
                <tr key={feature.key} className="border-t">
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-slate-700">
                      {feature.label}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {feature.description}
                    </div>
                  </td>
                  {(Object.keys(ROLE_LABELS) as NonAdminRoleId[]).map(
                    (role) => (
                      <td key={role} className="py-3 pr-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={featureToggles.roles[role][feature.key]}
                            onChange={() => onToggleFeature(role, feature.key)}
                            className="rounded w-4 h-4"
                          />
                          <span className="text-[11px] text-slate-500">
                            {featureToggles.roles[role][feature.key]
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </label>
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[11px] text-slate-500 mt-3">
          Feature toggles are client-side controls. Enforce critical policies in
          Firebase rules and backend services.
        </div>
      </div>
    </div>
  );
};
