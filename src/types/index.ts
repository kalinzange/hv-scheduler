// --- TYPE DEFINITIONS ---

export type ShiftType = "M" | "T" | "N" | "F";
export type OverrideType = ShiftType | "V" | "S"; // V=Vacation, S=Sick
export type Language = "EN" | "DE" | "IT" | "FR" | "PT" | "TR" | "ES";
export type RotationMode = "STANDARD" | "FIXED_M" | "FIXED_T" | "FIXED_N";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type LangCode = "en";
export type SortOrder = "Default" | "AZ" | "ZA" | "LANG" | "ROLE";
export type RoleId = "viewer" | "editor" | "manager" | "admin";

export interface RotationConfig {
  morningDays: number;
  afternoonDays: number;
  nightDays: number;
  nightOffs: number;
  autoAdjustOffs: boolean;
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  languages: Language[];
  offset: number;
  rotationMode?: RotationMode;
  password?: string;
  requirePasswordChange?: boolean;
}

export interface ShiftRequest {
  id: string;
  empId: number;
  empName: string;
  date: string; // ISO Date string
  newShift: OverrideType | undefined; // undefined means clear/reset
  status: RequestStatus;
  timestamp: number;
}

export interface Role {
  id: RoleId;
  label: string;
  role: RoleId;
  permissions: string[];
  description: string;
}

export interface Translations {
  [key: string]: string;
}

export interface HoursConfig {
  targetHoursPerMonth: number;
  hoursPerShift: { [key in ShiftType]: number };
}

export interface ShiftLegend {
  code: ShiftType | "V" | "S" | "F";
  label: string;
  hours?: number;
}

export interface ColorConfig {
  [key: string]: string;
}

export interface AccessMode {
  role: RoleId;
  label: string;
}

// Component Props Interfaces

export interface LoginModalProps {
  show: boolean;
  selectedUser: string;
  setSelectedUser: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleClose: () => void;
  isEditor: boolean;
  team: Employee[];
  currentUser: { name: string; role: RoleId; empId: number | null };
  handleChangePassword: (newPassword: string, confirmPassword: string) => void;
  onTeamUpdate: (updater: (prev: Employee[]) => Employee[]) => void;
  t: Translations;
}

export interface AdminPanelProps {
  show: boolean;
  team: Employee[];
  setTeam: React.Dispatch<React.SetStateAction<Employee[]>>;
}

export interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Array<{
    name: string;
    M: number;
    T: number;
    N: number;
    WE: number;
    V: number;
    total: number;
    hours: number;
    balance: number;
  }>;
  t: Translations;
  hoursConfig: HoursConfig;
}

export interface BulkActionsModalProps {
  show: boolean;
  onClose: () => void;
  selectedDates: string[];
  selectedEmpId: string;
  setSelectedEmpId: (value: string) => void;
  shiftType: OverrideType | "CLEAR";
  setShiftType: (value: OverrideType | "CLEAR") => void;
  handleBulkApply: () => void;
  handleBulkClear: () => void;
  isManager: boolean;
  team: Employee[];
  loggedInUserId: number | null;
  t: Translations;
}

export interface ShiftEditorModalProps {
  editingCell: {
    key: string;
    x: number;
    y: number;
    empName: string;
    date: string;
  } | null;
  onClose: () => void;
  handleOverride: (key: string, value: OverrideType | undefined) => void;
  effectiveOverrides: { [key: string]: OverrideType };
  t: Translations;
}

export interface NotificationBadgeProps {
  show: boolean;
  requests: ShiftRequest[];
  onOpenRequests: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label?: string;
}

export interface EditingCell {
  key: string;
  x: number;
  y: number;
  empName: string;
  date: string;
}

export interface CalendarData {
  dates: string[];
  empRows: Array<{
    emp: Employee;
    shifts: OverrideType[];
    pendingReqs: boolean[];
  }>;
}
