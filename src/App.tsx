import React, { useState, useMemo, useRef, useEffect } from "react";
import "./responsive.css";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  CheckCircle,
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
  Eye,
  Edit3,
  Inbox,
  ArrowDownZA,
  Briefcase,
  Languages as LangIcon,
  Layers,
  Plus,
  Cloud,
  CloudOff,
  Loader2,
  Undo,
  Redo,
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { initializeApp, getApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  doc,
  setDoc,
  onSnapshot,
  DocumentSnapshot,
  FirestoreError,
} from "firebase/firestore";

// --- LOCAL IMPORTS ---
import type {
  ShiftType,
  OverrideType,
  Language,
  RotationConfig,
  Employee,
  ShiftRequest,
  RoleId,
  LangCode,
} from "./types";
import { LoginModal } from "./components/LoginModal";
import { AdminPanel } from "./components/AdminPanel";
import { RequestsModal } from "./components/RequestsModal";
import { StatsModal } from "./components/StatsModal";
import {
  FIREBASE_CONFIG,
  APP_ID,
  ROLES,
  ALL_LANGUAGES,
  WEEKDAYS,
  MONTHS,
  DEFAULT_HOLIDAYS,
  INITIAL_TEAM,
} from "./config/constants";
import { TRANSLATIONS } from "./utils/translations";

// --- LOGIC HELPERS ---

