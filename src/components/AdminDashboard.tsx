import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Users,
  Settings2,
  X,
} from "lucide-react";
import type {
  FeatureKey,
  FeatureToggles,
  NonAdminRoleId,
  OverrideType,
  ShiftOptionsByRole,
  CustomShift,
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

interface AdminDashboardProps {
  featureToggles: FeatureToggles;
  onToggleFeature: (role: NonAdminRoleId, feature: FeatureKey) => void;
  shiftOptionsByRole: ShiftOptionsByRole;
  onUpdateShiftOptionsByRole: (options: ShiftOptionsByRole) => void;
  onOpenAdminPanel: () => void;
  teamCount: number;
  holidayCountry: string;
  onHolidayCountryChange: (countryCode: string) => void;
  holidayCountryOptions: Array<{ code: string; name: string }>;
  holidaySyncStatus: "idle" | "syncing" | "error";
  holidayLastSyncedAt: number | null;
  showNationalHolidays: boolean;
  showRegionalHolidays: boolean;
  showOptionalHolidays: boolean;
  onHolidayVisibilityChange: (
    scope: "national" | "regional" | "optional",
    enabled: boolean,
  ) => void;
  holidayRegionOptions: Array<{ code: string; label: string; type: string }>;
  selectedHolidayRegions: string[];
  onToggleHolidayRegion: (region: string, enabled: boolean) => void;
  onSelectAllHolidayRegions: () => void;
  onClearHolidayRegions: () => void;
  optionalHolidayOptions: Array<{ date: string; label: string }>;
  selectedOptionalHolidayDates: string[];
  onToggleOptionalHoliday: (date: string, enabled: boolean) => void;
  onSelectAllOptionalHolidays: () => void;
  onClearOptionalHolidays: () => void;
  customShifts: CustomShift[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  featureToggles,
  onToggleFeature,
  shiftOptionsByRole,
  onUpdateShiftOptionsByRole,
  onOpenAdminPanel,
  teamCount,
  holidayCountry,
  onHolidayCountryChange,
  holidayCountryOptions,
  holidaySyncStatus,
  holidayLastSyncedAt,
  showNationalHolidays,
  showRegionalHolidays,
  showOptionalHolidays,
  onHolidayVisibilityChange,
  holidayRegionOptions,
  selectedHolidayRegions,
  onToggleHolidayRegion,
  onSelectAllHolidayRegions,
  onClearHolidayRegions,
  optionalHolidayOptions,
  selectedOptionalHolidayDates,
  onToggleOptionalHoliday,
  onSelectAllOptionalHolidays,
  onClearOptionalHolidays,
  customShifts,
}) => {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<NonAdminRoleId>("editor");
  const [regionSearchQuery, setRegionSearchQuery] = useState("");
  const [optionalSearchQuery, setOptionalSearchQuery] = useState("");
  const [regionalAreasExpanded, setRegionalAreasExpanded] = useState(true);
  const [optionalHolidaysExpanded, setOptionalHolidaysExpanded] =
    useState(true);

  const EDITOR_SHIFT_OPTIONS: Array<{ id: OverrideType; label: string }> = [
    ...customShifts.map((shift) => ({
      id: shift.code as OverrideType,
      label: `${shift.label} (${shift.code})`,
    })),
    { id: "V", label: "Vacation (V)" },
    { id: "S", label: "Sick Leave (S)" },
    { id: "TR", label: "Training (TR)" },
  ];

  const visibleFeatures = FEATURE_CATALOG.filter(
    (feature) => feature.key !== "viewRequests",
  );

  const isFeatureDisabled = (_role: NonAdminRoleId, _feature: FeatureKey) => {
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

  const normalizedRegionQuery = regionSearchQuery.trim().toLowerCase();

  const filteredHolidayRegionOptions = holidayRegionOptions.filter((option) => {
    if (!normalizedRegionQuery) return true;
    const haystack =
      `${option.label} ${option.code} ${option.type}`.toLowerCase();
    return haystack.includes(normalizedRegionQuery);
  });

  const groupedHolidayRegionOptions = filteredHolidayRegionOptions.reduce(
    (groups, option) => {
      const key = option.type || "Region";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(option);
      return groups;
    },
    {} as Record<string, Array<{ code: string; label: string; type: string }>>,
  );

  const sortedGroupKeys = Object.keys(groupedHolidayRegionOptions).sort(
    (a, b) => a.localeCompare(b),
  );

  const normalizedOptionalQuery = optionalSearchQuery.trim().toLowerCase();
  const filteredOptionalHolidayOptions = optionalHolidayOptions.filter(
    (option) => {
      if (!normalizedOptionalQuery) return true;
      const haystack = `${option.label} ${option.date}`.toLowerCase();
      return haystack.includes(normalizedOptionalQuery);
    },
  );

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

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-slate-700">
              Public Holidays
            </h3>
            <p className="text-xs text-slate-500">
              Select country. Holidays auto-sync with low API usage.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-600">
            Holiday Country
          </label>
          <select
            value={holidayCountry}
            onChange={(event) => onHolidayCountryChange(event.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {holidayCountryOptions.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name} ({country.code})
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-500">
            {holidaySyncStatus === "syncing"
              ? "Syncing holidays..."
              : holidaySyncStatus === "error"
                ? "Holiday sync failed. Cached data remains active."
                : holidayLastSyncedAt
                  ? `Last sync: ${new Date(holidayLastSyncedAt).toLocaleString()}`
                  : "Waiting for first sync."}
          </div>
          <div className="pt-2 border-t mt-2 space-y-2">
            <div className="text-xs font-medium text-slate-600">
              Display Filters
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                className="rounded w-4 h-4"
                checked={showNationalHolidays}
                onChange={(event) =>
                  onHolidayVisibilityChange("national", event.target.checked)
                }
              />
              National
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 mt-1">
              <input
                type="checkbox"
                className="rounded w-4 h-4"
                checked={showRegionalHolidays}
                onChange={(event) =>
                  onHolidayVisibilityChange("regional", event.target.checked)
                }
              />
              Regional
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 mt-1">
              <input
                type="checkbox"
                className="rounded w-4 h-4"
                checked={showOptionalHolidays}
                onChange={(event) =>
                  onHolidayVisibilityChange("optional", event.target.checked)
                }
              />
              Optional
            </label>

            {showRegionalHolidays && (
              <div className="mt-2 pl-2 border-l border-slate-200">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500">
                    Regional Areas
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setRegionalAreasExpanded((previous) => !previous)
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded hover:bg-slate-50"
                  >
                    {regionalAreasExpanded ? (
                      <>
                        <ChevronUp size={12} /> Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown size={12} /> Show
                      </>
                    )}
                  </button>
                </div>
                {!regionalAreasExpanded ? null : holidayRegionOptions.length ===
                  0 ? (
                  <div className="text-[11px] text-slate-400">
                    No region-specific holidays found for selected country.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onSelectAllHolidayRegions}
                        className="px-2.5 py-1.5 text-[11px] border rounded hover:bg-slate-50"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={onClearHolidayRegions}
                        className="px-2.5 py-1.5 text-[11px] border rounded hover:bg-slate-50"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={regionSearchQuery}
                        onChange={(event) =>
                          setRegionSearchQuery(event.target.value)
                        }
                        placeholder="Search region, code, or type..."
                        className="w-full px-3 py-2 pr-8 text-xs border rounded-md"
                      />
                      {regionSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setRegionSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          aria-label="Clear search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {filteredHolidayRegionOptions.length === 0 && (
                      <div className="text-[11px] text-slate-400">
                        No regions match your search.
                      </div>
                    )}
                    <div className="space-y-3">
                      {sortedGroupKeys.map((groupKey) => (
                        <div key={groupKey} className="space-y-2">
                          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            {groupKey}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {groupedHolidayRegionOptions[groupKey].map(
                              (regionOption) => {
                                const isChecked =
                                  selectedHolidayRegions.includes(
                                    regionOption.code,
                                  );
                                return (
                                  <label
                                    key={regionOption.code}
                                    className={`w-full inline-flex items-center gap-2.5 border rounded-md px-3 py-1.5 text-xs transition-colors ${
                                      isChecked
                                        ? "bg-indigo-50 border-indigo-300 text-indigo-800"
                                        : "bg-white border-slate-300 text-slate-700"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="rounded w-4 h-4"
                                      checked={isChecked}
                                      onChange={(event) =>
                                        onToggleHolidayRegion(
                                          regionOption.code,
                                          event.target.checked,
                                        )
                                      }
                                    />
                                    <span className="whitespace-nowrap">
                                      {regionOption.label}
                                    </span>
                                  </label>
                                );
                              },
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showOptionalHolidays && (
              <div className="mt-2 pl-2 border-l border-slate-200">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500">
                    Optional Public Holidays
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setOptionalHolidaysExpanded((previous) => !previous)
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border rounded hover:bg-slate-50"
                  >
                    {optionalHolidaysExpanded ? (
                      <>
                        <ChevronUp size={12} /> Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown size={12} /> Show
                      </>
                    )}
                  </button>
                </div>
                {!optionalHolidaysExpanded ? null : optionalHolidayOptions.length ===
                  0 ? (
                  <div className="text-[11px] text-slate-400">
                    No optional holidays found for selected country.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onSelectAllOptionalHolidays}
                        className="px-2.5 py-1.5 text-[11px] border rounded hover:bg-slate-50"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={onClearOptionalHolidays}
                        className="px-2.5 py-1.5 text-[11px] border rounded hover:bg-slate-50"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={optionalSearchQuery}
                        onChange={(event) =>
                          setOptionalSearchQuery(event.target.value)
                        }
                        placeholder="Search optional holiday..."
                        className="w-full px-3 py-2 pr-8 text-xs border rounded-md"
                      />
                      {optionalSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setOptionalSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          aria-label="Clear optional search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {filteredOptionalHolidayOptions.length === 0 && (
                      <div className="text-[11px] text-slate-400">
                        No optional holidays match your search.
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {filteredOptionalHolidayOptions.map((holidayOption) => {
                        const isChecked = selectedOptionalHolidayDates.includes(
                          holidayOption.date,
                        );
                        return (
                          <label
                            key={holidayOption.date}
                            className={`w-full inline-flex items-center gap-2.5 border rounded-md px-3 py-1.5 text-xs transition-colors ${
                              isChecked
                                ? "bg-indigo-50 border-indigo-300 text-indigo-800"
                                : "bg-white border-slate-300 text-slate-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="rounded w-4 h-4"
                              checked={isChecked}
                              onChange={(event) =>
                                onToggleOptionalHoliday(
                                  holidayOption.date,
                                  event.target.checked,
                                )
                              }
                            />
                            <span className="whitespace-nowrap">
                              {holidayOption.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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
