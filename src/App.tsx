import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Users,
  Settings,
  Download,
  Printer,
  ArrowDownAZ,
  X,
  Clock,
  ShieldAlert,
  BarChart3,
  Palette,
  Eraser,
  Plane,
  Stethoscope,
  FileJson,
  Upload,
  Filter,
  MoreHorizontal,
  RefreshCw,
  AlertCircle,
  Shield,
  Lock,
  Eye,
  Edit3,
  KeyRound,
  UserCheck,
  Inbox,
  Check,
  ArrowDownZA,
  Briefcase,
  Languages as LangIcon,
  Layers,
  Plus,
  Cloud,
  CloudOff,
  Loader2,
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  DocumentSnapshot,
  FirestoreError,
} from "firebase/firestore";

// --- FIREBASE CONFIGURATION (Hardcoded for stability) ---
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB_wYXEQ2ZO3cj4oDKKb0kzqfkkE5LlNFM",
  authDomain: "gcc-scheduler-3ef7f.firebaseapp.com",
  projectId: "gcc-scheduler-3ef7f",
  storageBucket: "gcc-scheduler-3ef7f.firebasestorage.app",
  messagingSenderId: "712007349828",
  appId: "1:712007349828:web:a8c931a6784a68b0beae11",
};

const APP_ID = "gcc-scheduler";

// --- ROLES & PERMISSIONS CONFIG ---
const ROLES = {
  VIEWER: {
    id: "viewer",
    label: "Reader",
    role: "viewer",
    permissions: ["read"],
    description: "Ready-only access to view the schedule.",
  },
  EDITOR: {
    id: "editor",
    label: "Escalador",
    role: "editor",
    permissions: ["read", "write", "self_only"],
    description: "Can edit own schedule only.",
  },
  MANAGER: {
    id: "manager",
    label: "Manager",
    role: "manager",
    permissions: ["read", "write", "admin", "approve"],
    description: "Full access to manage team schedules and approve requests.",
  },
};

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  en: {
    title: "Shift Scheduler - GCC Team",
    start: "Start",
    pattern: "Pattern",
    colaborador: "Employee",
    cargo: "Role",
    linguas: "Languages",
    analise: "Coverage Analysis",
    analiseDesc: "Missing languages or low staff",
    faltas: "Issues",
    manha: "Morning",
    tarde: "Afternoon",
    noite: "Night",
    folga: "Off",
    ferias: "Vacation",
    baixa: "Sick",
    exportCsv: "Excel",
    print: "Print",
    stats: "Stats",
    annual: "Annual View",
    config: "Settings",
    adjustOffsets: "Adjust Offsets",
    configPanelTitle: "Schedule Settings",
    generalParams: "General Parameters",
    startDate: "Rotation Start Date",
    rotationPattern: "Rotation Pattern",
    daysM: "Days Morning",
    offsM: "Offs (Auto)",
    daysT: "Days Afternoon",
    offsT: "Offs (Auto)",
    daysN: "Days Night",
    offsN: "Offs (Manual)",
    teamOffsets: "Team & Offsets",
    langsLabel: "Languages (comma separated)",
    name: "Name",
    offset: "Offset",
    printTitle: "Monthly Schedule",
    generatedOn: "Generated on",
    legend: "Legend",
    legendDesc: "Shift Codes",
    legM: "Morning",
    legT: "Afternoon",
    legN: "Night",
    legF: "Day Off",
    legV: "Vacation",
    legS: "Sick Leave",
    altActive: "* Alternating 2/3 days active",
    fixed2: "* Fixed 2 days",
    autoCalcInfo: "Auto M/T Offs: < 5 days = 1 Off; ≥ 5 days = 2 Offs.",
    sortTeam: "Sort by Shift",
    // New Settings
    holidaysSection: "Holidays Management",
    addHoliday: "Add Date",
    minStaffSection: "Minimum Staff Level",
    minStaffWarn: "Alert if count below:",
    langsSection: "Mandatory Languages",
    legendsSection: "Shift Legends & Hours",
    colorsSection: "Shift Colors",
    weekendSection: "Weekend Definition",
    lowStaff: "Low Staff",
    missing: "Missing",
    restWarn: "Short Rest (<11h)",
    // Stats & Hours
    statsTitle: "Team Statistics & Hour Bank",
    statName: "Name",
    statM: "M",
    statT: "T",
    statN: "N",
    statWE: "W.End",
    statV: "Vac",
    statTotal: "Shifts",
    statHours: "Hours",
    statBalance: "Balance",
    hoursTarget: "Target Hours/Month",
    hoursPerShift: "Hours per Shift",
    // Annual
    annualTitle: "Annual Planner",
    selectEmp: "Select Employee:",
    // Team Config
    rotationMode: "Rotation Mode",
    modeStandard: "Standard Rotation",
    modeFixedM: "Fixed Morning",
    modeFixedT: "Fixed Afternoon",
    modeFixedN: "Fixed Night",
    // Features
    saveFile: "Save File",
    loadFile: "Load File",
    resetData: "Reset Data",
    filters: "Filters",
    roleFilter: "Role",
    langFilter: "Language",
    shiftFilter: "Shift",
    sort: "Sort",
    sortDefault: "Default",
    sortAZ: "Name (A-Z)",
    sortZA: "Name (Z-A)",
    sortLang: "Languages",
    sortRole: "Role",
    all: "All",
    bulkActions: "Actions",
    planVacation: "Plan Vacation",
    startDateVac: "Start Date",
    endDateVac: "End Date",
    apply: "Apply",
    days: "days",
    close: "Close",
    // Permissions
    readOnly: "Read Only Mode",
    permissionDenied: "You do not have permission to edit.",
    loginRequired: "Authentication Required",
    selectUser: "Select Your Name",
    password: "Password",
    enterPass: "Enter Password",
    login: "Login",
    cancel: "Cancel",
    accessGranted: "Access Granted",
    invalidPass: "Invalid Password",
    userLoginDesc: "Please identify yourself to access Editor mode.",
    managerLoginDesc: "Please enter the administrative password.",
    loggedInAs: "Logged in as",
    changePass: "Change Password",
    newPass: "New Password",
    confirmPass: "Confirm Password",
    passChanged: "Password changed successfully!",
    defaultPassInfo: "Default password: '1234'",
    backToLogin: "Back to Login",
    passMismatch: "Passwords do not match",
    // Requests
    requests: "Requests",
    pendingRequests: "Pending Requests",
    noRequests: "No pending requests.",
    reqDesc: "wants to change",
    to: "to",
    approve: "Approve",
    reject: "Reject",
    requestSent: "Request sent for approval!",
    cantEditOthers: "You can only edit your own schedule!",
    pending: "Pending Approval",
    // Bulk
    bulkTitle: "Bulk Actions",
    bulkDesc: "Apply changes to date ranges",
    target: "Target",
    targetAll: "All Employees (Manager Only)",
    shiftType: "Shift Type",
    clearShifts: "Reset (Auto)",
    applyToAll: "Apply to Entire Team",
    warningBulk: "This will overwrite existing overrides!",
    bulkSuccess: "Bulk action applied successfully!",
    // Cloud
    saving: "Saving...",
    saved: "Saved to Cloud",
    offline: "Offline",
    loading: "Loading Data...",
  },
};

type LangCode = "en";

// --- DATA TYPES & CONFIGURATION ---

type ShiftType = "M" | "T" | "N" | "F";
type OverrideType = ShiftType | "V" | "S"; // V=Vacation, S=Sick
type Language = "EN" | "DE" | "IT" | "FR" | "PT" | "TR" | "ES";
type RotationMode = "STANDARD" | "FIXED_M" | "FIXED_T" | "FIXED_N";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