// Safe date key generator YYYY-MM-DD
const getDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
  overrides,
  colors,
  t,
}: any) => {
  const [selectedEmpId, setSelectedEmpId] = useState<number>(team[0]?.id || 0);
  const [year, setYear] = useState(2026);
  if (!isOpen) return null;
  const emp = team.find((e: any) => e.id === +selectedEmpId);
  const renderMonth = (mIdx: number) => {
    const daysInM = new Date(year, mIdx + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInM; d++) {
      const date = new Date(year, mIdx, d);
      const dateStr = getDateKey(date); // FIXED
      const isOverride = overrides[`${emp.id}_${dateStr}`];
      // Default to day off unless manually overridden
      let shift = isOverride || "F";
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

const CellEditor = ({
  cell,
  onClose,
  onUpdate,
  legends,
  customColors,
}: any) => {
  // Build options dynamically from standard shifts and custom shifts
  const options: {
    id: OverrideType | "CLEAR";
    label: string;
    icon?: any;
    color: string;
  }[] = [
    // Standard shifts
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
  ];

  // Lógica de deteção de fundo de ecrã
  // Se estiver nos últimos 350px do ecrã, abre para cima
  const isNearBottom = cell.y > window.innerHeight - 350;

  // cell.y é a parte de BAIXO da célula clicada.
  // Se abrirmos para cima, queremos que o fundo do popup fique acima do topo da célula.
  // Assumindo que a célula tem ~32px de altura:
  const bottomPosition = window.innerHeight - cell.y + 40;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
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
              onUpdate(cell.key, opt.id);
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
      </div>
    </>
  );
};

const ConfigPanel = ({
  show,
  config,
  setConfig,
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
        <div className="border-t pt-1.5 mt-0">
          <label className="block text-xs font-bold text-gray-600 mb-1 flex items-center gap-1">
            <Calendar size={12} /> {t.holidaysSection}
          </label>
          <div className="flex gap-1.5 mb-1.5">
            <input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              className="flex-1 p-0.5 border rounded text-[10px]"
            />
            <button
              onClick={handleAddHoliday}
              className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="max-h-20 overflow-y-auto space-y-0.5">
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
          <label className="block text-xs font-bold text-gray-600 mb-1">
            {t.minStaffWarn}
          </label>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-3 gap-2 min-w-[300px]">
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
        </div>
        <div className="border-t pt-2">
          <label className="block text-xs font-bold text-gray-600 mb-1">
            {t.weekendSection}
          </label>
          <div className="flex gap-1">
            {WEEKDAYS.map((day, idx) => (
              <button
                key={day}
                onClick={() => handleWeekendToggle(idx)}
                className={`text-xs px-2 py-1 rounded border ${
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
          <label className="block text-xs font-bold text-gray-600 mb-1">
            {t.hoursPerShift}
          </label>
          <div className="overflow-x-auto mb-2">
            <div className="grid grid-cols-3 gap-2 min-w-[300px]">
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
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-600">
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
          <label className="block text-xs font-bold text-gray-600 mb-1">
            {t.langsSection}
          </label>
          <div className="flex flex-wrap gap-1">
            {ALL_LANGUAGES.map((lang) => (
              <label
                key={lang}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer border ${
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

      {/* Shift Legends, Hours & Colors */}
      <div className="bg-gray-50 p-3 rounded mb-4 border space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2">
          <Palette size={12} /> Shift Legends, Hours & Colors
        </h4>
        <div className="overflow-x-auto">
          <div className="space-y-2">
            {["M", "T", "N", "F", "V", "S"].map((type) => (
              <div key={type} className="flex items-center gap-1 min-w-[400px]">
                <input
                  type="color"
                  value={colors[type]}
                  onChange={(e) =>
                    setColors({ ...colors, [type]: e.target.value })
                  }
                  className="w-5 h-5 p-0 border-0 rounded cursor-pointer flex-shrink-0"
                />
                <span className="text-[10px] font-bold w-4 flex-shrink-0">
                  {type}
                </span>
                <input
                  value={legends[type] || ""}
                  onChange={(e) =>
                    setLegends({ ...legends, [type]: e.target.value })
                  }
                  className="flex-1 p-1 border rounded text-xs"
                />
                {["F", "V", "S"].includes(type) && (
                  <span className="text-xs text-gray-500 flex-1">
                    {t[`leg${type}` as keyof typeof t]}
                  </span>
                )}
              </div>
            ))}
          </div>
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
          {team.length === 0 && (
            <div className="text-center text-xs text-gray-400 py-8 italic">
              No employees yet
            </div>
          )}
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
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [visibleMonthDate, setVisibleMonthDate] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [showConfig, setShowConfig] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAnnual, setShowAnnual] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
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
  const [targetRole, setTargetRole] = useState<RoleId | null>(null);
  const [loggedInName, setLoggedInName] = useState<string>("");
  const [loggedInUserId, setLoggedInUserId] = useState<number>(0);
  const [preSelectedBulkId, setPreSelectedBulkId] = useState<string>("");
  const [tokenExpiredMsg, setTokenExpiredMsg] = useState<string>(""); // Message when token expires

  // Ref to prevent infinite loops between Firebase sync and local save
  const isRemoteUpdate = useRef(false);
  const canWriteRef = useRef(false);
  const isLoadingRef = useRef(true);
  const dbRef = useRef<any>(null); // Store Firestore instance for consistent usage
  const previousUserRoleRef = useRef<RoleId>("viewer"); // Track previous role to detect token expiration
  const lastActivityRef = useRef<number>(Date.now()); // Track last user interaction
  const lastRefreshRef = useRef<number>(Date.now()); // Track last token refresh
  const activityListenersAttachedRef = useRef(false);
  const idleCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // ref to calendar scroll container and extra-days flag to append next-month days
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const [nextMonthExtraDays, setNextMonthExtraDays] = useState(0);
  const lastAutoRef = useRef<number>(0);
  const hasAppendedRef = useRef(false);
  const savedScrollRef = useRef<number>(0);

  const canWrite = currentUser.permissions.includes("write");
  const canAccessSettings = currentUser.role === "manager";
  const isManager = currentUser.role === "manager";

  // Update refs whenever these values change so snapshot listener always has current values
  canWriteRef.current = canWrite;
  isLoadingRef.current = isLoading;

  const [roleFilter, setRoleFilter] = useState("All");
  const [langFilter, setLangFilter] = useState("All");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("AZ");
  const [focusedDate, setFocusedDate] = useState<string | null>(null);
  const [mobileRoleDropdownOpen, setMobileRoleDropdownOpen] = useState(false);
  const [mobileFilterRoleOpen, setMobileFilterRoleOpen] = useState(false);
  const [mobileFilterLangOpen, setMobileFilterLangOpen] = useState(false);
  const [mobileFilterShiftOpen, setMobileFilterShiftOpen] = useState(false);
  const [mobileFilterSortOpen, setMobileFilterSortOpen] = useState(false);
  const [focusedEmployeeId, setFocusedEmployeeId] = useState<number | null>(
    null
  );
  const [publishedOverrides, setPublishedOverrides] = useState<
    Record<string, OverrideType>
  >({});
  const [lastPublished, setLastPublished] = useState<number | null>(null);
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
  const [undoHistory, setUndoHistory] = useState<
    Record<string, OverrideType>[]
  >([]);
  const [redoHistory, setRedoHistory] = useState<
    Record<string, OverrideType>[]
  >([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [lastSelectedDate, setLastSelectedDate] = useState<string | null>(null);

  // Track if manager has made changes since last publish
  useEffect(() => {
    if (!isManager) return;
    const hasChanges =
      JSON.stringify(overrides) !== JSON.stringify(publishedOverrides);
    setHasUnpublishedChanges(hasChanges);
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
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity logout
  const REFRESH_INTERVAL_MS = 45 * 60 * 1000; // refresh token every 45 minutes while active
  const IDLE_POLL_MS = 60 * 1000; // check idle status every 60 seconds

  // --- FIREBASE INIT & SYNC ---
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let isComponentMounted = true;

    const initializeFirebase = () => {
      if (!FIREBASE_CONFIG.apiKey) {
        if (isComponentMounted) {
          setIsLoading(false);
          setSaveStatus("offline");
        }
        return;
      }

      try {
        const app = initializeApp(FIREBASE_CONFIG);
        const auth = getAuth(app);
        const db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
        // Store DB instance for use in other functions
        dbRef.current = db;

        const initAuth = async () => {
          try {
            if (auth.currentUser) {
              return;
            }
            // Don't auto-restore tokens on page load - user must explicitly select a role
            // This prevents editor tokens from being mistakenly used in manager/admin mode
            await signInAnonymously(auth);
            retryCountRef.current = 0; // Reset retry count on success
          } catch (authError: any) {
            console.error("[Firebase] Auth Error - Please check console:", {
              code: authError?.code,
              message: authError?.message,
              fullError: authError,
            });
            // Don't spam retries on permanent errors
            const permanentErrors = [
              "auth/operation-not-allowed",
              "auth/invalid-api-key",
              "auth/app-deleted",
              "auth/invalid-user-token",
            ];
            if (!permanentErrors.includes(authError?.code)) {
              scheduleRetry();
            } else {
              setIsLoading(false);
              setSaveStatus("offline");
            }
          }
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

        unsubscribe = onSnapshot(
          dataDocRef,
          (docSnap: DocumentSnapshot) => {
            if (!isComponentMounted) return;

            if (docSnap.exists()) {
              const data = docSnap.data();

              // For write-enabled users (managers), only load on initial mount
              // and don't listen to updates (prevents overwriting local edits)
              if (!isLoadingRef.current && canWriteRef.current) {
                return; // Don't process any data for editing users after initial load
              }

              // Mark this update as coming from the cloud to prevent immediate re-save
              isRemoteUpdate.current = true;

              // Batch state updates to reduce re-renders
              if (data.startDateStr) setStartDateStr(data.startDateStr);
              if (data.holidays) setHolidays(data.holidays);
              if (data.minStaff) setMinStaff(data.minStaff);
              if (data.requiredLangs) setRequiredLangs(data.requiredLangs);
              if (data.weekendDays) setWeekendDays(data.weekendDays);
              if (data.legends) setLegends(data.legends);
              if (data.colors) setColors(data.colors);
              if (data.config) setConfig(data.config);
              if (data.hoursConfig) setHoursConfig(data.hoursConfig);
              if (data.team) setTeamState(data.team);
              if (data.requests) setRequests(data.requests);

              // Handle overrides separately to avoid double updates
              if (data.overrides) setOverrides(data.overrides);
              if (data.publishedOverrides) {
                setPublishedOverrides(data.publishedOverrides);
              } else if (data.overrides) {
                // Initialize publishedOverrides with overrides on first load
                setPublishedOverrides(data.overrides);
              }
              if (data.lastPublished) setLastPublished(data.lastPublished);

              setInitError(false);
              setIsLoading(false);
              setSaveStatus("saved");
              retryCountRef.current = 0; // Reset retry count on success
            } else {
              // Document doesn't exist yet - initialize with defaults
              setInitError(false);
              setIsLoading(false);
              setSaveStatus("saved");
              retryCountRef.current = 0; // Reset retry count on success
            }
          },
          (error: FirestoreError) => {
            if (!isComponentMounted) return;

            if (import.meta.env.DEV)
              console.error("[Firebase] Snapshot Listener Error:", {
                code: error.code,
                message: error.message,
                details: error,
              });

            // Don't set offline on every error - only on initial load failure
            // Otherwise the save effect's status gets overwritten
            if (isLoadingRef.current) {
              setInitError(false);
              setIsLoading(false);
              setSaveStatus("offline");
            }

            // Attempt retry
            scheduleRetry();
          }
        );
      } catch (error: any) {
        if (!isComponentMounted) return;

        if (import.meta.env.DEV)
          console.error("[Firebase] Initialization error:", {
            message: error?.message,
            code: error?.code,
            details: error,
          });
        setInitError(false);
        setIsLoading(false);
        setSaveStatus("offline");
        // Attempt retry
        scheduleRetry();
      }
    };

    const scheduleRetry = () => {
      if (retryCountRef.current >= maxRetries) {
        return;
      }

      const delayMs = Math.min(
        1000 * Math.pow(2, retryCountRef.current),
        30000
      ); // Exponential backoff, max 30s
      retryCountRef.current++;

      retryTimeout = setTimeout(() => {
        if (isComponentMounted) {
          if (unsubscribe) unsubscribe();
          initializeFirebase();
        }
      }, delayMs);
    };

    initializeFirebase();

    return () => {
      isComponentMounted = false;
      if (unsubscribe) unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  // --- USER ACTIVITY TRACKING & TOKEN REFRESH ---
  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    if (!activityListenersAttachedRef.current) {
      window.addEventListener("mousemove", markActivity);
      window.addEventListener("keydown", markActivity);
      window.addEventListener("click", markActivity);
      window.addEventListener("touchstart", markActivity);
      activityListenersAttachedRef.current = true;
    }

    return () => {
      window.removeEventListener("mousemove", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("click", markActivity);
      window.removeEventListener("touchstart", markActivity);
      activityListenersAttachedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const auth = getAuth();

    const clearIdleTimer = () => {
      if (idleCheckIntervalRef.current) {
        clearInterval(idleCheckIntervalRef.current);
        idleCheckIntervalRef.current = null;
      }
    };

    const forceLogoutForIdle = async () => {
      sessionStorage.removeItem("firebaseToken");
      sessionStorage.removeItem("firebaseTokenRole");
      try {
        await signOut(auth);
      } catch (err) {
        if (import.meta.env.DEV)
          console.warn("[Auth] signOut during idle failed", err);
      }
      previousUserRoleRef.current = "viewer";
      setCurrentUser(ROLES.VIEWER);
      setLoggedInName("");
      setLoggedInUserId(0);
      setTokenExpiredMsg(
        "Session expired due to inactivity. Please log in again."
      );
      setLoginModalOpen(true);
      clearIdleTimer();
    };

    // Do not start timers for viewers/editors or while loading
    if (currentUser.role === "viewer" || currentUser.role === "editor") {
      clearIdleTimer();
      return;
    }

    lastActivityRef.current = Date.now();
    lastRefreshRef.current = Date.now();

    clearIdleTimer();
    idleCheckIntervalRef.current = setInterval(async () => {
      const now = Date.now();
      const idleFor = now - lastActivityRef.current;

      // Idle logout
      if (idleFor >= IDLE_TIMEOUT_MS) {
        await forceLogoutForIdle();
        return;
      }

      // Token refresh while active
      const needsRefresh = now - lastRefreshRef.current >= REFRESH_INTERVAL_MS;
      if (needsRefresh && auth.currentUser) {
        try {
          await auth.currentUser.getIdToken(true);
          lastRefreshRef.current = now;
        } catch (err) {
          if (import.meta.env.DEV)
            console.warn("[Auth] Token refresh failed, logging out", err);
          await forceLogoutForIdle();
        }
      }
    }, IDLE_POLL_MS);

    return () => {
      clearIdleTimer();
    };
  }, [currentUser.role]);

  // --- DETECT TOKEN EXPIRATION (Role Downgrade) ---
  useEffect(() => {
    // If we were logged in as manager/admin but are now viewer, token expired
    const wasLoggedIn =
      previousUserRoleRef.current === "manager" ||
      previousUserRoleRef.current === "admin";
    const isNowViewer = currentUser.role === "viewer";

    if (wasLoggedIn && isNowViewer && loggedInName) {
      // Token expired - clear storage and prompt re-login
      sessionStorage.removeItem("firebaseToken");
      sessionStorage.removeItem("firebaseTokenRole");
      setTokenExpiredMsg(
        "Your session expired. Please log in again to continue as manager/admin."
      );
      setLoginModalOpen(true);
      setLoggedInName("");
      setLoggedInUserId(0);
    }
  }, [currentUser.role, loggedInName]);

  // --- SAVE TO FIREBASE (Debounced) ---
  useEffect(() => {
    if (isLoading || initError) return;
    if (!FIREBASE_CONFIG.apiKey || !APP_ID) {
      if (import.meta.env.DEV)
        console.log("[Save] Missing config:", {
          apiKey: !!FIREBASE_CONFIG.apiKey,
          appId: !!APP_ID,
        });
      return;
    }

    // If the change came from a remote snapshot, reset the flag and DO NOT save back
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    // Only allow saving from roles with write permission
    if (!canWrite) {
      return;
    }

    setSaveStatus("saving");

    const saveData = async () => {
      try {
        let app;
        try {
          app = getApp();
        } catch {
          app = initializeApp(FIREBASE_CONFIG);
        }

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
          lastPublished: lastPublished || null,
          config,
          hoursConfig,
          team: teamState,
          requests,
          lastUpdated: Date.now(),
        });

        setSaveStatus("saved");
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.error("[Save] Firebase error:", {
            code: err?.code,
            message: err?.message,
            error: err,
          });
          try {
            const auth = getAuth();
            const tokenResult = await auth.currentUser?.getIdTokenResult();
            console.error("[Save] Current auth context", {
              uid: auth.currentUser?.uid,
              claims: tokenResult?.claims,
            });
          } catch (claimErr) {
            console.error("[Save] Failed to fetch token claims", claimErr);
          }
        }
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
    initError,
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

  const handlePublish = async () => {
    const newPublishedOverrides = { ...overrides };
    const newLastPublished = Date.now();

    setPublishedOverrides(newPublishedOverrides);
    setLastPublished(newLastPublished);
    setHasUnpublishedChanges(false);

    // Immediately save to Firebase
    if (FIREBASE_CONFIG.apiKey) {
      try {
        const auth = getAuth();
        // Refresh token to ensure it's still valid
        await auth.currentUser?.getIdToken(true);

        const app = getApp();
        const db = dbRef.current || getFirestore(app);
        if (!dbRef.current) dbRef.current = db;
        const dataDocRef = doc(
          db,
          "artifacts",
          APP_ID,
          "public",
          "data",
          "shift_scheduler",
          "global_state"
        );

        const publishData = {
          startDateStr,
          holidays,
          minStaff,
          requiredLangs,
          weekendDays,
          legends,
          colors,
          overrides,
          publishedOverrides: newPublishedOverrides,
          lastPublished: newLastPublished,
          config,
          hoursConfig,
          team: teamState,
          requests,
          lastUpdated: Date.now(),
        };

        console.log(
          "[Publish] Writing data with keys:",
          Object.keys(publishData)
        );

        await setDoc(dataDocRef, publishData);

        setSaveStatus("saved");
      } catch (err: any) {
        console.error("Publish Error:", {
          code: err?.code,
          message: err?.message,
        });
        setSaveStatus("error");
      }
    } else {
      // No Firebase config, at least update local state
      setSaveStatus("offline");
    }
  };

  // Login Handling
  const initiateLogin = async (roleKey: string) => {
    if (roleKey === "VIEWER") {
      setCurrentUser(ROLES.VIEWER);
      setLoggedInName("");
      setLoggedInUserId(0);
      setShowConfig(false);
      setShowAdmin(false);
      // Clear highlights when switching roles
      setFocusedEmployeeId(null);
      setSelectedDates([]);
      return;
    }

    // Determine target role
    let targetRoleToUse: RoleId;
    if (roleKey === "ADMIN") {
      targetRoleToUse = "admin";
    } else if (roleKey === "MANAGER") {
      targetRoleToUse = "manager";
    } else {
      targetRoleToUse = "editor";
    }

    // Check if a valid token exists for this role
    const storedToken = sessionStorage.getItem("firebaseToken");
    const storedTokenRole = sessionStorage.getItem("firebaseTokenRole");

    // If a token exists for a different role, drop it to avoid cross-role reuse
    if (storedToken && storedTokenRole && storedTokenRole !== targetRoleToUse) {
      sessionStorage.removeItem("firebaseToken");
      sessionStorage.removeItem("firebaseTokenRole");
    }

    if (storedToken && storedTokenRole === targetRoleToUse) {
      // Try to reuse the existing token
      try {
        const auth = getAuth();
        await signInWithCustomToken(auth, storedToken);

        // Verify token claims match the requested role
        const tokenResult = await auth.currentUser?.getIdTokenResult();
        const claimRole = (tokenResult?.claims as any)?.role as
          | RoleId
          | undefined;
        const claimUserId = (tokenResult?.claims as any)?.userId as
          | number
          | undefined;

        if (claimRole !== targetRoleToUse) {
          await auth.signOut();
          sessionStorage.removeItem("firebaseToken");
          sessionStorage.removeItem("firebaseTokenRole");
          throw new Error(
            `Token role mismatch: expected ${targetRoleToUse}, got ${claimRole}`
          );
        }

        // Token is valid, update user state based on role
        lastActivityRef.current = Date.now();
        lastRefreshRef.current = Date.now();

        if (targetRoleToUse === "manager") {
          setCurrentUser(ROLES.MANAGER);
          setLoggedInName("Diretor");
          setLoggedInUserId(0);
          setFocusedEmployeeId(null);
        } else if (targetRoleToUse === "admin") {
          setCurrentUser(ROLES.ADMIN);
          setLoggedInName("Admin");
          setLoggedInUserId(0);
          setFocusedEmployeeId(null);
        } else if (targetRoleToUse === "editor") {
          setCurrentUser(ROLES.EDITOR);
          if (typeof claimUserId === "number") {
            setLoggedInUserId(claimUserId);
            setFocusedEmployeeId(claimUserId);
          } else {
            setFocusedEmployeeId(loggedInUserId);
          }
        }
        previousUserRoleRef.current = targetRoleToUse;
        setTokenExpiredMsg("");
        return; // Skip login modal since token was successfully reused
      } catch (err: any) {
        // Token is invalid or expired, clear it and proceed to login
        if (import.meta.env.DEV) {
          console.warn(
            "[Login] Stored token validation failed, will require new login:",
            err
          );
        }
        sessionStorage.removeItem("firebaseToken");
        sessionStorage.removeItem("firebaseTokenRole");
      }
    }

    // No valid token found, show login modal
    setTargetRole(targetRoleToUse);
    setLoginModalOpen(true);
  };

  const handleLoginSuccess = (role: RoleId, name: string, id: number) => {
    // Clear highlights when switching roles
    setSelectedDates([]);
    setTokenExpiredMsg(""); // Clear expiration message on successful login
    lastActivityRef.current = Date.now();
    lastRefreshRef.current = Date.now();
    if (role === "manager") {
      setCurrentUser(ROLES.MANAGER);
      setFocusedEmployeeId(null);
    } else if (role === "admin") {
      setCurrentUser(ROLES.ADMIN);
      setFocusedEmployeeId(null);
    } else if (role === "editor") {
      setCurrentUser(ROLES.EDITOR);
      // Auto-focus the logged-in Escalator's row
      setFocusedEmployeeId(id);
    } else {
      // viewer role
      setCurrentUser(ROLES.VIEWER);
      setFocusedEmployeeId(null);
    }
    previousUserRoleRef.current = role; // Update tracked role
    setLoggedInName(name);
    setLoggedInUserId(id);
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

  // Use publishedOverrides for non-managers, draftOverrides for managers
  const effectiveOverrides = isManager ? overrides : publishedOverrides;

  const filteredTeam = useMemo(() => {
    let result = teamState.filter((emp) => {
      const roleMatch = roleFilter === "All" || emp.role === roleFilter;
      const langMatch =
        langFilter === "All" || emp.languages.includes(langFilter as Language);

      let shiftMatch = true;
      if (shiftFilter !== "All") {
        // Check if employee has the filtered shift on any selected date
        if (selectedDates.length > 0) {
          shiftMatch = selectedDates.some((date) => {
            const dateKey = `${emp.id}_${date}`;
            const shift = effectiveOverrides[dateKey] || "F";
            return shift === shiftFilter;
          });
        } else {
          // If no dates selected, show all
          shiftMatch = true;
        }
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
    selectedDates,
  ]);

  const handleCellClick = (
    e: React.MouseEvent,
    empId: number,
    dateStr: string,
    empName: string
  ) => {
    if (!canWrite) return;
    // In Editor mode, only allow editing own cells
    if (currentUser.role === "editor" && empId !== loggedInUserId) return;
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
      setUndoHistory((prev) => [...prev, { ...overrides }]);
      setRedoHistory([]);
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

  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    const previous = undoHistory[undoHistory.length - 1];
    setRedoHistory((prev) => [...prev, { ...overrides }]);
    setOverrides(previous);
    setUndoHistory((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const next = redoHistory[redoHistory.length - 1];
    setUndoHistory((prev) => [...prev, { ...overrides }]);
    setOverrides(next);
  };

  const handleBulkApply = (
    targetId: string | number,
    start: string,
    end: string,
    type: OverrideType | undefined
  ) => {
    if (!canWrite) return;
    setUndoHistory((prev) => [...prev, { ...overrides }]);
    setRedoHistory([]);
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
    }
  };

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const days = [];
    const locale = "en-GB";

    // Pre-compute pending requests map for faster lookup
    const pendingRequestsMap = new Map<string, boolean>();
    requests.forEach((r) => {
      if (r.status === "PENDING") {
        pendingRequestsMap.set(`${r.empId}_${r.date}`, true);
      }
    });

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

        // Use pre-computed map for faster lookup
        pendingReqs[emp.id] = pendingRequestsMap.get(overrideKey) || false;

        // Default to day off unless manually overridden
        const shift = effectiveOverrides[overrideKey] || "F";
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
    // If requested, append a number of days from the next month so the table
    // can display an overlapping range (e.g., Dec 25 - Jan 4)
    if (nextMonthExtraDays && nextMonthExtraDays > 0) {
      const nextMonthDate = new Date(year, month + 1, 1);
      const nextYear = nextMonthDate.getFullYear();
      const nextMonth = nextMonthDate.getMonth();
      const daysInNext = getDaysInMonth(nextYear, nextMonth);
      const toAdd = Math.min(nextMonthExtraDays, daysInNext);
      for (let d = 1; d <= toAdd; d++) {
        const dateObj = new Date(nextYear, nextMonth, d);
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

          // Default to day off unless manually overridden
          if (effectiveOverrides[overrideKey]) {
            shift = effectiveOverrides[overrideKey];
          } else {
            shift = "F"; // Default to day off - manual scheduling only
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
    }
    return days;
  }, [
    currentDate,
    teamState,
    holidays,
    minStaff,
    requiredLangs,
    weekendDays,
    effectiveOverrides,
    requests,
    nextMonthExtraDays,
  ]);

  // Auto-scroll to today's column only when viewing the current month/year
  useEffect(() => {
    const el = calendarRef.current;
    if (!el) return;

    const today = new Date();
    if (
      currentDate.getFullYear() !== today.getFullYear() ||
      currentDate.getMonth() !== today.getMonth()
    ) {
      return; // Avoid jumping when editing data or viewing other months
    }

    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const todayIndex = calendarData.findIndex((d) => d.fullDate === todayStr);

    if (todayIndex >= 0) {
      setTimeout(() => {
        const ths = el.querySelectorAll("table thead th");
        const dayThs = Array.from(ths).slice(1) as HTMLElement[];
        const todayTh = dayThs[todayIndex];
        if (todayTh) {
          const stickyWidth = (ths[0] as HTMLElement)?.offsetWidth || 0;
          el.scrollLeft = todayTh.offsetLeft - stickyWidth - 100;
        }
      }, 100);
    }
  }, [currentDate]);

  // Auto-append next-month days when user scrolls to right edge of calendar
  useEffect(() => {
    const el = calendarRef.current;
    if (!el) return;

    let ticking = false;
    let lastScrollLeft = el.scrollLeft;
    let lastScrollTop = el.scrollTop;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        try {
          const currentScrollLeft = el.scrollLeft;
          const currentScrollTop = el.scrollTop;

          // Only trigger if horizontal scroll changed (not just vertical)
          const horizontalScrollDelta = Math.abs(
            currentScrollLeft - lastScrollLeft
          );
          const verticalScrollDelta = Math.abs(
            currentScrollTop - lastScrollTop
          );

          // Only proceed if horizontal scroll is significant and greater than vertical
          if (
            horizontalScrollDelta > 5 &&
            horizontalScrollDelta > verticalScrollDelta
          ) {
            const threshold = 40;
            // Only auto-append if we're actually near the end AND haven't appended yet
            if (
              el.scrollLeft + el.clientWidth >= el.scrollWidth - threshold &&
              nextMonthExtraDays === 0
            ) {
              const now = Date.now();
              if (now - lastAutoRef.current > 900) {
                lastAutoRef.current = now;
                // Append 7 days by default (just one more week)
                setNextMonthExtraDays(7);
              }
            }
          }

          lastScrollLeft = currentScrollLeft;
          lastScrollTop = currentScrollTop;
        } finally {
          ticking = false;
        }
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll as any);
  }, [calendarRef, currentDate, teamState, nextMonthExtraDays]);

  // Auto-detect visible month and append next-month days when user stops scrolling
  useEffect(() => {
    const el = calendarRef.current;
    if (!el) return;

    let scrollTimeout: number | null = null;

    const onScrollEnd = () => {
      const ths = el.querySelectorAll("table thead th");
      if (!ths || ths.length <= 1) return;
      const dayThs = Array.from(ths).slice(1) as HTMLElement[]; // skip sticky left column
      const stickyTh = ths[0] as HTMLElement | undefined;
      const stickyWidth = stickyTh ? stickyTh.offsetWidth : 0;

      let lastVisibleIdx = -1;
      let firstVisibleIdx = -1;
      dayThs.forEach((th, idx) => {
        const thLeft = th.offsetLeft;
        const thRight = thLeft + th.offsetWidth;
        const viewLeft = el.scrollLeft + stickyWidth;
        const viewRight = el.scrollLeft + el.clientWidth;
        const visible = thLeft < viewRight && thRight > viewLeft;
        if (visible) {
          if (firstVisibleIdx === -1) firstVisibleIdx = idx;
          lastVisibleIdx = idx;
        }
      });

      const daysInCurrent = getDaysInMonth(
        currentDate.getFullYear(),
        currentDate.getMonth()
      );
      const lastIndexOfCurrent = daysInCurrent - 1;

      // Only append if user scrolled (not if they just changed months)
      // Check if we're past a minimum scroll position to avoid auto-append on month change
      const minScrollForAppend = 100; // Only append if user scrolled at least 100px
      if (
        lastVisibleIdx >= lastIndexOfCurrent - 3 &&
        nextMonthExtraDays === 0 &&
        el.scrollLeft > minScrollForAppend
      ) {
        // Save scroll position before state change
        savedScrollRef.current = el.scrollLeft;
        hasAppendedRef.current = true;
        setNextMonthExtraDays(7);
      }

      // Update header based on what's visible - but only if we have extra days appended
      if (lastVisibleIdx >= lastIndexOfCurrent && nextMonthExtraDays > 0) {
        const nextMonthDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          1
        );
        setVisibleMonthDate(nextMonthDate);
      } else {
        setVisibleMonthDate(
          new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        );
      }
    };

    const onScroll = () => {
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
      // Debounce end-of-scroll detection
      scrollTimeout = window.setTimeout(() => {
        onScrollEnd();
      }, 220);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll as any);
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
    };
  }, [calendarRef, currentDate, nextMonthExtraDays]);

  // Restore scroll position after appending days
  useEffect(() => {
    const el = calendarRef.current;
    if (!el || !hasAppendedRef.current || savedScrollRef.current === 0) return;

    requestAnimationFrame(() => {
      el.scrollLeft = savedScrollRef.current;
    });
  }, [nextMonthExtraDays]);

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

  const handlePrevMonth = () => {
    setNextMonthExtraDays(0);
    hasAppendedRef.current = false;
    lastAutoRef.current = 0;
    const nd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    setCurrentDate(nd);
    setVisibleMonthDate(nd);
  };

  const handleNextMonth = () => {
    setNextMonthExtraDays(0);
    hasAppendedRef.current = false;
    lastAutoRef.current = 0;
    const nd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    setCurrentDate(nd);
    setVisibleMonthDate(nd);
  };

  useEffect(() => {
    // Keep visibleMonthDate in sync when currentDate is changed programmatically
    setVisibleMonthDate((prev) => {
      if (
        prev.getFullYear() !== currentDate.getFullYear() ||
        prev.getMonth() !== currentDate.getMonth()
      ) {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      }
      return prev;
    });
  }, [currentDate]);

  const monthLabel = visibleMonthDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

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

      // Clone the element to avoid modifying the original
      const clone = element.cloneNode(true) as HTMLElement;

      // Function to recursively remove problematic Tailwind classes
      const removeProblematicClasses = (el: HTMLElement) => {
        // List of Tailwind classes that might contain oklch or other unsupported colors
        const problematicPatterns = [
          /text-\w+-\d+/, // text colors
          /bg-\w+-\d+/, // background colors
          /border-\w+-\d+/, // border colors
          /ring-\w+-\d+/, // ring colors
          /divide-\w+-\d+/, // divide colors
          /from-\w+-\d+/, // gradient from
          /to-\w+-\d+/, // gradient to
          /via-\w+-\d+/, // gradient via
        ];

        Array.from(el.classList).forEach((cls) => {
          if (problematicPatterns.some((pattern) => pattern.test(cls))) {
            el.classList.remove(cls);
          }
        });

        // Recursively process children
        Array.from(el.children).forEach((child) => {
          removeProblematicClasses(child as HTMLElement);
        });
      };

      // Remove problematic classes from clone
      removeProblematicClasses(clone);

      // Append clone to body temporarily
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      container.appendChild(clone);
      document.body.appendChild(container);

      // Wait a bit for the DOM to update
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(clone, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            allowTaint: true,
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
          if (import.meta.env.DEV) console.error("Error exporting image:", err);
          alert("Error exporting image. Please try again.");
        } finally {
          // Clean up the temporary container
          document.body.removeChild(container);
        }
      }, 100);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error loading html2canvas:", err);
      alert("Error with export library. Please try again.");
    }
  };

  const roles = useMemo(
    () => Array.from(new Set(teamState.map((e) => e.role))),
    [teamState]
  );
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  // Show error screen only if truly critical (not just offline mode)
  if (initError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-red-50 text-red-900 p-4 text-center">
        <ShieldAlert className="w-16 h-16 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Erro Crítico</h2>
        <p className="max-w-md mb-2 text-sm">
          Houve um erro ao inicializar a aplicação.
        </p>
        <p className="max-w-md mb-6 text-sm text-red-800">
          Por favor, verifique a sua conexão de internet e as credenciais do
          Firebase no arquivo .env
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-lg flex items-center justify-center gap-2"
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
    <div className="flex flex-col min-h-screen h-screen w-full overflow-x-hidden bg-gray-50 text-xs sm:text-sm md:text-sm font-sans relative print:overflow-visible print:bg-white print:h-auto">
      <style>{`
        @media print { 
          @page { size: landscape; margin: 10mm; } 
          .print\\:hidden { display: none !important; } 
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-shift-week { display: none !important; }
        }
      `}</style>

      {/* --- DATA LOADING INDICATOR --- */}
      {isLoading && (
        <div className="bg-blue-50 border-b-2 border-blue-400 text-blue-800 p-3 flex items-center gap-3 z-40 print:hidden">
          <Loader2 size={18} className="animate-spin flex-shrink-0" />
          <span className="text-sm font-medium">
            Loading schedule data. Please wait before making edits...
          </span>
        </div>
      )}

      {/* --- BARRA DE PERMISSÕES & CLOUD --- */}
      <div className="bg-slate-900 text-white p-2 shadow-lg z-30 print:hidden flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-6 gap-2">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs uppercase tracking-wide">
                  Access Mode:
                </span>
              </div>
              {/* Mobile: Custom Dropdown - inline with label */}
              <div className="md:hidden relative">
                <button
                  onClick={() =>
                    setMobileRoleDropdownOpen(!mobileRoleDropdownOpen)
                  }
                  className="flex items-center gap-1 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border border-emerald-500 rounded px-2 py-0.5 text-[11px] font-normal shadow-sm hover:shadow-md transition-all min-w-[90px] justify-between"
                >
                  <span className="truncate">
                    {
                      ROLES[
                        Object.keys(ROLES).find(
                          (k) =>
                            ROLES[k as keyof typeof ROLES].id === currentUser.id
                        ) as keyof typeof ROLES
                      ]?.label
                    }
                  </span>
                  <ChevronRight
                    size={10}
                    className={`transition-transform flex-shrink-0 ${
                      mobileRoleDropdownOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {mobileRoleDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMobileRoleDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[140px]">
                      {Object.keys(ROLES).map((key) => {
                        const role = ROLES[key as keyof typeof ROLES];
                        const isActive = currentUser.id === role.id;
                        return (
                          <button
                            key={role.id}
                            onClick={() => {
                              if (!isActive) {
                                initiateLogin(key);
                              }
                              setMobileRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {role.id === "viewer" && <Eye size={12} />}
                            {role.id === "editor" && <Edit3 size={12} />}
                            {role.id === "manager" && <Shield size={12} />}
                            {role.id === "admin" && <ShieldAlert size={12} />}
                            {role.label}
                            {isActive && (
                              <CheckCircle size={12} className="ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Cloud Status - Mobile on same row */}
            <div className="md:hidden">
              <div
                className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border transition-colors ${
                  saveStatus === "saved"
                    ? "bg-green-900/30 border-green-700 text-green-300"
                    : saveStatus === "saving"
                    ? "bg-yellow-900/30 border-yellow-700 text-yellow-300"
                    : saveStatus === "offline"
                    ? "bg-orange-900/30 border-orange-700 text-orange-300 hover:bg-orange-900/50 cursor-help"
                    : "bg-red-900/30 border-red-700 text-red-300"
                }`}
                title={
                  saveStatus === "offline"
                    ? "Clique para tentar reconectar"
                    : undefined
                }
                onClick={
                  saveStatus === "offline"
                    ? () => {
                        if (import.meta.env.DEV)
                          console.log(
                            "[User Action] Attempting manual reconnection"
                          );
                        window.location.reload();
                      }
                    : undefined
                }
              >
                {saveStatus === "saved" && <Cloud size={14} />}
                {saveStatus === "saving" && (
                  <RefreshCw size={14} className="animate-spin" />
                )}
                {(saveStatus === "error" || saveStatus === "offline") && (
                  <CloudOff size={14} />
                )}
              </div>
            </div>
          </div>
          {/* Desktop: Buttons */}
          <div className="hidden md:flex bg-slate-800 rounded-lg p-0.5 gap-1">
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
                  {role.id === "admin" && (
                    <Shield size={12} className="text-red-400" />
                  )}
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden md:flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-full md:w-auto">
          {/* Cloud Status */}
          <div
            className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border transition-colors ${
              saveStatus === "saved"
                ? "bg-green-900/30 border-green-700 text-green-300"
                : saveStatus === "saving"
                ? "bg-yellow-900/30 border-yellow-700 text-yellow-300"
                : saveStatus === "offline"
                ? "bg-orange-900/30 border-orange-700 text-orange-300 hover:bg-orange-900/50 cursor-help"
                : "bg-red-900/30 border-red-700 text-red-300"
            }`}
            title={
              saveStatus === "offline"
                ? "Clique para tentar reconectar"
                : undefined
            }
            onClick={
              saveStatus === "offline"
                ? () => {
                    if (import.meta.env.DEV)
                      console.log(
                        "[User Action] Attempting manual reconnection"
                      );
                    window.location.reload();
                  }
                : undefined
            }
          >
            {saveStatus === "saved" && <Cloud size={14} />}
            {saveStatus === "saving" && (
              <RefreshCw size={14} className="animate-spin" />
            )}
            {(saveStatus === "error" || saveStatus === "offline") && (
              <CloudOff size={14} />
            )}
            <span className="font-medium">
              {saveStatus === "saved"
                ? t.saved
                : saveStatus === "saving"
                ? t.saving
                : saveStatus === "offline"
                ? "Offline"
                : t.offline}
            </span>
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
        onTeamUpdate={setTeamState}
        t={t}
        tokenExpiredMsg={tokenExpiredMsg}
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
        overrides={overrides}
        colors={colors}
        t={t}
      />

      {/* Header */}
      <div className="bg-white flex flex-col shadow-sm z-20 print:hidden flex-shrink-0">
        {/* Top Row: Title & Actions */}
        <div className="px-2 sm:px-3 md:px-4 py-0.5 md:py-1 md:border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 md:gap-0">
          <div>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 leading-tight">
              {t.title}
            </h1>
          </div>
          <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-1 flex-wrap gap-0.5 md:gap-0 w-full sm:w-auto">
            {/* MANAGER INBOX BUTTON */}
            {isManager && (
              <button
                onClick={() => setShowRequests(true)}
                className="flex items-center px-1.5 sm:px-2 py-1 sm:py-1.5 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition border border-orange-200 relative text-xs sm:text-sm"
                title={t.requests}
              >
                <Inbox size={14} className="sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Requests</span>
                <span className="sm:hidden">Req</span>
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
                  setPreSelectedBulkId(
                    currentUser.role === "editor" ? String(loggedInUserId) : ""
                  );
                  setShowBulkModal(true);
                }}
                className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition border border-purple-200 text-xs sm:text-sm"
                title={t.bulkTitle}
              >
                <Layers size={14} className="sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{t.bulkActions}</span>
                <span className="sm:hidden">Bulk</span>
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
              className="hidden md:flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition border border-blue-200"
            >
              <Calendar size={16} className="mr-2" /> {t.annual}
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="hidden md:flex items-center px-3 py-2 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition border border-indigo-200"
            >
              <BarChart3 size={16} className="mr-2" /> {t.stats}
            </button>
            <button
              onClick={handleExportCSV}
              className="hidden md:flex items-center px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 transition border border-green-200"
            >
              <Download size={16} className="mr-2" /> {t.exportCsv}
            </button>
            <button
              onClick={() => window.print()}
              className="hidden md:flex items-center px-3 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition border border-gray-200"
            >
              <Printer size={16} className="mr-2" /> {t.print}
            </button>
            <button
              onClick={() => handleExportImage("png")}
              className="hidden md:flex items-center px-3 py-2 bg-sky-50 text-sky-700 rounded hover:bg-sky-100 transition border border-sky-200"
              title="Export as PNG"
            >
              <Download size={16} className="mr-2" /> PNG
            </button>
            <button
              onClick={() => handleExportImage("jpeg")}
              className="hidden md:flex items-center px-3 py-2 bg-rose-50 text-rose-700 rounded hover:bg-rose-100 transition border border-rose-200"
              title="Export as JPEG"
            >
              <Download size={16} className="mr-2" /> JPEG
            </button>

            {isManager && (
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={handlePublish}
                  disabled={!hasUnpublishedChanges || isLoading}
                  className={`flex items-center px-3 py-2 rounded transition border ${
                    hasUnpublishedChanges && !isLoading
                      ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 cursor-pointer"
                      : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                  title={
                    isLoading
                      ? "Loading schedule data..."
                      : hasUnpublishedChanges
                      ? "Publish schedule to viewers"
                      : "No unpublished changes"
                  }
                >
                  {isLoading && (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  )}
                  {!isLoading && <Upload size={16} className="mr-2" />}
                  {isLoading ? "Loading..." : "Publish"}{" "}
                  {hasUnpublishedChanges && !isLoading && (
                    <span className="ml-1 font-bold">*</span>
                  )}
                </button>
                {lastPublished && (
                  <div className="text-[9px] text-gray-500 px-1 text-center">
                    Last: {new Date(lastPublished).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Undo/Redo Buttons */}
            {isManager && (
              <>
                <button
                  onClick={handleUndo}
                  disabled={undoHistory.length === 0}
                  className="flex items-center px-3 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={t.undo}
                >
                  <Undo size={16} className="mr-2" />
                  {t.undo}
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoHistory.length === 0}
                  className="flex items-center px-3 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={t.redo}
                >
                  <Redo size={16} className="mr-2" />
                  {t.redo}
                </button>
              </>
            )}

            {canAccessSettings && (
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`hidden md:flex items-center px-3 py-2 rounded transition ${
                  showConfig
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Settings size={16} className="mr-2" /> {t.config}
              </button>
            )}

            {currentUser.permissions.includes("system") ? (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className={`flex items-center px-3 py-2 rounded transition ${
                  showAdmin
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Shield size={16} className="mr-2" /> Admin
              </button>
            ) : null}
          </div>
        </div>

        {/* Viewer notice when showing draft (unpublished) schedule */}
        {!isManager && Object.keys(publishedOverrides).length === 0 && (
          <div className="px-2 sm:px-3 md:px-4 py-1 bg-amber-50 text-amber-800 border-t border-b border-amber-200 text-xs">
            No published schedule yet. Please contact a manager to publish.
          </div>
        )}

        {/* Bottom Row: Filters & Nav */}
        {/* Mobile Filters - Custom Dropdowns */}
        <div className="md:hidden px-2 py-2 bg-gray-50 border-t flex flex-col gap-2 relative z-50 filter-container">
          <div className="flex items-center gap-1">
            {/* Role Filter - Custom Dropdown */}
            <div className="relative flex-1">
              <button
                onClick={() => setMobileFilterRoleOpen(!mobileFilterRoleOpen)}
                className="w-full flex items-center justify-between gap-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs font-normal shadow-sm hover:shadow-md transition-all"
                style={{ color: "#374151" }}
              >
                <span className="truncate">
                  {roleFilter === "All" ? "All Roles" : roleFilter}
                </span>
                <ChevronRight
                  size={10}
                  className={`flex-shrink-0 transition-transform ${
                    mobileFilterRoleOpen ? "rotate-90" : ""
                  }`}
                />
              </button>
              {mobileFilterRoleOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMobileFilterRoleOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999] min-w-[110px] w-56">
                    {["All Roles", ...roles].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setRoleFilter(r === "All Roles" ? "All" : r);
                          setMobileFilterRoleOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-normal transition-colors flex items-center gap-2 ${
                          (roleFilter === "All" && r === "All Roles") ||
                          roleFilter === r
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {r}
                        {roleFilter === r && (
                          <CheckCircle size={10} className="ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Language Filter - Custom Dropdown */}
            <div className="relative flex-1">
              <button
                onClick={() => setMobileFilterLangOpen(!mobileFilterLangOpen)}
                className="w-full flex items-center justify-between gap-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs font-normal shadow-sm hover:shadow-md transition-all"
                style={{ color: "#374151" }}
              >
                <span className="truncate">
                  {langFilter === "All" ? "All Languages" : langFilter}
                </span>
                <ChevronRight
                  size={10}
                  className={`flex-shrink-0 transition-transform ${
                    mobileFilterLangOpen ? "rotate-90" : ""
                  }`}
                />
              </button>
              {mobileFilterLangOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMobileFilterLangOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999] min-w-[110px] w-56">
                    {["All Languages", ...ALL_LANGUAGES].map((l) => (
                      <button
                        key={l}
                        onClick={() => {
                          setLangFilter(l === "All Languages" ? "All" : l);
                          setMobileFilterLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-normal transition-colors flex items-center gap-2 ${
                          (langFilter === "All" && l === "All Languages") ||
                          langFilter === l
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {l}
                        {langFilter === l && (
                          <CheckCircle size={10} className="ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Shift Filter - Custom Dropdown */}
            <div className="relative flex-1">
              <button
                onClick={() => setMobileFilterShiftOpen(!mobileFilterShiftOpen)}
                className="w-full flex items-center justify-between gap-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs font-normal shadow-sm hover:shadow-md transition-all"
                style={{ color: "#374151" }}
              >
                <span className="truncate">
                  {shiftFilter === "All"
                    ? "All Shifts"
                    : shiftFilter === "M"
                    ? "Morning"
                    : shiftFilter === "T"
                    ? "Afternoon"
                    : "Night"}
                </span>
                <ChevronRight
                  size={10}
                  className={`flex-shrink-0 transition-transform ${
                    mobileFilterShiftOpen ? "rotate-90" : ""
                  }`}
                />
              </button>
              {mobileFilterShiftOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMobileFilterShiftOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999] min-w-[130px] w-56">
                    {[
                      { val: "All", label: "All Shifts" },
                      { val: "M", label: "Morning (M)" },
                      { val: "T", label: "Afternoon (T)" },
                      { val: "N", label: "Night (N)" },
                    ].map((s) => (
                      <button
                        key={s.val}
                        onClick={() => {
                          setShiftFilter(s.val);
                          setMobileFilterShiftOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-normal transition-colors flex items-center gap-2 ${
                          shiftFilter === s.val
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {s.label}
                        {shiftFilter === s.val && (
                          <CheckCircle size={10} className="ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sort Filter - Custom Dropdown */}
            <div className="relative flex-1">
              <button
                onClick={() => setMobileFilterSortOpen(!mobileFilterSortOpen)}
                className="w-full flex items-center justify-between gap-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs font-normal shadow-sm hover:shadow-md transition-all"
                style={{ color: "#374151" }}
              >
                <span className="truncate">
                  {sortOrder === "OFFSET"
                    ? t.sortDefault
                    : sortOrder === "AZ"
                    ? t.sortAZ
                    : sortOrder === "ZA"
                    ? t.sortZA
                    : sortOrder === "LANG"
                    ? t.sortLang
                    : t.sortRole}
                </span>
                <ChevronRight
                  size={10}
                  className={`flex-shrink-0 transition-transform ${
                    mobileFilterSortOpen ? "rotate-90" : ""
                  }`}
                />
              </button>
              {mobileFilterSortOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMobileFilterSortOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[130px]">
                    {[
                      { val: "OFFSET", label: t.sortDefault },
                      { val: "AZ", label: t.sortAZ },
                      { val: "ZA", label: t.sortZA },
                      { val: "LANG", label: t.sortLang },
                      { val: "ROLE", label: t.sortRole },
                    ].map((s) => (
                      <button
                        key={s.val}
                        onClick={() => {
                          setSortOrder(s.val);
                          setMobileFilterSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-normal transition-colors flex items-center gap-2 ${
                          sortOrder === s.val
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {s.label}
                        {sortOrder === s.val && (
                          <CheckCircle size={10} className="ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-white border rounded-lg shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-gray-100 rounded-l-lg"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-4 font-semibold text-xs flex items-center justify-center gap-2">
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
            {selectedDates.length > 0 && (
              <button
                onClick={() => setSelectedDates([])}
                style={{
                  background: "#92400e",
                  color: "white",
                  border: "1px solid #78350f",
                  borderRadius: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: "normal",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  cursor: "pointer",
                  transition: "box-shadow 150ms ease-in-out",
                }}
              >
                <X size={11} />
                Clear ({selectedDates.length})
              </button>
            )}
          </div>
        </div>

        {/* Desktop Filters - Original Layout */}
        <div className="hidden md:flex px-2 sm:px-3 md:px-4 py-0.5 bg-gray-50 border-t flex-col md:flex-row justify-between items-start md:items-center gap-0.5 md:gap-0 overflow-x-auto">
          <div className="flex items-center gap-2 md:gap-4 flex-wrap text-[10px] md:text-xs">
            <div className="flex items-center gap-1 md:gap-2 hidden sm:flex">
              <Filter size={12} className="md:w-4 md:h-4" />
              <span className="font-bold hidden md:inline">{t.filters}:</span>
            </div>
            {/* Role radio group */}
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-gray-600 mr-2">
                {t.all}:
              </div>
              <div className="flex items-center gap-2">
                <label
                  className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs border ${
                    roleFilter === "All"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="roleFilter"
                    value="All"
                    checked={roleFilter === "All"}
                    onChange={() => setRoleFilter("All")}
                    className="sr-only"
                  />
                  All
                </label>
                {roles.map((r) => (
                  <label
                    key={r}
                    className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs border ${
                      roleFilter === r
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="roleFilter"
                      value={r}
                      checked={roleFilter === r}
                      onChange={() => setRoleFilter(r)}
                      className="sr-only"
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>

            {/* Language radio group */}
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-gray-600 mr-2">
                {t.linguas}:
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <label
                  className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs border ${
                    langFilter === "All"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="langFilter"
                    value="All"
                    checked={langFilter === "All"}
                    onChange={() => setLangFilter("All")}
                    className="sr-only"
                  />
                  {t.all}
                </label>
                {ALL_LANGUAGES.map((l) => (
                  <label
                    key={l}
                    className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs border ${
                      langFilter === l
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="langFilter"
                      value={l}
                      checked={langFilter === l}
                      onChange={() => setLangFilter(l)}
                      className="sr-only"
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            {/* Shift radio group */}
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-gray-600 mr-2">
                Shifts:
              </div>
              <label
                className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs border ${
                  shiftFilter === "All"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="shiftFilter"
                  value="All"
                  checked={shiftFilter === "All"}
                  onChange={() => setShiftFilter("All")}
                  className="sr-only"
                />
                {t.all}
              </label>
              <label
                className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs border ${
                  shiftFilter === "M"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="shiftFilter"
                  value="M"
                  checked={shiftFilter === "M"}
                  onChange={() => setShiftFilter("M")}
                  className="sr-only"
                />
                M
              </label>
              <label
                className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs border ${
                  shiftFilter === "T"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="shiftFilter"
                  value="T"
                  checked={shiftFilter === "T"}
                  onChange={() => setShiftFilter("T")}
                  className="sr-only"
                />
                T
              </label>
              <label
                className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs border ${
                  shiftFilter === "N"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="shiftFilter"
                  value="N"
                  checked={shiftFilter === "N"}
                  onChange={() => setShiftFilter("N")}
                  className="sr-only"
                />
                N
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 ml-4 border-l pl-4">
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

          {/* Multi-day selection indicator */}
          {selectedDates.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg shadow-sm px-3 py-1">
              <span className="text-xs font-semibold text-blue-800">
                {t.selectedDays}: {selectedDates.length}
              </span>
              <button
                onClick={() => setSelectedDates([])}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {t.clearSelection}
              </button>
            </div>
          )}

          {/* Go to Date picker */}
          <div className="flex items-center gap-2 bg-white border rounded-lg shadow-sm px-3 py-1">
            <span className="text-xs font-semibold text-gray-600">Focus:</span>
            <input
              type="date"
              value={focusedDate || ""}
              onChange={(e) => {
                const val = e.target.value;
                setFocusedDate(val || null);
                if (val) {
                  const [y, m, d] = val.split("-").map(Number);
                  const targetDate = new Date(y, m - 1, d);
                  if (
                    targetDate.getFullYear() !== currentDate.getFullYear() ||
                    targetDate.getMonth() !== currentDate.getMonth()
                  ) {
                    setCurrentDate(new Date(y, m - 1, 1));
                    setVisibleMonthDate(new Date(y, m - 1, 1));
                    hasAppendedRef.current = false;
                    setNextMonthExtraDays(0);
                  }
                  // Scroll to the focused day
                  setTimeout(() => {
                    const el = calendarRef.current;
                    if (el) {
                      const ths = el.querySelectorAll("table thead th");
                      const dayThs = Array.from(ths).slice(1) as HTMLElement[];
                      const targetDay = targetDate.getDate();
                      const targetTh = dayThs[targetDay - 1];
                      if (targetTh) {
                        const stickyWidth =
                          (ths[0] as HTMLElement)?.offsetWidth || 0;
                        el.scrollLeft = targetTh.offsetLeft - stickyWidth - 50;
                      }
                    }
                  }, 100);
                }
              }}
              className="text-xs border rounded px-2 py-1"
            />
            {focusedDate && (
              <button
                onClick={() => setFocusedDate(null)}
                style={{
                  background:
                    "linear-gradient(to bottom right, #ef4444, #dc2626)",
                  color: "white",
                  border: "1px solid #f87171",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  cursor: "pointer",
                  transition: "box-shadow 150ms ease-in-out",
                }}
                title="Clear focus"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 print:overflow-visible">
        <AdminPanel show={showAdmin} team={teamState} setTeam={setTeamState} />

        <ConfigPanel
          show={canAccessSettings && showConfig}
          config={config}
          setConfig={setConfig}
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

        <div
          ref={calendarRef}
          className="calendar-container print:overflow-visible"
        >
          <div className="hidden print:block mb-4">
            <h1 className="text-2xl font-bold">
              {t.printTitle} - {monthLabel}
            </h1>
            <p className="text-sm text-gray-500">
              {t.generatedOn} {new Date().toLocaleDateString("en-GB")}
            </p>
          </div>

          <table className="w-full h-full border-collapse text-base sm:text-sm print:text-[8px]">
            <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm print:static">
              <tr>
                <th className="p-1 md:p-1.5 text-left border-b border-r min-w-[140px] md:min-w-[200px] bg-gray-100 sticky left-0 z-20 shadow-sm print:static print:bg-white print:border-black">
                  <div className="flex items-center gap-1 md:gap-2">
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
                  const isFocused = focusedDate === day.fullDate;
                  const isSelected = selectedDates.includes(day.fullDate);
                  const today = new Date();
                  const todayStr = `${today.getFullYear()}-${String(
                    today.getMonth() + 1
                  ).padStart(2, "0")}-${String(today.getDate()).padStart(
                    2,
                    "0"
                  )}`;
                  const isToday = day.fullDate === todayStr;
                  return (
                    <th
                      key={day.fullDate}
                      onClick={(e) => {
                        if (e.shiftKey && lastSelectedDate) {
                          // Range selection with Shift
                          e.preventDefault();
                          const lastIndex = calendarData.findIndex(
                            (d) => d.fullDate === lastSelectedDate
                          );
                          const currentIndex = dIdx;
                          const startIdx = Math.min(lastIndex, currentIndex);
                          const endIdx = Math.max(lastIndex, currentIndex);
                          const rangeSelection = calendarData
                            .slice(startIdx, endIdx + 1)
                            .map((d) => d.fullDate);
                          setSelectedDates((prev) => {
                            // Merge with existing selection
                            const newSet = new Set([
                              ...prev,
                              ...rangeSelection,
                            ]);
                            return Array.from(newSet);
                          });
                          setLastSelectedDate(day.fullDate);
                        } else if (e.ctrlKey || e.metaKey) {
                          // Toggle single selection with Ctrl
                          e.preventDefault();
                          setSelectedDates((prev) => {
                            const isCurrentlySelected = prev.includes(
                              day.fullDate
                            );
                            const newSelection = isCurrentlySelected
                              ? prev.filter((d) => d !== day.fullDate)
                              : [...prev, day.fullDate];
                            return newSelection;
                          });
                          setLastSelectedDate(day.fullDate);
                        } else {
                          // Single click - toggle selection
                          if (isSelected) {
                            // If already selected, deselect
                            setSelectedDates([]);
                            setLastSelectedDate(null);
                          } else {
                            // If not selected, select it
                            setSelectedDates([day.fullDate]);
                            setLastSelectedDate(day.fullDate);
                          }
                          // Clear focus only on desktop
                          if (window.innerWidth >= 768) {
                            setFocusedDate(null);
                          }
                        }
                      }}
                      className={`p-1 md:p-1.5 border-b min-w-[40px] md:min-w-[48px] text-center relative cursor-pointer transition-all ${
                        !isWeekWithShift ? "no-shift-week" : ""
                      } ${
                        isToday
                          ? "bg-green-200 ring-2 md:ring-4 ring-green-500 ring-inset font-bold z-10 print:bg-green-200"
                          : isSelected
                          ? "bg-blue-200 border-l-2 md:border-l-4 border-r-2 md:border-r-4 border-t-2 md:border-t-4 border-blue-500 z-10"
                          : isFocused
                          ? "bg-yellow-100 border-l-2 md:border-l-4 border-r-2 md:border-r-4 border-t-2 md:border-t-4 border-yellow-500 z-10"
                          : day.isWeekend
                          ? "bg-indigo-50 print:bg-gray-100 border-r"
                          : "border-r"
                      } ${
                        day.isPtHoliday && !isFocused && !isSelected && !isToday
                          ? "bg-red-50 print:bg-gray-200"
                          : ""
                      } print:border-black hover:bg-gray-200`}
                      title={
                        isSelected
                          ? "Selected - Shift+Click to extend, Ctrl+Click to deselect"
                          : "Click to focus, Ctrl+Click to add, Shift+Click for range"
                      }
                    >
                      <div className="text-xs md:text-xs font-bold text-gray-700 print:text-black">
                        {day.date}
                      </div>
                      <div className="text-[10px] md:text-xs text-gray-500 uppercase print:text-black">
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
                const isFocusedRow = focusedEmployeeId === emp.id;

                // Get all shifts for this employee for overflow check
                const empShifts = calendarData.map((day) => day.shifts[emp.id]);

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors print:break-inside-avoid ${
                      isDimmed ? "opacity-50 grayscale" : "hover:bg-gray-50"
                    }`}
                  >
                    <td
                      onClick={() =>
                        setFocusedEmployeeId(isFocusedRow ? null : emp.id)
                      }
                      className={`p-1 md:p-1.5 border-b bg-white sticky left-0 z-10 shadow-sm print:static print:border-black print:shadow-none group cursor-pointer ${
                        isFocusedRow
                          ? "border-l-2 md:border-l-4 border-t-2 md:border-t-4 border-b-2 md:border-b-4 border-yellow-500 bg-yellow-50"
                          : "border-r"
                      }`}
                      title="Click to focus this employee"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-xs md:text-xs text-gray-800 print:text-black">
                          {emp.name}
                        </div>

                        {/* Only show per-row bulk action if manager (kept for quick access) */}
                        {isManager && (
                          <button
                            onClick={() => {
                              setPreSelectedBulkId(String(emp.id));
                              setShowBulkModal(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 md:p-1 hover:bg-gray-100 rounded text-gray-500 print:hidden transition-opacity"
                            title={t.bulkActions}
                          >
                            <MoreHorizontal
                              size={12}
                              className="md:w-4 md:h-4"
                            />
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
                      const isFocused = focusedDate === day.fullDate;
                      const today = new Date();
                      const todayStr = `${today.getFullYear()}-${String(
                        today.getMonth() + 1
                      ).padStart(2, "0")}-${String(today.getDate()).padStart(
                        2,
                        "0"
                      )}`;
                      const isToday = day.fullDate === todayStr;
                      const isLastCell = dIdx === calendarData.length - 1;
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

                      const isBothFocused = isFocusedRow && isFocused;
                      const isSelected = selectedDates.includes(day.fullDate);

                      return (
                        <td
                          key={day.fullDate}
                          onClick={(e) =>
                            handleCellClick(e, emp.id, day.fullDate, emp.name)
                          }
                          className={`
                            border-b p-1 md:p-1.5 text-center transition print:cursor-default relative
                            ${!isWeekWithShift ? "no-shift-week" : ""}
                            ${
                              isToday
                                ? "bg-green-100 border-l-4 border-r-4 border-green-500"
                                : isSelected
                                ? "bg-blue-100 border-l-4 border-r-4 border-blue-500"
                                : isBothFocused
                                ? "bg-yellow-100 border-l-4 border-r-4 border-t-4 border-b-4 border-yellow-500"
                                : isFocusedRow
                                ? `bg-yellow-50 border-t-4 border-b-4 border-yellow-500 ${
                                    isLastCell ? "border-r-4" : ""
                                  }`
                                : isFocused
                                ? "bg-yellow-50 border-l-4 border-r-4 border-yellow-500"
                                : "border-r"
                            }
                            cursor-pointer hover:opacity-80
                          `}
                        >
                          <div
                            onClick={(e) => {
                              handleCellClick(
                                e,
                                emp.id,
                                day.fullDate,
                                emp.name
                              );
                            }}
                            className={`
                              w-full h-7 md:h-8 rounded flex items-center justify-center text-xs md:text-xs font-bold shadow-sm print:shadow-none print:rounded-none border
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
              {/* Coverage Analysis - Issues Section (Visible to Escalator and Manager only) */}
              {canWrite && (
                <>
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
                  {["M", "T", "N"].map((shiftCode, shiftIdx) => (
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
                        const missing =
                          day.missing[shiftCode as "M" | "T" | "N"];
                        const isLowStaff =
                          day.lowStaff[shiftCode as "M" | "T" | "N"];
                        const hasErr = missing.length > 0 || isLowStaff;
                        const isFocused = focusedDate === day.fullDate;
                        const isLastAnalysisRow = shiftIdx === 2;
                        return (
                          <td
                            key={day.fullDate}
                            className={`border-b p-1 text-center text-[10px] ${
                              isFocused
                                ? `bg-yellow-50 border-l-4 border-r-4 border-yellow-500 ${
                                    isLastAnalysisRow ? "border-b-4" : ""
                                  }`
                                : hasErr
                                ? "bg-red-100 print:bg-gray-100 border-r"
                                : "border-r"
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
                </>
              )}

              {/* Complete Coverage Analysis - Manager Only */}
              {isManager && (
                <>
                  <tr className="bg-gray-50 print:bg-white">
                    <td className="p-2 border-b border-r font-bold text-gray-600 sticky left-0 bg-gray-50 z-10 shadow-sm print:static print:bg-transparent print:text-black print:border-black">
                      Counts
                    </td>
                    {calendarData.map((day) => {
                      const isFocused = focusedDate === day.fullDate;
                      const c = day.counts;
                      return (
                        <td
                          key={day.fullDate}
                          className={`border-b border-r p-1 text-center text-[10px] ${
                            isFocused
                              ? "bg-yellow-50 ring-2 ring-yellow-400 ring-inset"
                              : ""
                          } print:border-black`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span
                              className="px-1.5 py-0.5 rounded border text-[10px] font-semibold"
                              style={getShiftStyle("M")}
                              title="Morning count"
                            >
                              M: {c.M}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded border text-[10px] font-semibold"
                              style={getShiftStyle("T")}
                              title="Afternoon count"
                            >
                              T: {c.T}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded border text-[10px] font-semibold"
                              style={getShiftStyle("N")}
                              title="Night count"
                            >
                              N: {c.N}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="bg-gray-50 print:bg-white">
                    <td className="p-2 border-b border-r font-bold text-gray-600 sticky left-0 bg-gray-50 z-10 shadow-sm print:static print:bg-transparent print:text-black print:border-black">
                      On Duty
                    </td>
                    {calendarData.map((day) => {
                      const isFocused = focusedDate === day.fullDate;
                      const total = day.counts.M + day.counts.T + day.counts.N;
                      return (
                        <td
                          key={day.fullDate}
                          className={`border-b border-r p-1 text-center text-[10px] ${
                            isFocused
                              ? "bg-yellow-50 ring-2 ring-yellow-400 ring-inset"
                              : ""
                          } print:border-black`}
                        >
                          {total}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="bg-gray-50 print:bg-white">
                    <td className="p-2 border-b border-r font-bold text-gray-600 sticky left-0 bg-gray-50 z-10 shadow-sm print:static print:bg-transparent print:text-black print:border-black">
                      Hours
                    </td>
                    {calendarData.map((day) => {
                      const isFocused = focusedDate === day.fullDate;
                      const hours =
                        day.counts.M * hoursConfig.M +
                        day.counts.T * hoursConfig.T +
                        day.counts.N * hoursConfig.N;
                      return (
                        <td
                          key={day.fullDate}
                          className={`border-b border-r p-1 text-center text-[10px] ${
                            isFocused
                              ? "bg-yellow-50 ring-2 ring-yellow-400 ring-inset"
                              : ""
                          } print:border-black`}
                        >
                          {hours}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="bg-gray-50 print:bg-white">
                    <td className="p-2 border-b border-r font-bold text-gray-600 sticky left-0 bg-gray-50 z-10 shadow-sm print:static print:bg-transparent print:text-black print:border-black">
                      Requests
                    </td>
                    {calendarData.map((day) => {
                      const isFocused = focusedDate === day.fullDate;
                      const pendingCount = Object.values(
                        day.pendingReqs || {}
                      ).filter(Boolean).length;
                      return (
                        <td
                          key={day.fullDate}
                          className={`border-b border-r p-1 text-center text-[10px] ${
                            isFocused
                              ? "bg-yellow-50 ring-2 ring-yellow-400 ring-inset"
                              : ""
                          } print:border-black`}
                        >
                          {pendingCount}
                        </td>
                      );
                    })}
                  </tr>
                  {ALL_LANGUAGES.map((lng) => (
                    <tr
                      key={`lng-${lng}`}
                      className="bg-gray-50 print:bg-white"
                    >
                      <td className="p-2 border-b border-r font-bold text-gray-600 sticky left-0 bg-gray-50 z-10 shadow-sm print:static print:bg-transparent print:text-black print:border-black">
                        {lng} Overflow
                      </td>
                      {calendarData.map((day) => {
                        const isFocused = focusedDate === day.fullDate;
                        const countM = filteredTeam.reduce((acc, emp) => {
                          return (
                            acc +
                            (day.shifts[emp.id] === "M" &&
                            emp.languages.includes(lng)
                              ? 1
                              : 0)
                          );
                        }, 0);
                        const countT = filteredTeam.reduce((acc, emp) => {
                          return (
                            acc +
                            (day.shifts[emp.id] === "T" &&
                            emp.languages.includes(lng)
                              ? 1
                              : 0)
                          );
                        }, 0);
                        const countN = filteredTeam.reduce((acc, emp) => {
                          return (
                            acc +
                            (day.shifts[emp.id] === "N" &&
                            emp.languages.includes(lng)
                              ? 1
                              : 0)
                          );
                        }, 0);

                        const ovM = Math.max(0, countM - 1);
                        const ovT = Math.max(0, countT - 1);
                        const ovN = Math.max(0, countN - 1);

                        return (
                          <td
                            key={day.fullDate}
                            className={`border-b border-r p-1 text-center text-[10px] ${
                              isFocused
                                ? "bg-yellow-50 ring-2 ring-yellow-400 ring-inset"
                                : ""
                            } print:border-black`}
                            title={`M:${countM} T:${countT} N:${countN}`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span
                                className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${
                                  ovM > 0 ? "" : "opacity-60"
                                }`}
                                style={getShiftStyle("M")}
                              >
                                M:+{ovM}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${
                                  ovT > 0 ? "" : "opacity-60"
                                }`}
                                style={getShiftStyle("T")}
                              >
                                T:+{ovT}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${
                                  ovN > 0 ? "" : "opacity-60"
                                }`}
                                style={getShiftStyle("N")}
                              >
                                N:+{ovN}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              )}
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
