import type {
  Role,
  Language,
  Employee,
  FeatureToggles,
  ShiftOptionsByRole,
} from "../types";

// --- FIREBASE CONFIGURATION ---
// Configuration is loaded from environment variables (.env file)
// See .env.example for all available configuration options
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const APP_ID = import.meta.env.VITE_APP_ID;

// --- GOOGLE CALENDAR API CONFIGURATION ---
// Fall back to the Firebase API key when a dedicated Calendar API key is not set.
export const GOOGLE_CALENDAR_API_KEY =
  import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY || FIREBASE_CONFIG.apiKey;

// NOTE: Master passwords must NOT be exposed in client code.
// They are validated server-side via Netlify Function `role-login` using environment variables.

// --- ROLES & PERMISSIONS CONFIG ---
export const ROLES: Record<string, Role> = {
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
  ADMIN: {
    id: "admin",
    label: "Admin",
    role: "admin",
    permissions: ["read", "write", "admin", "approve", "system"],
    description: "Administrative access to manage users and system settings.",
  },
};

export const DEFAULT_FEATURE_TOGGLES: FeatureToggles = {
  roles: {
    viewer: {
      viewCalendar: true,
      editSchedule: false,
      bulkActions: false,
      viewRequests: false,
      publishSchedule: false,
      exportCsv: false,
      fileBackup: false,
      viewStats: true,
      viewAnnual: true,
      configPanel: false,
      viewCoverage: false,
    },
    editor: {
      viewCalendar: true,
      editSchedule: true,
      bulkActions: false,
      viewRequests: false,
      publishSchedule: false,
      exportCsv: false,
      fileBackup: false,
      viewStats: true,
      viewAnnual: true,
      configPanel: false,
      viewCoverage: true,
    },
    manager: {
      viewCalendar: true,
      editSchedule: true,
      bulkActions: true,
      viewRequests: true,
      publishSchedule: true,
      exportCsv: true,
      fileBackup: true,
      viewStats: true,
      viewAnnual: true,
      configPanel: true,
      viewCoverage: true,
    },
  },
};

export const DEFAULT_SHIFT_OPTIONS_BY_ROLE: ShiftOptionsByRole = {
  viewer: ["F", "V", "S"],
  editor: ["F", "V", "S"],
  manager: ["M", "T", "N", "F", "V", "S", "TR"],
};

// --- CONSTANTS ---
export const ALL_LANGUAGES: Language[] = [
  "EN",
  "DE",
  "IT",
  "FR",
  "PT",
  "TR",
  "ES",
];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTHS = [
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

export const DEFAULT_HOLIDAYS = [
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

export const DEFAULT_HOLIDAY_COUNTRY = "PT";

export const SUPPORTED_HOLIDAY_COUNTRIES = [
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Spain" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "BR", name: "Brazil" },
  { code: "TR", name: "Turkey" },
  { code: "IN", name: "India" },
];

export const INITIAL_TEAM: Employee[] = [
  {
    id: 4,
    name: "Huyesin Gozcu",
    role: "GCC",
    languages: ["EN", "TR", "PT"],
    password: "1234",
  },
  {
    id: 6,
    name: "Lourdes Gutierrez",
    role: "GCC",
    languages: ["EN", "ES", "PT"],
    password: "1234",
  },
  {
    id: 11,
    name: "Sergio Ribeiro",
    role: "TL",
    languages: ["EN", "FR", "PT"],
    password: "1234",
  },
  {
    id: 2,
    name: "Filipe Cardoso",
    role: "TL",
    languages: ["EN", "FR", "PT"],
    password: "1234",
  },
  {
    id: 8,
    name: "Joao Monteiro",
    role: "GCC",
    languages: ["EN", "PT"],
    password: "1234",
  },
  {
    id: 14,
    name: "Juliana Andrade",
    role: "GCC",
    languages: ["EN", "PT"],
    password: "1234",
  },
  {
    id: 10,
    name: "Rita Quaresma",
    role: "GCC",
    languages: ["EN", "PT", "ES"],
    password: "1234",
  },
  {
    id: 5,
    name: "Hugo Rodrigues",
    role: "GCC",
    languages: ["EN", "PT"],
    password: "1234",
  },
  {
    id: 9,
    name: "Miguel Geada",
    role: "GCC",
    languages: ["EN", "PT"],
    password: "1234",
  },
  {
    id: 7,
    name: "Lucas Alves",
    role: "GCC",
    languages: ["EN", "PT"],
    password: "1234",
  },
];