const ALL_LANGUAGES: Language[] = ["EN", "DE", "IT", "FR", "PT", "TR", "ES"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface RotationConfig {
  morningDays: number;
  afternoonDays: number;
  nightDays: number;
  nightOffs: number;
  autoAdjustOffs: boolean;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  languages: Language[];
  offset: number;
  rotationMode?: RotationMode;
  password?: string;
}

interface ShiftRequest {
  id: string;
  empId: number;
  empName: string;
  date: string; // ISO Date string
  newShift: OverrideType | undefined; // undefined means clear/reset
  status: RequestStatus;
  timestamp: number;
}

// Default Holidays
const DEFAULT_HOLIDAYS = [
  "2025-12-25",
  "2026-01-01",
  "2026-03-29",
  "2026-04-25",
  "2026-05-01",
  "2026-06-10",
  "2026-06-11",
  "2026-08-15",
  "2026-10-05",
  "2026-11-01",
  "2026-12-01",
  "2026-12-08",
  "2026-12-25",
];

const INITIAL_TEAM: Employee[] = [
  {
    id: 4,
    name: "Huyesin Gozcu",
    role: "GCC",
    languages: ["EN", "TR", "PT"],
    offset: 0,
    password: "1234",
  },
  {
    id: 6,
    name: "Lourdes Gutierrez",
    role: "GCC",
    languages: ["EN", "ES", "FR"],
    offset: 0,
    password: "1234",
  },
  {
    id: 3,
    name: "Halima Talbi",
    role: "Field Dispatch",
    languages: ["EN", "IT", "FR", "PT"],
    offset: 0,
    password: "1234",
  },
  {
    id: 5,
    name: "Jonas Teixeira",
    role: "Field Dispatch",
    languages: ["EN", "PT", "DE"],
    offset: 0,
    password: "1234",
  },
  {
    id: 12,
    name: "Marcio Anjos",
    role: "Remote Ops",
    languages: ["EN", "PT"],
    offset: 0,
    password: "1234",
  },
  {
    id: 11,
    name: "Manistha",
    role: "Field Dispatch",
    languages: ["EN", "FR"],
    offset: 0,
    password: "1234",
  },
  {
    id: 15,
    name: "Ariadne Machado",
    role: "GCC",
    languages: ["EN", "PT", "ES", "IT", "FR"],
    offset: 7,
    password: "1234",
  },
  {
    id: 13,
    name: "Sibel Durgut",
    role: "GCC",
    languages: ["EN", "TR", "PT"],
    offset: 7,
    password: "1234",
  },
  {
    id: 8,
    name: "Dilan Catalkaya",
    role: "Field Dispatch",
    languages: ["EN", "TR", "DE"],
    offset: 7,
    password: "1234",
  },
  {
    id: 17,
    name: "Ghilles Abdelkader",
    role: "Remote Ops",
    languages: ["EN", "FR", "PT"],
    offset: 7,
    password: "1234",
  },
  {
    id: 18,
    name: "Gulami",
    role: "GCC",
    languages: ["EN", "TR", "DE"],
    offset: 14,
    password: "1234",
  },
  {
    id: 19,
    name: "Susana Sanchez",
    role: "Field Dispatch",
    languages: ["EN", "ES", "FR", "PT", "IT"],
    offset: 14,
    password: "1234",
  },
  {
    id: 16,
    name: "Berk Yecel",
    role: "Field Dispatch",
    languages: ["EN", "TR", "DE"],
    offset: 14,
    password: "1234",
  },
  {
    id: 14,
    name: "Aleksandar Jovanovic",
    role: "Field Dispatch",
    languages: ["EN", "PT", "IT"],
    offset: 14,
    password: "1234",
  },
  {
    id: 9,
    name: "Francisco Praia",
    role: "Remote Ops",
    languages: ["EN", "PT"],
    offset: 14,
    password: "1234",
  },
  {
    id: 10,
    name: "Luca Esposito",
    role: "GCC",
    languages: ["EN", "ES", "IT", "FR", "PT"],
    offset: 36,
    password: "1234",
  },
  {
    id: 1,
    name: "Arinze Obijiaku",
    role: "Remote Ops",
    languages: ["EN"],
    offset: 5,
    password: "1234",
  },
  {
    id: 2,
    name: "Daniel Nolden",
    role: "GCC",
    languages: ["EN", "DE"],
    offset: 37,
    password: "1234",
  },
  {
    id: 7,
    name: "Simone Robustelli",
    role: "Remote Ops",
    languages: ["EN", "IT", "PT"],
    offset: 12,
    password: "1234",
  },
];

// --- LOGIC HELPERS ---

// Safe date key generator YYYY-MM-DD
const getDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const generatePattern = (config: RotationConfig): ShiftType[] => {
  const { morningDays, afternoonDays, nightDays, nightOffs } = config;
  const realNightOffs = nightOffs;

  const morningSeq = Array(morningDays).fill("M");
  const morningOffSeq = Array(morningDays < 5 ? 1 : 2).fill("F");
  const afternoonSeq = Array(afternoonDays).fill("T");
  const afternoonOffSeq = Array(afternoonDays < 5 ? 1 : 2).fill("F");
  const nightSeq = Array(nightDays).fill("N");

  const isAlternating = nightOffs === 3;

  if (isAlternating) {
    const cycleA = [
      ...morningSeq,
      ...morningOffSeq,
      ...afternoonSeq,
      ...afternoonOffSeq,
      ...nightSeq,
      ...Array(2).fill("F"),
    ];
    const cycleB = [
      ...morningSeq,
      ...morningOffSeq,
      ...afternoonSeq,
      ...afternoonOffSeq,
      ...nightSeq,
      ...Array(3).fill("F"),
    ];
    return [...cycleA, ...cycleB] as ShiftType[];
  } else {
    return [
      ...morningSeq,
      ...morningOffSeq,
      ...afternoonSeq,
      ...afternoonOffSeq,
      ...nightSeq,
      ...Array(realNightOffs).fill("F"),
    ] as ShiftType[];
  }
};

const getShiftForDate = (
  date: Date,
  offset: number,
  pattern: ShiftType[],
  startDate: Date
): ShiftType => {
  const diffTime = date.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "F";
  const position = (diffDays + offset) % pattern.length;
  return pattern[position];
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const checkRestViolation = (prev: ShiftType, curr: ShiftType): boolean => {
  if (prev === "T" && curr === "M") return true;
  if (prev === "N" && curr === "M") return true;
  if (prev === "N" && curr === "T") return true;
  return false;
};

// Check if employee has 6+ consecutive working days and return the range
const checkShiftOverflow = (
  shifts: OverrideType[],
  index: number
): { hasShiftOverflow: boolean; startIdx: number } => {
  // Find the start of the consecutive working days sequence
  let startIdx = index;
  while (startIdx > 0) {
    const shift = shifts[startIdx - 1];
    if (shift === "F" || shift === "V" || shift === "S") {
      break;
    }
    startIdx--;
  }

  // Count consecutive working days from start
  let count = 0;
  for (let i = startIdx; i < shifts.length; i++) {
    const shift = shifts[i];
    if (shift === "F" || shift === "V" || shift === "S") {
      break;
    }
    count++;
  }

  // Only trigger shift overflow if we have 6+ consecutive days and current day is within that range
  const hasShiftOverflow =
    count >= 6 && index >= startIdx && index < startIdx + count;

  return { hasShiftOverflow, startIdx };
};

// --- COMPONENTS ---

const RequestsModal = ({
  isOpen,
  onClose,
  requests,
  onApprove,
  onReject,
  t,
}: any) => {
  if (!isOpen) return null;

  const pending = requests
    .filter((r: ShiftRequest) => r.status === "PENDING")
    .sort((a: ShiftRequest, b: ShiftRequest) => b.timestamp - a.timestamp);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Inbox size={20} className="text-indigo-600" /> {t.pendingRequests}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {pending.length === 0 ? (
            <div className="text-center text-gray-500 py-8 flex flex-col items-center gap-2">
              <CheckCircle size={48} className="text-gray-200" />
              {t.noRequests}
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((req: ShiftRequest) => (
                <div
                  key={req.id}
                  className="border rounded-lg p-3 bg-white shadow-sm flex items-start gap-3"
                >
                  <div className="bg-yellow-100 text-yellow-700 p-2 rounded-full">
                    <Clock size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-800">
                        {req.empName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(req.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {t.reqDesc}{" "}
                      <span className="font-mono bg-gray-100 px-1 rounded">
                        {req.date}
                      </span>{" "}
                      {t.to} <strong>{req.newShift || "Auto"}</strong>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onApprove(req)}
                      className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      title={t.approve}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => onReject(req)}
                      className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      title={t.reject}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LoginModal = ({
  isOpen,
  onClose,
  targetRole,
  team,
  onLoginSuccess,
  onPasswordUpdate,
  t,
}: any) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (targetRole === "manager") {
      if (password === "Promocao2026!") {
        onLoginSuccess("manager", "Diretor", 0); // Manager ID 0
        onClose();
      } else {
        setError(t.invalidPass);
      }
    } else if (targetRole === "editor") {
      if (!selectedUser) {
        setError(t.selectUser);
        return;
      }
      const user = team.find((u: any) => u.id === +selectedUser);
      const userPass = user.password || "1234";
      if (password === userPass) {
        onLoginSuccess("editor", user.name, user.id); // Pass User ID
        onClose();
      } else {
        setError(t.invalidPass);
      }
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError(t.selectUser);
      return;
    }
    const user = team.find((u: any) => u.id === +selectedUser);
    const currentStoredPass = user.password || "1234";
    if (password !== currentStoredPass) {
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
    onPasswordUpdate(+selectedUser, newPassword);
    setSuccessMsg(t.passChanged);
    setIsChangeMode(false);
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
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

          {!isChangeMode ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {targetRole === "editor" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.selectUser}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="">-- Select your name --</option>
                      {team.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                    <Users
                      size={18}
                      className="absolute left-3 top-3.5 text-gray-400"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {targetRole === "manager" ? t.enterPass : t.password}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="••••••••"
                    autoFocus={targetRole === "manager"}
                  />
                  <KeyRound
                    size={18}
                    className="absolute left-3 top-3.5 text-gray-400"
                  />
                </div>
                {targetRole !== "manager" && (
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-gray-400 italic">
                      {t.defaultPassInfo}
                    </p>
                    {selectedUser && (
                      <button
                        type="button"
                        onClick={() => setIsChangeMode(true)}
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        {t.changePass}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg"
                >
                  {t.login}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded mb-4">
                Updating password for:{" "}
                <strong>
                  {team.find((u: any) => u.id === +selectedUser)?.name}
                </strong>
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

const BulkActionModal = ({
  isOpen,
  onClose,
  t,
  onApply,
  team,
  currentUser,
  preSelectedId,
}: any) => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [shiftType, setShiftType] = useState<OverrideType | "CLEAR">("V");
  const [selectedEmpId, setSelectedEmpId] = useState<string>(""); // '' = none, 'ALL' = all

  // Auto-select user logic
  useEffect(() => {
    if (isOpen) {
      if (preSelectedId) {
        setSelectedEmpId(preSelectedId);
      } else if (currentUser.role === "editor") {
        setSelectedEmpId(String(currentUser.id));
      } else {
        setSelectedEmpId("");
      }
      setStart("");
      setEnd("");
      setShiftType("V");
    }
  }, [isOpen, currentUser, preSelectedId]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (start && end && selectedEmpId) {
      const type = shiftType === "CLEAR" ? undefined : shiftType;
      onApply(selectedEmpId, start, end, type);
      onClose();
    }
  };

  const isManager = currentUser.role === "manager";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-indigo-900">
          <Layers size={24} className="text-indigo-600" /> {t.bulkTitle}
        </h3>
        <p className="text-sm text-gray-500 mb-6">{t.bulkDesc}</p>

        <div className="space-y-4">
          {/* Target Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t.target}
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              disabled={!isManager}
              className="w-full p-2 border rounded text-sm bg-white"
            >
              <option value="" disabled>
                -- Select Target --
              </option>
              {isManager && (
                <option value="ALL" className="font-bold text-indigo-700">
                  {t.targetAll}
                </option>
              )}
              {team.map((e: Employee) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.startDateVac}
              </label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.endDateVac}
              </label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
          </div>

          {/* Shift Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t.shiftType}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["M", "T", "N", "F"].map((s) => (
                <button
                  key={s}
                  onClick={() => setShiftType(s as any)}
                  className={`p-2 rounded border text-sm font-bold ${
                    shiftType === s
                      ? "bg-indigo-100 border-indigo-500 text-indigo-800"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => setShiftType("V")}
                className={`p-2 rounded border text-sm font-bold ${
                  shiftType === "V"
                    ? "bg-pink-100 border-pink-500 text-pink-800"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Vac
              </button>
              <button
                onClick={() => setShiftType("S")}
                className={`p-2 rounded border text-sm font-bold ${
                  shiftType === "S"
                    ? "bg-gray-200 border-gray-500 text-gray-800"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Sick
              </button>
              <button
                onClick={() => setShiftType("CLEAR")}
                className={`col-span-2 p-2 rounded border text-sm font-bold flex items-center justify-center gap-1 ${
                  shiftType === "CLEAR"
                    ? "bg-red-100 border-red-500 text-red-800"
                    : "bg-white text-red-500 hover:bg-red-50"
                }`}
              >
                <Eraser size={14} /> {t.clearShifts}
              </button>
            </div>
          </div>

          {selectedEmpId === "ALL" && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-center gap-2">
              <AlertTriangle size={16} /> {t.warningBulk}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
          >
            {t.close}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!start || !end || !selectedEmpId}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {t.apply}
          </button>
        </div>
      </div>
    </div>
  );
};

// ... (Other components AnnualViewModal, StatsModal, CellEditor, ConfigPanel remain similar)
const AnnualViewModal = ({
  isOpen,
  onClose,
  team,
  config,
  startDate,
  overrides,
  colors,
  t,
}: any) => {
  const [selectedEmpId, setSelectedEmpId] = useState<number>(team[0]?.id || 0);
  const [year, setYear] = useState(2026);
  if (!isOpen) return null;
  const emp = team.find((e: any) => e.id === +selectedEmpId);
  const rotationPattern = generatePattern(config);
  const renderMonth = (mIdx: number) => {
    const daysInM = new Date(year, mIdx + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInM; d++) {
      const date = new Date(year, mIdx, d);
      const dateStr = getDateKey(date); // FIXED
      const isOverride = overrides[`${emp.id}_${dateStr}`];
      let shift =
        isOverride ||
        getShiftForDate(date, emp.offset, rotationPattern, startDate);
      if (
        !isOverride &&
        emp.rotationMode &&
        emp.rotationMode !== "STANDARD" &&
        shift !== "F"
      ) {
        if (emp.rotationMode === "FIXED_M") shift = "M";
        if (emp.rotationMode === "FIXED_T") shift = "T";
        if (emp.rotationMode === "FIXED_N") shift = "N";
      }
      days.push(
        <div
          key={d}
          className="w-6 h-6 flex items-center justify-center text-[9px] border rounded-sm"
          style={{ backgroundColor: colors[shift] || "#fff" }}
          title={`${dateStr}: ${shift}`}
        >
          {shift !== "F" ? shift : ""}
        </div>
      );
    }
    return days;
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar size={20} /> {t.annualTitle}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 border-b flex gap-4 items-center bg-white">
          <label className="text-sm font-bold">{t.selectEmp}</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(+e.target.value)}
            className="border p-2 rounded text-sm w-64"
          >
            {team.map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2 items-center ml-4">
            <button
              onClick={() => setYear(year - 1)}
              className="p-1 border rounded hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold">{year}</span>
            <button
              onClick={() => setYear(year + 1)}
              className="p-1 border rounded hover:bg-gray-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-auto flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MONTHS.map((mName, idx) => (
              <div key={mName} className="border rounded p-2">
                <h4 className="font-bold text-sm mb-2 text-center bg-gray-50 rounded py-1">
                  {mName}
                </h4>
                <div className="flex flex-wrap gap-1 justify-center">
                  {renderMonth(idx)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
const StatsModal = ({ isOpen, onClose, data, t, hoursConfig }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <BarChart3 size={20} /> {t.statsTitle}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-auto flex-1 p-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2 border">{t.statName}</th>
                <th className="p-2 border text-center bg-green-50">
                  {t.statM}
                </th>
                <th className="p-2 border text-center bg-orange-50">
                  {t.statT}
                </th>
                <th className="p-2 border text-center bg-blue-50">{t.statN}</th>
                <th className="p-2 border text-center bg-purple-50">
                  {t.statWE}
                </th>
                <th className="p-2 border text-center bg-pink-50">{t.statV}</th>
                <th className="p-2 border text-center font-bold">
                  {t.statTotal}
                </th>
                <th className="p-2 border text-center bg-yellow-50 font-bold">
                  {t.statHours}
                </th>
                <th className="p-2 border text-center bg-gray-200 font-bold">
                  {t.statBalance}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row: any) => {
                const balance = row.Hours - hoursConfig.target;
                return (
                  <tr key={row.name} className="hover:bg-gray-50 border-b">
                    <td className="p-2 border font-medium">{row.name}</td>
                    <td className="p-2 border text-center">{row.M}</td>
                    <td className="p-2 border text-center">{row.T}</td>
                    <td className="p-2 border text-center">{row.N}</td>
                    <td className="p-2 border text-center font-bold text-purple-700">
                      {row.WE}
                    </td>
                    <td className="p-2 border text-center text-pink-600">
                      {row.V}
                    </td>
                    <td className="p-2 border text-center font-bold">
                      {row.Total}
                    </td>
                    <td className="p-2 border text-center bg-yellow-50 font-mono">
                      {row.Hours}h
                    </td>
                    <td
                      className={`p-2 border text-center font-bold font-mono ${
                        balance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {balance > 0 ? "+" : ""}
                      {balance}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t bg-gray-50 flex justify-between items-center text-xs text-gray-500">
          <span>
            Target: {hoursConfig.target}h/month | Values: M={hoursConfig.M}h, T=
            {hoursConfig.T}h, N={hoursConfig.N}h
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
const CellEditor = ({
  cell,
  onClose,
  onUpdate,
  legends,
  customColors,
}: any) => {
  const options: {
    id: OverrideType | "CLEAR";
    label: string;
    icon?: any;
    color: string;
  }[] = [
    { id: "M", label: `Morning (${legends.M})`, color: customColors.M },
    { id: "T", label: `Afternoon (${legends.T})`, color: customColors.T },
    { id: "N", label: `Night (${legends.N})`, color: customColors.N },
    { id: "F", label: "Day Off", color: customColors.F },
    {
      id: "V",
      label: "Vacation",
      icon: <Plane size={14} />,
      color: customColors.V,
    },
    {
      id: "S",
      label: "Sick Leave",
      icon: <Stethoscope size={14} />,
      color: customColors.S,
    },
    {
      id: "CLEAR",
      label: "Reset to Auto",
      icon: <Eraser size={14} />,
      color: "#ffffff",
    },
  ];

  // Lógica de deteção de fundo de ecrã
  // Se estiver nos últimos 350px do ecrã, abre para cima
  const isNearBottom = cell.y > window.innerHeight - 350;

  // cell.y é a parte de BAIXO da célula clicada.
  // Se abrirmos para cima, queremos que o fundo do popup fique acima do topo da célula.
  // Assumindo que a célula tem ~32px de altura:
  const bottomPosition = window.innerHeight - cell.y + 40;

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-xl border p-2 w-48 flex flex-col gap-1 animate-in fade-in zoom-in duration-200"
      style={{
        // Se estiver perto do fundo, usa 'bottom' para posicionar para cima
        // Se não, usa 'top' para posicionar para baixo (comportamento normal)
        top: isNearBottom ? undefined : cell.y + 10,
        bottom: isNearBottom ? bottomPosition : undefined,
        left: Math.min(cell.x, window.innerWidth - 200),
      }}
    >
      <div className="text-xs font-bold text-gray-500 mb-1 px-1 border-b pb-1">
        Edit: {cell.empName} <br /> {cell.date}
      </div>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => {
            onUpdate(cell.key, opt.id === "CLEAR" ? undefined : opt.id);
            onClose();
          }}
          className="flex items-center gap-2 p-2 text-xs rounded hover:bg-gray-100 text-left border transition-colors"
          style={{ borderLeftColor: opt.color, borderLeftWidth: 4 }}
        >
          {opt.icon || (
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: opt.color }}
            ></div>
          )}{" "}
          {opt.label}
        </button>
      ))}
      <div className="fixed inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};
const ConfigPanel = ({
  show,
  config,
  setConfig,
  startDateStr,
  setStartDateStr,
  team,
  setTeam,
  holidays,
  setHolidays,
  minStaff,
  setMinStaff,
  requiredLangs,
  setRequiredLangs,
  legends,
  setLegends,
  colors,
  setColors,
  weekendDays,
  setWeekendDays,
  lang,
  onReset,
  hoursConfig,
  setHoursConfig,
}: any) => {
  if (!show) return null;
  const t = TRANSLATIONS[lang as LangCode];
  const [newHoliday, setNewHoliday] = useState("");

  const handleAddHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      setHolidays([...holidays, newHoliday].sort());
      setNewHoliday("");
    }
  };

  const handleRemoveHoliday = (date: string) => {
    setHolidays(holidays.filter((h: string) => h !== date));
  };

  const handleLangToggle = (l: Language) => {
    if (requiredLangs.includes(l))
      setRequiredLangs(requiredLangs.filter((x: string) => x !== l));
    else setRequiredLangs([...requiredLangs, l]);
  };

  const handleWeekendToggle = (dayIndex: number) => {
    if (weekendDays.includes(dayIndex))
      setWeekendDays(weekendDays.filter((d: number) => d !== dayIndex));
    else setWeekendDays([...weekendDays, dayIndex]);
  };

  const updateEmp = (id: number, field: string, value: any) => {
    setTeam(team.map((t: any) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleLangChange = (empId: number, langStr: string) => {
    const langs = langStr
      .toUpperCase()
      .split(",")
      .map((l) => l.trim() as Language)
      .filter((l) => l);
    setTeam(
      team.map((t: any) => (t.id === empId ? { ...t, languages: langs } : t))
    );
  };

  // --- NEW FUNCTIONS: ADD/REMOVE EMPLOYEE ---
  const handleAddEmployee = () => {
    const newId =
      team.length > 0 ? Math.max(...team.map((e: any) => e.id)) + 1 : 1;
    const newEmp: Employee = {
      id: newId,
      name: "Novo Colaborador",
      role: "GCC",
      languages: ["EN"],
      offset: 0,
      password: "1234",
      rotationMode: "STANDARD",
    };
    setTeam([...team, newEmp]);
  };

  const handleRemoveEmployee = (id: number) => {
    if (window.confirm("Tem a certeza que quer remover este colaborador?")) {
      setTeam(team.filter((e: any) => e.id !== id));
    }
  };

  const getAutoOffs = (days: number) => (days < 5 ? 1 : 2);

  return (
    <div className="w-96 bg-white border-r overflow-y-auto p-4 shadow-inner z-10 animate-slide-in flex flex-col h-full print:hidden">
      <h3 className="font-bold mb-4 text-indigo-900 flex items-center gap-2">
        <Settings size={18} /> {t.configPanelTitle}
      </h3>

      {/* ... existing General Params section ... */}
      <div className="bg-gray-50 p-3 rounded mb-4 border space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase">
          {t.generalParams}
        </h4>
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            {t.startDate}
          </label>
          <input
            type="date"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
            className="w-full p-1 border rounded text-sm"
          />
        </div>
        <div className="border-t pt-2 mt-2">
          <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">
            <Calendar size={12} /> {t.holidaysSection}
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              className="flex-1 p-1 border rounded text-xs"
            />
            <button
              onClick={handleAddHoliday}
              className="bg-indigo-100 text-indigo-700 px-2 rounded hover:bg-indigo-200"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {holidays.map((h: string) => (
              <div
                key={h}
                className="flex justify-between items-center bg-white border px-2 py-1 rounded text-xs"
              >
                <span>{h}</span>
                <button
                  onClick={() => handleRemoveHoliday(h)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ... existing Rotation Pattern section ... */}
      <div className="bg-gray-50 p-3 rounded mb-4 border space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase">
          {t.rotationPattern}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-600">{t.daysM}</label>
            <input
              type="number"
              value={config.morningDays}
              onChange={(e) =>
                setConfig({ ...config, morningDays: +e.target.value })
              }
              className="w-full p-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-600">{t.offsM}</label>
            <input
              type="text"
              value={getAutoOffs(config.morningDays)}
              disabled
              className="w-full p-1 border rounded bg-gray-100 text-gray-500 text-center font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-600">{t.daysT}</label>
            <input
              type="number"
              value={config.afternoonDays}
              onChange={(e) =>
                setConfig({ ...config, afternoonDays: +e.target.value })
              }
              className="w-full p-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-600">{t.offsT}</label>
            <input
              type="text"
              value={getAutoOffs(config.afternoonDays)}
              disabled
              className="w-full p-1 border rounded bg-gray-100 text-gray-500 text-center font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-600">{t.daysN}</label>
            <input
              type="number"
              value={config.nightDays}
              onChange={(e) =>
                setConfig({ ...config, nightDays: +e.target.value })
              }
              className="w-full p-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-600 font-bold text-indigo-700">
              {t.offsN}
            </label>
            <input
              type="number"
              value={config.nightOffs}
              onChange={(e) =>
                setConfig({ ...config, nightOffs: +e.target.value })
              }
              className="w-full p-1 border rounded bg-white"
            />
          </div>
        </div>
      </div>

      {/* ... existing Coverage section ... */}
      <div className="bg-gray-50 p-3 rounded mb-4 border space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
          <ShieldAlert size={12} /> Coverage, Weekend & Hours
        </h4>
        <div>
          <label className="block text-[10px] font-bold text-gray-600 mb-1">
            {t.minStaffWarn}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[9px] block text-center">M</span>
              <input
                type="number"
                value={minStaff.M}
                onChange={(e) =>
                  setMinStaff({ ...minStaff, M: +e.target.value })
                }
                className="w-full p-1 border rounded text-center"
              />
            </div>
            <div>
              <span className="text-[9px] block text-center">T</span>
              <input
                type="number"
                value={minStaff.T}
                onChange={(e) =>
                  setMinStaff({ ...minStaff, T: +e.target.value })
                }
                className="w-full p-1 border rounded text-center"
              />
            </div>
            <div>
              <span className="text-[9px] block text-center">N</span>
              <input
                type="number"
                value={minStaff.N}
                onChange={(e) =>
                  setMinStaff({ ...minStaff, N: +e.target.value })
                }
                className="w-full p-1 border rounded text-center"
              />
            </div>
          </div>
        </div>
        <div className="border-t pt-2">
          <label className="block text-[10px] font-bold text-gray-600 mb-1">
            {t.weekendSection}
          </label>
          <div className="flex gap-1">
            {WEEKDAYS.map((day, idx) => (
              <button
                key={day}
                onClick={() => handleWeekendToggle(idx)}
                className={`text-[9px] px-1.5 py-1 rounded border ${
                  weekendDays.includes(idx)
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-500"
                }`}
              >
                {day.charAt(0)}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t pt-2">
          <label className="block text-[10px] font-bold text-gray-600 mb-1">
            {t.hoursPerShift}
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <span className="text-[9px] block text-center">M</span>
              <input
                type="number"
                value={hoursConfig.M}
                onChange={(e) =>
                  setHoursConfig({ ...hoursConfig, M: +e.target.value })
                }
                className="w-full p-1 border rounded text-center"
              />
            </div>
            <div>
              <span className="text-[9px] block text-center">T</span>
              <input
                type="number"
                value={hoursConfig.T}
                onChange={(e) =>
                  setHoursConfig({ ...hoursConfig, T: +e.target.value })
                }
                className="w-full p-1 border rounded text-center"
              />
            </div>
            <div>
              <span className="text-[9px] block text-center">N</span>
              <input
                type="number"
                value={hoursConfig.N}
                onChange={(e) =>
                  setHoursConfig({ ...hoursConfig, N: +e.target.value })
                }
                className="w-full p-1 border rounded text-center"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-600">
              {t.hoursTarget}
            </span>
            <input
              type="number"
              value={hoursConfig.target}
              onChange={(e) =>
                setHoursConfig({ ...hoursConfig, target: +e.target.value })
              }
              className="w-16 p-1 border rounded text-center"
            />
          </div>
        </div>
        <div className="border-t pt-2">
          <label className="block text-[10px] font-bold text-gray-600 mb-1">
            {t.langsSection}
          </label>
          <div className="flex flex-wrap gap-1">
            {ALL_LANGUAGES.map((lang) => (
              <label
                key={lang}
                className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded cursor-pointer border ${
                  requiredLangs.includes(lang)
                    ? "bg-indigo-100 border-indigo-300 text-indigo-800"
                    : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={requiredLangs.includes(lang)}
                  onChange={() => handleLangToggle(lang)}
                  className="hidden"
                />
                {lang}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ... existing Legends section ... */}
      <div className="bg-gray-50 p-3 rounded mb-4 border space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
          <Palette size={12} /> {t.legendsSection} & {t.colorsSection}
        </h4>
        <div className="space-y-2">
          {["M", "T", "N", "F", "V", "S"].map((type) => (
            <div key={type} className="flex items-center gap-2">
              <input
                type="color"
                value={colors[type]}
                onChange={(e) =>
                  setColors({ ...colors, [type]: e.target.value })
                }
                className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
              />
              <span className="text-xs font-bold w-4">{type}</span>
              {["M", "T", "N"].includes(type) && (
                <input
                  value={legends[type]}
                  onChange={(e) =>
                    setLegends({ ...legends, [type]: e.target.value })
                  }
                  className="flex-1 p-1 border rounded text-xs"
                />
              )}
              {["F", "V", "S"].includes(type) && (
                <span className="text-xs text-gray-500 flex-1">
                  {t[`leg${type}` as keyof typeof t]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase">
            {t.teamOffsets}
          </h4>
          <button
            onClick={handleAddEmployee}
            className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold border border-green-200 hover:bg-green-100"
          >
            <Plus size={12} /> Add
          </button>
        </div>

        <div className="space-y-3 pb-10">
          {team.map((emp: Employee) => (
            <div
              key={emp.id}
              className="p-3 border rounded bg-white shadow-sm text-xs relative group"
            >
              <button
                onClick={() => handleRemoveEmployee(emp.id)}
                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove"
              >
                <X size={14} />
              </button>

              <div className="flex gap-2 mb-2 pr-4">
                <input
                  className="font-bold flex-1 border-b focus:border-indigo-500 outline-none"
                  value={emp.name}
                  onChange={(e) => updateEmp(emp.id, "name", e.target.value)}
                  placeholder="Nome"
                />
                <input
                  className="w-10 text-center border rounded bg-gray-50"
                  title={t.offset}
                  type="number"
                  value={emp.offset}
                  onChange={(e) => updateEmp(emp.id, "offset", +e.target.value)}
                />
              </div>
              <div className="mb-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full border p-1 rounded"
                    value={emp.role}
                    onChange={(e) => updateEmp(emp.id, "role", e.target.value)}
                    placeholder="Cargo (ex: GCC)"
                  />
                  <input
                    className="w-full border p-1 rounded"
                    value={emp.languages.join(", ")}
                    onChange={(e) => handleLangChange(emp.id, e.target.value)}
                    placeholder="Línguas (ex: EN, PT)"
                  />
                </div>
                <select
                  value={emp.rotationMode || "STANDARD"}
                  onChange={(e) =>
                    updateEmp(emp.id, "rotationMode", e.target.value)
                  }
                  className="w-full border p-1 rounded bg-gray-50"
                >
                  <option value="STANDARD">{t.modeStandard}</option>
                  <option value="FIXED_M">{t.modeFixedM}</option>
                  <option value="FIXED_T">{t.modeFixedT}</option>
                  <option value="FIXED_N">{t.modeFixedN}</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 border-t sticky bottom-0 bg-white">
        <button
          onClick={onReset}
          className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded flex items-center justify-center gap-2 hover:bg-red-100"
        >
          <RefreshCw size={14} /> {t.resetData}
        </button>
      </div>
    </div>
  );
};

const ShiftScheduler = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(false); // NOVO: Estado para erro de inicialização
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "error" | "offline"
  >("offline");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 15));
  const [showConfig, setShowConfig] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAnnual, setShowAnnual] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [lang] = useState<LangCode>("en");
  const [editingCell, setEditingCell] = useState<{
    key: string;
    x: number;
    y: number;
    empName: string;
    date: string;
  } | null>(null);
  const [currentUser, setCurrentUser] = useState(ROLES.VIEWER);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<"manager" | "editor" | null>(
    null
  );
  const [loggedInName, setLoggedInName] = useState<string>("");
  const [loggedInUserId, setLoggedInUserId] = useState<number>(0);
  const [preSelectedBulkId, setPreSelectedBulkId] = useState<string>("");

  // Ref to prevent infinite loops between Firebase sync and local save
  const isRemoteUpdate = useRef(false);

  const canWrite = currentUser.permissions.includes("write");
  const canAccessSettings = currentUser.role === "manager" || canWrite;
  const isManager = currentUser.role === "manager";

  const [roleFilter, setRoleFilter] = useState("All");
  const [langFilter, setLangFilter] = useState("All");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("OFFSET");
  const [publishedOverrides, setPublishedOverrides] = useState<
    Record<string, OverrideType>
  >({});
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);

  // -- STATE VARIABLES (Initialized with defaults) --
  const [startDateStr, setStartDateStr] = useState("2025-12-15");
  const [holidays, setHolidays] = useState<string[]>(DEFAULT_HOLIDAYS);
  const [minStaff, setMinStaff] = useState({ M: 4, T: 4, N: 3 });
  const [requiredLangs, setRequiredLangs] = useState<Language[]>([
    "EN",
    "TR",
    "ES",
    "FR",
    "IT",
    "PT",
    "DE",
  ]);
  const [weekendDays, setWeekendDays] = useState<number[]>([0, 6]);
  const [legends, setLegends] = useState<any>({
    M: "07:00 - 16:00",
    T: "15:00 - 00:00",
    N: "23:00 - 08:00",
  });
  const [colors, setColors] = useState<any>({
    M: "#d1fae5",
    T: "#ffedd5",
    N: "#1e3a8a",
    F: "#f3f4f6",
    V: "#fbcfe8",
    S: "#e5e7eb",
  });
  const [overrides, setOverrides] = useState<Record<string, OverrideType>>({});

  // Track if manager has made changes since last publish
  useEffect(() => {
    if (
      isManager &&
      JSON.stringify(overrides) !== JSON.stringify(publishedOverrides)
    ) {
      setHasUnpublishedChanges(true);
    } else {
      setHasUnpublishedChanges(false);
    }
  }, [overrides, publishedOverrides, isManager]);

  const [config, setConfig] = useState<RotationConfig>({
    morningDays: 5,
    afternoonDays: 5,
    nightDays: 4,
    nightOffs: 2,
    autoAdjustOffs: true,
  });
  const [hoursConfig, setHoursConfig] = useState({
    M: 8,
    T: 8,
    N: 8,
    target: 160,
  });
  const [teamState, setTeamState] = useState<Employee[]>(INITIAL_TEAM);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);

  // --- FIREBASE INIT & SYNC ---
  useEffect(() => {
    if (!FIREBASE_CONFIG.apiKey) {
      console.warn("Firebase config missing. Running in offline mode.");
      setIsLoading(false);
      setSaveStatus("offline");
      return;
    }

    const app = initializeApp(FIREBASE_CONFIG);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const initAuth = async () => {
      await signInAnonymously(auth);
    };
    initAuth();

    const dataDocRef = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "shift_scheduler",
      "global_state"
    );

    const unsubscribe = onSnapshot(
      dataDocRef,
      (docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          // Mark this update as coming from the cloud to prevent immediate re-save
          isRemoteUpdate.current = true;

          const data = docSnap.data();
          if (data.startDateStr) setStartDateStr(data.startDateStr);
          if (data.holidays) setHolidays(data.holidays);
          if (data.minStaff) setMinStaff(data.minStaff);
          if (data.requiredLangs) setRequiredLangs(data.requiredLangs);
          if (data.weekendDays) setWeekendDays(data.weekendDays);
          if (data.legends) setLegends(data.legends);
          if (data.colors) setColors(data.colors);
          if (data.overrides) setOverrides(data.overrides);
          if (data.publishedOverrides)
            setPublishedOverrides(data.publishedOverrides);
          else if (data.overrides) setPublishedOverrides(data.overrides); // Fallback for old data
          if (data.config) setConfig(data.config);
          if (data.hoursConfig) setHoursConfig(data.hoursConfig);
          if (data.team) setTeamState(data.team);
          if (data.requests) setRequests(data.requests);

          setInitError(false); // Sucesso: Limpa erro
          setIsLoading(false);
          setSaveStatus("saved");
        } else {
          // Documento não existe (primeira vez ever), permite iniciar
          setInitError(false);
          setIsLoading(false);
        }
      },
      (error: FirestoreError) => {
        console.error("Firebase Read Error:", error);
        setSaveStatus("error");
        setInitError(true); // ERRO: Bloqueia a app para não gravar dados vazios
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // --- SAVE TO FIREBASE (Debounced) ---
  useEffect(() => {
    if (isLoading || initError) return; // TRAVA DE SEGURANÇA: Não grava se estiver a carregar ou se houve erro ao ler
    if (!FIREBASE_CONFIG.apiKey) return;

    // If the change came from a remote snapshot, reset the flag and DO NOT save back
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    setSaveStatus("saving");
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app);
    const dataDocRef = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "shift_scheduler",
      "global_state"
    );

    const saveData = async () => {
      try {
        await setDoc(dataDocRef, {
          startDateStr,
          holidays,
          minStaff,
          requiredLangs,
          weekendDays,
          legends,
          colors,
          overrides,
          publishedOverrides,
          config,
          hoursConfig,
          team: teamState,
          requests,
          lastUpdated: Date.now(),
        });
        setSaveStatus("saved");
      } catch (err) {
        console.error("Firebase Save Error:", err);
        setSaveStatus("error");
      }
    };

    const timer = setTimeout(saveData, 2000);
    return () => clearTimeout(timer);
  }, [
    startDateStr,
    holidays,
    minStaff,
    requiredLangs,
    weekendDays,
    legends,
    colors,
    overrides,
    config,
    hoursConfig,
    teamState,
    requests,
    isLoading,
  ]);

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data to defaults?")) {
      setStartDateStr("2025-12-15");
      setHolidays(DEFAULT_HOLIDAYS);
      setOverrides({});
      setPublishedOverrides({});
      setRequests([]);
      window.location.reload();
    }
  };

  const handlePublish = () => {
    setPublishedOverrides({ ...overrides });
    setHasUnpublishedChanges(false);
  };

  // Login Handling
  const initiateLogin = (roleKey: string) => {
    if (roleKey === "VIEWER") {
      setCurrentUser(ROLES.VIEWER);
      setLoggedInName("");
      setLoggedInUserId(0);
      setShowConfig(false);
      return;
    }
    setTargetRole(roleKey === "MANAGER" ? "manager" : "editor");
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = (
    role: "manager" | "editor",
    name: string,
    id: number
  ) => {
    if (role === "manager") {
      setCurrentUser(ROLES.MANAGER);
    } else {
      setCurrentUser(ROLES.EDITOR);
    }
    setLoggedInName(name);
    setLoggedInUserId(id);
  };

  const handlePasswordUpdate = (userId: number, newPass: string) => {
    setTeamState((prevTeam) =>
      prevTeam.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
  };

  // --- REQUEST LOGIC ---
  const handleApproveRequest = (req: ShiftRequest) => {
    setOverrides((prev) => {
      const next = { ...prev };
      const key = `${req.empId}_${req.date}`;
      if (req.newShift) next[key] = req.newShift;
      else delete next[key];
      return next;
    });
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: "APPROVED" } : r))
    );
  };

  const handleRejectRequest = (req: ShiftRequest) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: "REJECTED" } : r))
    );
  };

  // File Import/Export
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveFile = () => {
    const data = {
      version: 1,
      date: new Date().toISOString(),
      state: {
        startDateStr,
        holidays,
        minStaff,
        requiredLangs,
        weekendDays,
        legends,
        colors,
        overrides,
        config,
        hoursConfig,
        team: teamState,
        requests,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shift_scheduler_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.state) {
          const s = json.state;
          if (s.startDateStr) setStartDateStr(s.startDateStr);
          if (s.holidays) setHolidays(s.holidays);
          if (s.minStaff) setMinStaff(s.minStaff);
          if (s.requiredLangs) setRequiredLangs(s.requiredLangs);
          if (s.weekendDays) setWeekendDays(s.weekendDays);
          if (s.legends) setLegends(s.legends);
          if (s.colors) setColors(s.colors);

          if (s.overrides) {
            const normalizedOverrides: Record<string, OverrideType> = {};
            Object.entries(s.overrides).forEach(([key, val]) => {
              const [empId, rawDate] = key.split("_");
              const cleanDate = rawDate.includes("T")
                ? rawDate.split("T")[0]
                : rawDate;
              normalizedOverrides[`${empId}_${cleanDate}`] =
                val as OverrideType;
            });
            setOverrides(normalizedOverrides);
          }
          if (s.publishedOverrides) {
            const normalizedPublished: Record<string, OverrideType> = {};
            Object.entries(s.publishedOverrides).forEach(([key, val]) => {
              const [empId, rawDate] = key.split("_");
              const cleanDate = rawDate.includes("T")
                ? rawDate.split("T")[0]
                : rawDate;
              normalizedPublished[`${empId}_${cleanDate}`] =
                val as OverrideType;
            });
            setPublishedOverrides(normalizedPublished);
          }

          if (s.config) setConfig(s.config);
          if (s.hoursConfig) setHoursConfig(s.hoursConfig);
          if (s.team) setTeamState(s.team);
          if (s.requests) setRequests(s.requests);
          alert("Configuration loaded successfully!");
        }
      } catch (err) {
        alert("Error loading file. Invalid JSON.");
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const t = TRANSLATIONS[lang];
  const startDate = useMemo(() => new Date(startDateStr), [startDateStr]);
  const rotationPattern = useMemo(() => generatePattern(config), [config]);

  // Use publishedOverrides for non-managers, draftOverrides for managers
  const effectiveOverrides = isManager ? overrides : publishedOverrides;

  const filteredTeam = useMemo(() => {
    let result = teamState.filter((emp) => {
      const roleMatch = roleFilter === "All" || emp.role === roleFilter;
      const langMatch =
        langFilter === "All" || emp.languages.includes(langFilter as Language);

      let shiftMatch = true;
      if (shiftFilter !== "All") {
        // Get the current shift for this employee
        const dateKey = `${emp.id}_${startDateStr}`;
        const currentShift = effectiveOverrides[dateKey] || rotationPattern[0];
        shiftMatch = currentShift === shiftFilter;
      }

      return roleMatch && langMatch && shiftMatch;
    });

    if (sortOrder === "AZ") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === "ZA") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOrder === "LANG") {
      result.sort((a, b) =>
        a.languages.join("").localeCompare(b.languages.join(""))
      );
    } else if (sortOrder === "ROLE") {
      result.sort((a, b) => a.role.localeCompare(b.role));
    } else {
      result.sort((a, b) => a.offset - b.offset);
    }

    return result;
  }, [
    teamState,
    roleFilter,
    langFilter,
    shiftFilter,
    sortOrder,
    startDateStr,
    effectiveOverrides,
    rotationPattern,
  ]);

  const handleCellClick = (
    e: React.MouseEvent,
    empId: number,
    dateStr: string,
    empName: string
  ) => {
    if (!canWrite) return;
    if (currentUser.role === "editor" && empId !== loggedInUserId) {
      alert(t.cantEditOthers);
      return;
    }
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setEditingCell({
      key: `${empId}_${dateStr}`,
      x: rect.left,
      y: rect.bottom,
      empName,
      date: dateStr,
    });
  };

  const handleOverride = (key: string, value: OverrideType | undefined) => {
    if (!canWrite) return;
    if (isManager) {
      setOverrides((prev) => {
        const next = { ...prev };
        if (value) next[key] = value;
        else delete next[key];
        return next;
      });
      return;
    }
    const [empIdStr, dateStr] = key.split("_");
    const empId = parseInt(empIdStr);
    if (empId !== loggedInUserId) return;
    const empName = teamState.find((e) => e.id === empId)?.name || "Unknown";
    const newReq: ShiftRequest = {
      id: crypto.randomUUID(),
      empId,
      empName,
      date: dateStr,
      newShift: value,
      status: "PENDING",
      timestamp: Date.now(),
    };
    setRequests((prev) => [...prev, newReq]);
    alert(t.requestSent);
  };

  const handleBulkApply = (
    targetId: string | number,
    start: string,
    end: string,
    type: OverrideType | undefined
  ) => {
    if (!canWrite) return;
    const applyToEmp = (empId: number) => {
      const s = new Date(start);
      const e = new Date(end);
      const newOverrides = { ...overrides };
      const current = new Date(s);
      while (current <= e) {
        const dateStr = getDateKey(current);
        const key = `${empId}_${dateStr}`;
        if (type) newOverrides[key] = type;
        else delete newOverrides[key];
        current.setDate(current.getDate() + 1);
      }
      return newOverrides;
    };

    if (typeof targetId === "number" || !isNaN(Number(targetId))) {
      const empId = Number(targetId);
      if (!isManager && empId !== loggedInUserId) {
        alert(t.cantEditOthers);
        return;
      }
      setOverrides(applyToEmp(empId));
      alert(t.bulkSuccess);
    } else if (targetId === "ALL") {
      if (!isManager) {
        alert(t.permissionDenied);
        return;
      }
      let batchOverrides = { ...overrides };
      teamState.forEach((emp) => {
        const s = new Date(start);
        const e = new Date(end);
        const current = new Date(s);
        while (current <= e) {
          const dateStr = getDateKey(current);
          const key = `${emp.id}_${dateStr}`;
          if (type) batchOverrides[key] = type;
          else delete batchOverrides[key];
          current.setDate(current.getDate() + 1);
        }
      });
      setOverrides(batchOverrides);
      alert(t.bulkSuccess);
    }
  };

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const days = [];
    const locale = "en-GB";

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = getDateKey(dateObj);
      const isWeekend = weekendDays.includes(dateObj.getDay());
      const isPtHoliday = holidays.includes(dateStr);

      const shifts: Record<string, OverrideType> = {};
      const pendingReqs: Record<string, boolean> = {};
      const coverage = {
        M: new Set<Language>(),
        T: new Set<Language>(),
        N: new Set<Language>(),
      };
      const counts = { M: 0, T: 0, N: 0 };

      teamState.forEach((emp) => {
        const overrideKey = `${emp.id}_${dateStr}`;
        let shift: OverrideType;
        const hasPending = requests.some(
          (r) =>
            r.empId === emp.id && r.date === dateStr && r.status === "PENDING"
        );
        pendingReqs[emp.id] = hasPending;

        if (effectiveOverrides[overrideKey]) {
          shift = effectiveOverrides[overrideKey];
        } else {
          shift = getShiftForDate(
            dateObj,
            emp.offset,
            rotationPattern,
            startDate
          );
        }

        if (
          !effectiveOverrides[overrideKey] &&
          emp.rotationMode &&
          emp.rotationMode !== "STANDARD" &&
          shift !== "F"
        ) {
          if (emp.rotationMode === "FIXED_M") shift = "M";
          if (emp.rotationMode === "FIXED_T") shift = "T";
          if (emp.rotationMode === "FIXED_N") shift = "N";
        }
        shifts[emp.id] = shift;
        if (["M", "T", "N"].includes(shift)) {
          emp.languages.forEach((lang) =>
            coverage[shift as "M" | "T" | "N"].add(lang)
          );
          counts[shift as "M" | "T" | "N"]++;
        }
      });

      const missing = {
        M: requiredLangs.filter((l) => !coverage.M.has(l)),
        T: requiredLangs.filter((l) => !coverage.T.has(l)),
        N: requiredLangs.filter((l) => !coverage.N.has(l)),
      };
      const lowStaff = {
        M: counts.M < minStaff.M,
        T: counts.T < minStaff.T,
        N: counts.N < minStaff.N,
      };

      days.push({
        date: d,
        fullDate: dateStr,
        weekDay: dateObj
          .toLocaleDateString(locale, { weekday: "short" })
          .slice(0, 3),
        isWeekend,
        isPtHoliday,
        shifts,
        missing,
        lowStaff,
        counts,
        pendingReqs,
        hasIssues:
          missing.M.length > 0 ||
          missing.T.length > 0 ||
          missing.N.length > 0 ||
          lowStaff.M ||
          lowStaff.T ||
          lowStaff.N,
      });
    }
    return days;
  }, [
    currentDate,
    teamState,
    rotationPattern,
    startDate,
    holidays,
    minStaff,
    requiredLangs,
    weekendDays,
    effectiveOverrides,
    requests,
  ]);

  const statsData = useMemo(() => {
    return filteredTeam.map((emp) => {
      let m = 0,
        tCount = 0,
        n = 0,
        we = 0,
        v = 0,
        total = 0,
        hours = 0;
      calendarData.forEach((day) => {
        const s = day.shifts[emp.id];
        if (s === "M") {
          m++;
          hours += hoursConfig.M;
        }
        if (s === "T") {
          tCount++;
          hours += hoursConfig.T;
        }
        if (s === "N") {
          n++;
          hours += hoursConfig.N;
        }
        if (s === "V") v++;
        if (["M", "T", "N"].includes(s)) {
          total++;
          if (day.isWeekend) we++;
        }
      });
      return {
        name: emp.name,
        M: m,
        T: tCount,
        N: n,
        WE: we,
        V: v,
        Total: total,
        Hours: hours,
      };
    });
  }, [calendarData, filteredTeam, hoursConfig]);

  const handlePrevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  const handleNextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );

  // Get weeks that contain at least one shift (for print filtering)
  const weeksWithShifts = useMemo(() => {
    const weeks: Set<number> = new Set();
    calendarData.forEach((day, idx) => {
      const hasShift = filteredTeam.some((emp) => {
        const shift = day.shifts[emp.id];
        return ["M", "T", "N"].includes(shift);
      });
      if (hasShift) {
        const weekStart = idx - (idx % 7); // Get Monday of the week
        weeks.add(weekStart);
      }
    });
    return weeks;
  }, [calendarData, filteredTeam]);

  const handleExportCSV = () => {
    const headers = [
      t.colaborador,
      t.cargo,
      t.linguas,
      ...calendarData.map((d) => `${d.date}/${d.weekDay}`),
    ];
    const rows = filteredTeam.map((emp) => [
      emp.name,
      emp.role,
      emp.languages.join(" "),
      ...calendarData.map((d) =>
        d.shifts[emp.id] === "F" ? "F" : d.shifts[emp.id]
      ),
    ]);
    rows.push([]);
    rows.push([t.analise.toUpperCase(), t.analiseDesc]);
    ["M", "T", "N"].forEach((shiftCode) => {
      const shiftName =
        shiftCode === "M" ? t.manha : shiftCode === "T" ? t.tarde : t.noite;
      const rowLabel = `${t.faltas}: ${shiftName}`;
      const analysisCells = calendarData.map((day) => {
        const missing = day.missing[shiftCode as "M" | "T" | "N"];
        const isLowStaff = day.lowStaff[shiftCode as "M" | "T" | "N"];
        const issues = [];
        if (missing.length > 0) issues.push(`Missing: ${missing.join(",")}`);
        if (isLowStaff) issues.push(t.lowStaff);
        return issues.length > 0 ? issues.join(" | ") : "OK";
      });
      rows.push([rowLabel, "", "", ...analysisCells]);
    });
    rows.push([]);
    rows.push([t.legend]);
    rows.push(["M", `${t.legM} (${legends.M})`]);
    rows.push(["T", `${t.legT} (${legends.T})`]);
    rows.push(["N", `${t.legN} (${legends.N})`]);
    rows.push(["F", t.legF]);
    rows.push(["V", t.legV]);
    rows.push(["S", t.legS]);
    let csvContent = "\uFEFF" + headers.join(";") + "\n";
    rows.forEach((row) => (csvContent += row.join(";") + "\n"));
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Schedule_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getShiftStyle = (s: OverrideType) => {
    const bg = colors[s] || "#fff";
    const text = s === "N" ? "#fff" : "#000";
    return {
      backgroundColor: bg,
      color: text,
      borderColor: s === "N" ? "transparent" : "rgba(0,0,0,0.1)",
    };
  };

  const handleExportImage = async (format: "png" | "jpeg") => {
    try {
      // Dynamically import html2canvas
      // @ts-ignore
      const html2canvas = (await import("html2canvas")).default;

      const element = document.querySelector("table");
      if (!element) {
        alert("Could not find table to export");
        return;
      }

      // Temporarily set print mode to filter out weeks without shifts
      document.body.classList.add("print-mode");

      // Wait a bit for the DOM to update
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
          });

          const link = document.createElement("a");
          link.href = canvas.toDataURL(
            `image/${format === "jpeg" ? "jpeg" : "png"}`
          );
          link.download = `schedule_${
            currentDate.getMonth() + 1
          }_${currentDate.getFullYear()}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          console.error("Error exporting image:", err);
          alert("Error exporting image");
        } finally {
          document.body.classList.remove("print-mode");
        }
      }, 100);
    } catch (err) {
      console.error("Error loading html2canvas:", err);
      alert(
        "Please ensure html2canvas library is installed. Run: npm install html2canvas"
      );
    }
  };

  const monthLabel = currentDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const roles = useMemo(
    () => Array.from(new Set(teamState.map((e) => e.role))),
    [teamState]
  );
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  if (initError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-red-50 text-red-900 p-4 text-center">
        <ShieldAlert className="w-16 h-16 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Erro de Sincronização</h2>
        <p className="max-w-md mb-6">
          Não foi possível carregar os dados mais recentes da Cloud. Para
          proteger o horário de ser apagado, o modo de edição foi bloqueado.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-lg flex items-center gap-2"
        >
          <RefreshCw size={20} /> Tentar Novamente
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-700">{t.loading}</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-sm font-sans relative overflow-hidden print:overflow-visible print:bg-white print:h-auto">
      <style>{`
        @media print { 
          @page { size: landscape; margin: 10mm; } 
          .print\\:hidden { display: none !important; } 
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-shift-week { display: none !important; }
        }
      `}</style>

      {/* --- BARRA DE PERMISSÕES & CLOUD --- */}
      <div className="bg-slate-900 text-white p-2 shadow-lg z-30 print:hidden flex justify-between items-center px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-xs uppercase tracking-wide">
              Access Mode:
            </span>
          </div>
          <div className="flex bg-slate-800 rounded-lg p-0.5 gap-1">
            {Object.keys(ROLES).map((key) => {
              const role = ROLES[key as keyof typeof ROLES];
              const isActive = currentUser.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => !isActive && initiateLogin(key)}
                  disabled={isActive}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm cursor-default"
                      : "text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {role.id === "viewer" && <Eye size={12} />}
                  {role.id === "editor" && <Edit3 size={12} />}
                  {role.id === "manager" && <Shield size={12} />}
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Cloud Status */}
          <div
            className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${
              saveStatus === "saved"
                ? "bg-green-900/30 border-green-700 text-green-300"
                : saveStatus === "saving"
                ? "bg-yellow-900/30 border-yellow-700 text-yellow-300"
                : "bg-red-900/30 border-red-700 text-red-300"
            }`}
          >
            {saveStatus === "saved" && <Cloud size={14} />}
            {saveStatus === "saving" && (
              <RefreshCw size={14} className="animate-spin" />
            )}
            {saveStatus === "error" && <CloudOff size={14} />}
            {saveStatus === "saved"
              ? t.saved
              : saveStatus === "saving"
              ? t.saving
              : t.offline}
          </div>

          {loggedInName && (
            <div className="text-xs text-emerald-300 flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              <span className="text-slate-400">{t.loggedInAs}:</span>
              <span className="font-bold text-white">{loggedInName}</span>
            </div>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        targetRole={targetRole}
        team={teamState}
        onLoginSuccess={handleLoginSuccess}
        onPasswordUpdate={handlePasswordUpdate}
        t={t}
      />

      <RequestsModal
        isOpen={showRequests}
        onClose={() => setShowRequests(false)}
        requests={requests}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        t={t}
      />

      <BulkActionModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        t={t}
        team={teamState}
        currentUser={currentUser}
        preSelectedId={preSelectedBulkId}
        onApply={handleBulkApply}
      />

      {editingCell && (
        <CellEditor
          cell={editingCell}
          onClose={() => setEditingCell(null)}
          onUpdate={handleOverride}
          legends={legends}
          customColors={colors}
        />
      )}

      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        data={statsData}
        t={t}
        hoursConfig={hoursConfig}
      />
      <AnnualViewModal
        isOpen={showAnnual}
        onClose={() => setShowAnnual(false)}
        team={teamState}
        config={config}
        startDate={startDate}
        holidays={holidays}
        overrides={overrides}
        colors={colors}
        t={t}
      />

      {/* Header */}
      <div className="bg-white border-b flex flex-col shadow-sm sticky top-0 z-20 print:hidden">
        {/* Top Row: Title & Actions */}
        <div className="px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{t.title}</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>
                {t.start}: {startDateStr}
              </span>
              <span className="text-gray-300">|</span>
              <span>
                {t.pattern}: {config.morningDays}M-
                {config.morningDays < 5 ? 1 : 2}F-{config.afternoonDays}T-
                {config.afternoonDays < 5 ? 1 : 2}F-{config.nightDays}N-
                {config.nightOffs === 3 ? "2/3" : config.nightOffs}F
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* MANAGER INBOX BUTTON */}
            {isManager && (
              <button
                onClick={() => setShowRequests(true)}
                className="flex items-center px-3 py-2 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition border border-orange-200 relative mr-2"
                title={t.requests}
              >
                <Inbox size={16} className="mr-2" />
                Requests
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {/* BULK ACTIONS BUTTON (Visible if can write) */}
            {canWrite && (
              <button
                onClick={() => {
                  setPreSelectedBulkId("");
                  setShowBulkModal(true);
                }}
                className="flex items-center px-3 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition border border-purple-200 mr-2"
                title={t.bulkTitle}
              >
                <Layers size={16} className="mr-2" />
                {t.bulkActions}
              </button>
            )}

            {isManager && (
              <div className="flex items-center bg-gray-100 rounded p-1 mr-2">
                <button
                  onClick={handleSaveFile}
                  className="p-2 hover:bg-white rounded text-gray-600"
                  title={t.saveFile}
                >
                  <FileJson size={16} />
                </button>
                <label
                  className="p-2 hover:bg-white rounded text-gray-600 cursor-pointer"
                  title={t.loadFile}
                >
                  <Upload size={16} />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLoadFile}
                    className="hidden"
                    accept=".json"
                  />
                </label>
              </div>
            )}

            <button
              onClick={() => setShowAnnual(true)}
              className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition border border-blue-200"
            >
              <Calendar size={16} className="mr-2" /> {t.annual}
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition border border-indigo-200"
            >
              <BarChart3 size={16} className="mr-2" /> {t.stats}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition border border-green-200"
            >
              <Download size={16} className="mr-2" /> {t.exportCsv}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center px-3 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition border border-gray-200"
            >
              <Printer size={16} className="mr-2" /> {t.print}
            </button>
            <button
              onClick={() => handleExportImage("png")}
              className="flex items-center px-3 py-2 bg-sky-50 text-sky-700 rounded hover:bg-sky-100 transition border border-sky-200"
              title="Export as PNG"
            >
              <Download size={16} className="mr-2" /> PNG
            </button>
            <button
              onClick={() => handleExportImage("jpeg")}
              className="flex items-center px-3 py-2 bg-rose-50 text-rose-700 rounded hover:bg-rose-100 transition border border-rose-200"
              title="Export as JPEG"
            >
              <Download size={16} className="mr-2" /> JPEG
            </button>

            {isManager && (
              <button
                onClick={handlePublish}
                disabled={!hasUnpublishedChanges}
                className={`flex items-center px-3 py-2 rounded transition border ${
                  hasUnpublishedChanges
                    ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 cursor-pointer"
                    : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
                title={
                  hasUnpublishedChanges
                    ? "Publish schedule to viewers"
                    : "No unpublished changes"
                }
              >
                <Upload size={16} className="mr-2" />
                Publish{" "}
                {hasUnpublishedChanges && (
                  <span className="ml-1 font-bold">*</span>
                )}
              </button>
            )}

            {canAccessSettings ? (
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`flex items-center px-3 py-2 rounded transition ${
                  showConfig
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Settings size={16} className="mr-2" /> {t.config}
              </button>
            ) : (
              <div
                className="flex items-center px-3 py-2 rounded bg-gray-50 text-gray-300 cursor-not-allowed border border-transparent"
                title={t.permissionDenied}
              >
                <Lock size={16} className="mr-2" /> {t.config}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Filters & Nav */}
        <div className="px-6 py-2 bg-gray-50 border-t flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Filter size={14} />
              <span className="font-bold">{t.filters}:</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border rounded p-1"
            >
              <option value="All">{t.all} Roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="text-xs border rounded p-1"
            >
              <option value="All">{t.all} Languages</option>
              {ALL_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="text-xs border rounded p-1"
            >
              <option value="All">{t.all} Shifts</option>
              <option value="M">Morning (M)</option>
              <option value="T">Afternoon (T)</option>
              <option value="N">Night (N)</option>
            </select>

            <div className="flex items-center gap-2 text-xs text-gray-600 ml-4 border-l pl-4">
              {sortOrder === "OFFSET" && (
                <ArrowDownAZ size={14} className="text-gray-400" />
              )}
              {sortOrder === "AZ" && (
                <ArrowDownAZ size={14} className="text-indigo-600" />
              )}
              {sortOrder === "ZA" && (
                <ArrowDownZA size={14} className="text-indigo-600" />
              )}
              {sortOrder === "LANG" && (
                <LangIcon size={14} className="text-indigo-600" />
              )}
              {sortOrder === "ROLE" && (
                <Briefcase size={14} className="text-indigo-600" />
              )}
              <span className="font-bold">{t.sort}:</span>
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="text-xs border rounded p-1"
            >
              <option value="OFFSET">{t.sortDefault}</option>
              <option value="AZ">{t.sortAZ}</option>
              <option value="ZA">{t.sortZA}</option>
              <option value="LANG">{t.sortLang}</option>
              <option value="ROLE">{t.sortRole}</option>
            </select>
          </div>

          <div className="flex items-center bg-white border rounded-lg shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-l-lg"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-4 font-semibold w-32 text-center text-xs flex items-center justify-center gap-2">
              <Calendar size={14} />
              {monthLabel}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-r-lg"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        <ConfigPanel
          show={showConfig}
          config={config}
          setConfig={setConfig}
          startDateStr={startDateStr}
          setStartDateStr={setStartDateStr}
          team={teamState}
          setTeam={setTeamState}
          holidays={holidays}
          setHolidays={setHolidays}
          minStaff={minStaff}
          setMinStaff={setMinStaff}
          requiredLangs={requiredLangs}
          setRequiredLangs={setRequiredLangs}
          legends={legends}
          setLegends={setLegends}
          colors={colors}
          setColors={setColors}
          weekendDays={weekendDays}
          setWeekendDays={setWeekendDays}
          lang={lang}
          onReset={handleReset}
          hoursConfig={hoursConfig}
          setHoursConfig={setHoursConfig}
        />

        <div className="flex-1 overflow-auto print:overflow-visible">
          <div className="hidden print:block mb-4">
            <h1 className="text-2xl font-bold">
              {t.printTitle} - {monthLabel}
            </h1>
            <p className="text-sm text-gray-500">
              {t.generatedOn} {new Date().toLocaleDateString("en-GB")}
            </p>
          </div>

          <table className="w-full border-collapse text-xs print:text-[8px]">
            <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm print:static">
              <tr>
                <th className="p-3 text-left border-b border-r min-w-[200px] bg-gray-50 sticky left-0 z-20 shadow-sm print:static print:bg-white print:border-black">
                  <div className="flex items-center gap-2">
                    {t.colaborador}
                    {sortOrder === "AZ" && (
                      <ArrowDownAZ
                        size={14}
                        className="text-indigo-600 ml-1 print:hidden"
                      />
                    )}
                    {sortOrder === "ZA" && (
                      <ArrowDownZA
                        size={14}
                        className="text-indigo-600 ml-1 print:hidden"
                      />
                    )}
                    {sortOrder === "OFFSET" && (
                      <ArrowDownAZ
                        size={14}
                        className="text-gray-400 ml-1 print:hidden"
                      />
                    )}
                    {sortOrder === "LANG" && (
                      <LangIcon
                        size={14}
                        className="text-indigo-600 ml-1 print:hidden"
                      />
                    )}
                    {sortOrder === "ROLE" && (
                      <Briefcase
                        size={14}
                        className="text-indigo-600 ml-1 print:hidden"
                      />
                    )}
                  </div>
                </th>
                {calendarData.map((day, dIdx) => {
                  const weekStart = dIdx - (dIdx % 7);
                  const isWeekWithShift = weeksWithShifts.has(weekStart);
                  return (
                    <th
                      key={day.date}
                      className={`p-1 border-b border-r min-w-[30px] text-center relative ${
                        !isWeekWithShift ? "no-shift-week" : ""
                      } ${
                        day.isWeekend ? "bg-indigo-50 print:bg-gray-100" : ""
                      } ${
                        day.isPtHoliday ? "bg-red-50 print:bg-gray-200" : ""
                      } print:border-black`}
                    >
                      <div className="text-xs font-bold text-gray-700 print:text-black">
                        {day.date}
                      </div>
                      <div className="text-[9px] text-gray-500 uppercase print:text-black">
                        {day.weekDay}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredTeam.map((emp) => {
                let prevShift: ShiftType | null = null;
                // Visual Dimming for Editor if not their row
                const isMyRow = loggedInUserId === emp.id;
                const isDimmed = currentUser.role === "editor" && !isMyRow;

                // Get all shifts for this employee for overflow check
                const empShifts = calendarData.map((day) => day.shifts[emp.id]);

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors print:break-inside-avoid ${
                      isDimmed ? "opacity-50 grayscale" : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="p-2 border-b border-r bg-white sticky left-0 z-10 shadow-sm print:static print:border-black print:shadow-none group">
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-gray-800 print:text-black">
                          {emp.name}
                        </div>

                        {/* Only show per-row bulk action if manager (kept for quick access) */}
                        {isManager && (
                          <button
                            onClick={() => {
                              setPreSelectedBulkId(String(emp.id));
                              setShowBulkModal(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-500 print:hidden transition-opacity"
                            title={t.bulkActions}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 flex flex-wrap gap-1 print:hidden">
                        {emp.role}{" "}
                        <span className="text-indigo-600 font-mono">
                          [{emp.languages.join(" ")}]
                        </span>
                        {emp.rotationMode &&
                          emp.rotationMode !== "STANDARD" && (
                            <span className="text-orange-600 font-bold ml-1">
                              ({emp.rotationMode.replace("FIXED_", "")})
                            </span>
                          )}
                      </div>
                    </td>
                    {calendarData.map((day, dIdx) => {
                      const shift = day.shifts[emp.id];
                      const weekStart = dIdx - (dIdx % 7);
                      const isWeekWithShift = weeksWithShifts.has(weekStart);
                      const isRestViolation =
                        dIdx > 0 &&
                        checkRestViolation(
                          prevShift as ShiftType,
                          shift as ShiftType
                        );
                      const shiftOverflowInfo = checkShiftOverflow(
                        empShifts,
                        dIdx
                      );
                      const isPending = day.pendingReqs[emp.id]; // Check for pending
                      prevShift = shift as ShiftType;

                      const canClick = canWrite && (isManager || isMyRow);

                      return (
                        <td
                          key={day.date}
                          onClick={(e) =>
                            handleCellClick(e, emp.id, day.fullDate, emp.name)
                          }
                          className={`
                            border-b border-r p-0.5 text-center transition print:cursor-default relative
                            ${!isWeekWithShift ? "no-shift-week" : ""}
                            ${
                              canClick
                                ? "cursor-pointer hover:opacity-80"
                                : "cursor-not-allowed"
                            }
                          `}
                        >
                          <div
                            className={`
                              w-full h-8 rounded flex items-center justify-center text-xs font-bold shadow-sm print:shadow-none print:rounded-none border 
                              ${
                                shiftOverflowInfo.hasShiftOverflow
                                  ? "ring-2 ring-red-500 z-10"
                                  : isRestViolation
                                  ? "ring-2 ring-orange-500 z-10"
                                  : ""
                              }
                              ${
                                isPending
                                  ? "opacity-70 ring-2 ring-yellow-400 border-yellow-500 border-dashed"
                                  : ""
                              }
                            `}
                            style={getShiftStyle(shift)}
                            title={
                              shiftOverflowInfo.hasShiftOverflow
                                ? "ShiftOverflow (>40h)"
                                : isPending
                                ? t.pending
                                : isRestViolation
                                ? t.restWarn
                                : ""
                            }
                          >
                            {isPending && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                                <Clock size={14} className="text-gray-700" />
                              </div>
                            )}
                            {shift === "F" ? "" : shift}
                            {shiftOverflowInfo.hasShiftOverflow &&
                              !isPending && (
                                <AlertCircle
                                  size={10}
                                  className="absolute top-0 right-0 text-red-600 bg-white rounded-full"
                                />
                              )}
                            {isRestViolation &&
                              !isPending &&
                              !shiftOverflowInfo.hasShiftOverflow && (
                                <AlertCircle
                                  size={10}
                                  className="absolute top-0 right-0 text-orange-600 bg-white rounded-full"
                                />
                              )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* Analysis Rows (Only visible to manager or full desktop) - NOW VISIBLE IN PRINT */}
              <tr className="bg-gray-800 text-white font-bold print:bg-gray-200 print:text-black print:border-t-2 print:border-black">
                <td className="p-2 border-r sticky left-0 bg-gray-800 z-10 shadow-sm print:static print:bg-transparent">
                  {t.analise}
                </td>
                <td
                  colSpan={calendarData.length}
                  className="p-2 text-xs font-normal"
                >
                  {t.analiseDesc}
                </td>
              </tr>
              {["M", "T", "N"].map((shiftCode) => (
                <tr key={shiftCode} className="bg-gray-50 print:bg-white">
                  <td className="p-2 border-b border-r font-bold text-gray-600 sticky left-0 bg-gray-50 z-10 shadow-sm print:static print:bg-transparent print:text-black print:border-black">
                    {t.faltas}:{" "}
                    {shiftCode === "M"
                      ? t.manha
                      : shiftCode === "T"
                      ? t.tarde
                      : t.noite}
                  </td>
                  {calendarData.map((day) => {
                    const missing = day.missing[shiftCode as "M" | "T" | "N"];
                    const isLowStaff =
                      day.lowStaff[shiftCode as "M" | "T" | "N"];
                    const hasErr = missing.length > 0 || isLowStaff;
                    return (
                      <td
                        key={day.date}
                        className={`border-b border-r p-1 text-center text-[10px] ${
                          hasErr ? "bg-red-100 print:bg-gray-100" : ""
                        } print:border-black`}
                      >
                        {hasErr ? (
                          <div className="text-red-600 font-bold flex flex-col items-center justify-center h-full group relative cursor-help print:text-black">
                            <AlertTriangle
                              size={12}
                              className="mb-1 print:text-black"
                            />
                            <span className="print:text-[8px]">
                              {missing.join(",")}
                            </span>
                            {isLowStaff && (
                              <span className="text-[8px] whitespace-nowrap">
                                {t.lowStaff}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-green-300 print:text-gray-300">
                            <CheckCircle size={12} />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="hidden print:block mt-8 border-t pt-4">
            <h3 className="font-bold text-sm mb-2 uppercase">{t.legend}</h3>
            <div className="grid grid-cols-6 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border text-center font-bold"
                  style={getShiftStyle("M")}
                >
                  M
                </div>
                <span>
                  {t.legM} ({legends.M})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border text-center font-bold"
                  style={getShiftStyle("T")}
                >
                  T
                </div>
                <span>
                  {t.legT} ({legends.T})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border text-center font-bold"
                  style={getShiftStyle("N")}
                >
                  N
                </div>
                <span>
                  {t.legN} ({legends.N})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border bg-gray-100"></div>
                <span>{t.legF}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border text-center font-bold"
                  style={getShiftStyle("V")}
                >
                  V
                </div>
                <span>{t.legV}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border text-center font-bold"
                  style={getShiftStyle("S")}
                >
                  S
                </div>
                <span>{t.legS}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftScheduler;
