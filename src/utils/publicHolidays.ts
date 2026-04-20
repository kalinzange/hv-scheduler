import { GOOGLE_CALENDAR_API_KEY } from "../config/constants";

const HOLIDAY_CACHE_PREFIX = "hv_scheduler_public_holidays_google_v3";
const SUBDIVISION_CACHE_PREFIX = "hv_scheduler_subdivisions";
const HOLIDAY_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface PublicHolidayEntry {
  date: string;
  name?: string;
  required: boolean;
  optional: boolean;
  national: boolean;
  regional: boolean;
  regions: string[];
}

interface HolidayCacheEntry {
  entries: PublicHolidayEntry[];
  fetchedAt: number;
  source?: "google" | "google+regional";
}

interface SubdivisionCacheEntry {
  items: HolidaySubdivision[];
  fetchedAt: number;
}

export interface HolidaySubdivision {
  code: string;
  name: string;
  type: string;
}

interface OpenHolidaySubdivisionNode {
  code?: string;
  shortName?: string;
  name?: Array<{ language?: string; text?: string }>;
  category?: Array<{ language?: string; text?: string }>;
  children?: OpenHolidaySubdivisionNode[];
}

const GOOGLE_HOLIDAY_CALENDAR_IDS: Record<string, string> = {
  PT: "en.portuguese#holiday@group.v.calendar.google.com",
  ES: "en.spain#holiday@group.v.calendar.google.com",
  FR: "en.french#holiday@group.v.calendar.google.com",
  DE: "en.german#holiday@group.v.calendar.google.com",
  IT: "en.italian#holiday@group.v.calendar.google.com",
  GB: "en.uk#holiday@group.v.calendar.google.com",
  US: "en.usa#holiday@group.v.calendar.google.com",
  BR: "en.brazilian#holiday@group.v.calendar.google.com",
  TR: "en.turkish#holiday@group.v.calendar.google.com",
  IN: "en.indian#holiday@group.v.calendar.google.com",
};

const inFlightRequests = new Map<string, Promise<PublicHolidayEntry[]>>();

const makeCacheKey = (countryCode: string, year: number) => {
  return `${HOLIDAY_CACHE_PREFIX}:${countryCode}:${year}`;
};

const makeSubdivisionCacheKey = (countryCode: string) => {
  return `${SUBDIVISION_CACHE_PREFIX}:${countryCode}`;
};

const isIsoDate = (value: string) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const expandDateRange = (from: string, to: string) => {
  if (!isIsoDate(from) || !isIsoDate(to)) return [];

  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (end < start) return [];

  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const normalizeEntries = (
  entries: PublicHolidayEntry[],
): PublicHolidayEntry[] => {
  const byDate = new Map<string, PublicHolidayEntry>();

  entries.forEach((entry) => {
    if (!isIsoDate(entry.date)) return;
    const existing = byDate.get(entry.date);
    if (!existing) {
      byDate.set(entry.date, {
        date: entry.date,
        name: entry.name,
        required: !!entry.required,
        optional: !!entry.optional,
        national: !!entry.national,
        regional: !!entry.regional,
        regions: Array.isArray(entry.regions) ? entry.regions : [],
      });
      return;
    }

    const mergedRegions = Array.from(
      new Set([...(existing.regions || []), ...(entry.regions || [])]),
    ).sort();

    byDate.set(entry.date, {
      date: entry.date,
      name: existing.name || entry.name,
      required: existing.required || !!entry.required,
      optional: existing.optional || !!entry.optional,
      national: existing.national || !!entry.national,
      regional: existing.regional || !!entry.regional,
      regions: mergedRegions,
    });
  });

  return Array.from(byDate.values()).sort((left, right) =>
    left.date.localeCompare(right.date),
  );
};

const loadCachedYear = (
  countryCode: string,
  year: number,
): { entries: PublicHolidayEntry[]; isFresh: boolean } | null => {
  try {
    const raw = localStorage.getItem(makeCacheKey(countryCode, year));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as HolidayCacheEntry & { dates?: string[] };
    if (!parsed || !parsed.fetchedAt) {
      return null;
    }

    const rawEntries = Array.isArray(parsed.entries)
      ? parsed.entries
      : Array.isArray(parsed.dates)
        ? parsed.dates.map((date) => ({
            date,
            name: undefined,
            required: true,
            optional: false,
            national: true,
            regional: false,
            regions: [],
          }))
        : [];

    const hasLegacyEntriesWithoutRegions = Array.isArray(parsed.entries)
      ? parsed.entries.some((entry) => {
          const unknownEntry = entry as unknown;
          if (!unknownEntry || typeof unknownEntry !== "object") return false;
          return (
            !("regions" in unknownEntry) ||
            !("required" in unknownEntry) ||
            !("optional" in unknownEntry)
          );
        })
      : false;
    const hasLegacyEntriesWithoutNames = Array.isArray(parsed.entries)
      ? parsed.entries.length > 0 &&
        parsed.entries.every((entry) => {
          const unknownEntry = entry as unknown;
          if (!unknownEntry || typeof unknownEntry !== "object") return true;
          if (!("name" in unknownEntry)) return true;
          const value = (unknownEntry as { name?: unknown }).name;
          return typeof value !== "string" || value.trim().length === 0;
        })
      : false;
    const hasCriticalEntriesMissingNames = Array.isArray(parsed.entries)
      ? parsed.entries.some((entry) => {
          const unknownEntry = entry as unknown;
          if (!unknownEntry || typeof unknownEntry !== "object") return false;

          const raw = unknownEntry as {
            name?: unknown;
            national?: unknown;
            required?: unknown;
          };

          const missingName =
            typeof raw.name !== "string" || raw.name.trim().length === 0;
          const isCritical = raw.national === true || raw.required === true;

          return isCritical && missingName;
        })
      : false;
    const isLegacyDatesOnlyCache =
      !Array.isArray(parsed.entries) && Array.isArray(parsed.dates);

    const cleaned = normalizeEntries(rawEntries);
    const isGoogleSourceCache =
      parsed.source === "google" || parsed.source === "google+regional";

    const isFresh =
      isGoogleSourceCache &&
      !hasLegacyEntriesWithoutRegions &&
      !hasLegacyEntriesWithoutNames &&
      !hasCriticalEntriesMissingNames &&
      !isLegacyDatesOnlyCache &&
      Date.now() - parsed.fetchedAt < HOLIDAY_CACHE_TTL_MS;

    return { entries: cleaned, isFresh };
  } catch {
    return null;
  }
};

const saveCachedYear = (
  countryCode: string,
  year: number,
  entries: PublicHolidayEntry[],
) => {
  try {
    const payload: HolidayCacheEntry = {
      entries,
      fetchedAt: Date.now(),
      source: "google+regional",
    };
    localStorage.setItem(
      makeCacheKey(countryCode, year),
      JSON.stringify(payload),
    );
  } catch {
    // Ignore storage quota/privacy mode errors and continue.
  }
};

const getLocalizedText = (
  values: Array<{ language?: string; text?: string }> | undefined,
  preferredLanguages: string[] = ["EN", "PT"],
) => {
  if (!Array.isArray(values) || values.length === 0) return "";

  for (const lang of preferredLanguages) {
    const found = values.find((value) => value?.language === lang)?.text;
    if (found) return found;
  }

  return values[0]?.text || "";
};

const normalizeSubdivisions = (
  items: HolidaySubdivision[],
): HolidaySubdivision[] => {
  const map = new Map<string, HolidaySubdivision>();

  items.forEach((item) => {
    if (!item?.code) return;
    map.set(item.code, {
      code: item.code,
      name: item.name || item.code,
      type: item.type || "region",
    });
  });

  return Array.from(map.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
};

const loadCachedSubdivisions = (
  countryCode: string,
): { items: HolidaySubdivision[]; isFresh: boolean } | null => {
  try {
    const raw = localStorage.getItem(makeSubdivisionCacheKey(countryCode));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SubdivisionCacheEntry;
    if (!parsed || !Array.isArray(parsed.items) || !parsed.fetchedAt) {
      return null;
    }

    const normalized = normalizeSubdivisions(parsed.items);
    const isFresh = Date.now() - parsed.fetchedAt < HOLIDAY_CACHE_TTL_MS;
    return { items: normalized, isFresh };
  } catch {
    return null;
  }
};

const saveCachedSubdivisions = (
  countryCode: string,
  items: HolidaySubdivision[],
) => {
  try {
    const payload: SubdivisionCacheEntry = {
      items,
      fetchedAt: Date.now(),
    };
    localStorage.setItem(
      makeSubdivisionCacheKey(countryCode),
      JSON.stringify(payload),
    );
  } catch {
    // Ignore storage-related errors.
  }
};

const flattenSubdivisions = (
  nodes: OpenHolidaySubdivisionNode[],
): HolidaySubdivision[] => {
  const items: HolidaySubdivision[] = [];

  const walk = (nodeList: OpenHolidaySubdivisionNode[]) => {
    nodeList.forEach((node) => {
      const code = node?.code;
      if (code) {
        const name = getLocalizedText(node?.name) || node?.shortName || code;
        const type = getLocalizedText(node?.category) || "region";
        items.push({ code, name, type });
      }

      if (Array.isArray(node?.children) && node.children.length > 0) {
        walk(node.children);
      }
    });
  };

  walk(nodes);
  return normalizeSubdivisions(items);
};

export const loadHolidaySubdivisions = async (
  countryCode: string,
): Promise<HolidaySubdivision[]> => {
  const cached = loadCachedSubdivisions(countryCode);
  if (cached?.isFresh) {
    return cached.items;
  }

  const response = await fetch(
    `https://openholidaysapi.org/Subdivisions?countryIsoCode=${countryCode}`,
  );

  if (!response.ok) {
    if (cached?.items?.length) {
      return cached.items;
    }
    throw new Error(`OpenHolidays Subdivisions API error: ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    code?: string;
    shortName?: string;
    name?: Array<{ language?: string; text?: string }>;
    category?: Array<{ language?: string; text?: string }>;
    children?: OpenHolidaySubdivisionNode[];
  }>;

  const normalized = flattenSubdivisions(Array.isArray(payload) ? payload : []);
  saveCachedSubdivisions(countryCode, normalized);
  return normalized;
};

const OPTIONAL_GOOGLE_KEYWORDS = [
  "mother",
  "mothers",
  "father",
  "fathers",
  "women",
  "woman",
  "children",
  "child",
  "valentine",
  "halloween",
  "carnival",
  "eve",
  "observance",
  "dia da mãe",
  "dia do pai",
  "dia da mulher",
  "dia da criança",
  "dia dos namorados",
  "dia de todos os santos",
  "día de la madre",
  "día del padre",
  "día del niño",
  "día de la mujer",
  "día de san valentín",
];

const REQUIRED_GOOGLE_KEYWORDS = [
  "new year",
  "christmas",
  "independence",
  "republic",
  "constitution",
  "labour",
  "national day",
  "good friday",
  "easter",
  "assumption",
  "all saints",
  "immaculate",
  "epiphany",
  "pentecost",
];

const isOptionalGoogleEvent = (summary: string, description?: string) => {
  const normalized = `${summary} ${description || ""}`.toLowerCase();
  if (
    normalized.includes("observance") ||
    normalized.includes("to hide observances")
  ) {
    return true;
  }
  if (REQUIRED_GOOGLE_KEYWORDS.some((token) => normalized.includes(token))) {
    return false;
  }

  return OPTIONAL_GOOGLE_KEYWORDS.some((token) => normalized.includes(token));
};

const fetchFromGoogleHolidaysForYear = async (
  countryCode: string,
  year: number,
): Promise<PublicHolidayEntry[]> => {
  const calendarId = GOOGLE_HOLIDAY_CALENDAR_IDS[countryCode];
  if (!calendarId) {
    throw new Error(
      `Google Holidays calendar not configured for ${countryCode}`,
    );
  }

  const timeMin = `${year}-01-01T00:00:00Z`;
  const timeMax = `${year + 1}-01-01T00:00:00Z`;
  const encodedCalendarId = encodeURIComponent(calendarId);

  if (!GOOGLE_CALENDAR_API_KEY) {
    throw new Error(
      "Google Calendar API key not configured. Set GOOGLE_CALENDAR_API_KEY in your .env (must be a dedicated Calendar-only GCP key, not the Firebase key).",
    );
  }

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events` +
    `?key=${encodeURIComponent(GOOGLE_CALENDAR_API_KEY)}` +
    `&singleEvents=true&orderBy=startTime` +
    `&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=2500`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Holidays API error: ${response.status}`);
  }

  const payload = (await response.json()) as {
    items?: Array<{
      summary?: string;
      description?: string;
      start?: { date?: string; dateTime?: string };
      end?: { date?: string; dateTime?: string };
    }>;
  };

  const entries = Array.isArray(payload.items)
    ? payload.items
        .flatMap((item) => {
          const summary = (item?.summary || "").trim();
          const description = (item?.description || "").trim();
          const startDate =
            item?.start?.date || item?.start?.dateTime?.slice(0, 10);
          const endDateRaw =
            item?.end?.date || item?.end?.dateTime?.slice(0, 10);

          if (!startDate || !isIsoDate(startDate)) return [];

          const endDate =
            endDateRaw && isIsoDate(endDateRaw)
              ? (() => {
                  const date = new Date(`${endDateRaw}T00:00:00`);
                  date.setDate(date.getDate() - 1);
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  return `${y}-${m}-${d}`;
                })()
              : startDate;

          const isOptional = isOptionalGoogleEvent(summary, description);

          return expandDateRange(startDate, endDate).map((date) => ({
            date,
            name: summary || undefined,
            required: !isOptional,
            optional: isOptional,
            national: true,
            regional: false,
            regions: [],
          }));
        })
        .filter((entry) => isIsoDate(entry.date))
    : [];

  return normalizeEntries(entries);
};

const fetchFromOpenHolidaysForYear = async (
  countryCode: string,
  year: number,
): Promise<PublicHolidayEntry[]> => {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const response = await fetch(
    `https://openholidaysapi.org/PublicHolidays?countryIsoCode=${countryCode}&languageIsoCode=EN&validFrom=${from}&validTo=${to}`,
  );

  if (!response.ok) {
    throw new Error(`OpenHolidays API error: ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    startDate?: string;
    endDate?: string;
    name?: Array<{ language?: string; text?: string }>;
    type?: string;
    regionalScope?: string;
    nationwide?: boolean;
    subdivisions?: Array<{ code?: string; shortName?: string }>;
  }>;

  const entries = Array.isArray(payload)
    ? payload
        .flatMap((item) => {
          const startDate = item?.startDate;
          const endDate = item?.endDate || item?.startDate;
          if (!startDate || !endDate) return [];

          const regions = Array.isArray(item?.subdivisions)
            ? item.subdivisions
                .map((subdivision) => subdivision?.code)
                .filter((value): value is string => !!value)
            : [];

          const isNational =
            item?.nationwide === true || item?.regionalScope === "National";
          const isRegional = !isNational || regions.length > 0;

          const name = getLocalizedText(item?.name);
          const isOptional = item?.type === "Optional";

          return expandDateRange(startDate, endDate).map((date) => ({
            date,
            name,
            required: !isOptional,
            optional: isOptional,
            national: isNational,
            regional: isRegional,
            regions,
          }));
        })
        .filter((entry) => isIsoDate(entry.date))
    : [];

  return normalizeEntries(entries);
};

const fetchHolidaysForYear = async (
  countryCode: string,
  year: number,
): Promise<PublicHolidayEntry[]> => {
  const requestKey = `${countryCode}:${year}`;

  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  const request = (async () => {
    const cached = loadCachedYear(countryCode, year);
    if (cached?.isFresh) {
      return cached.entries;
    }

    try {
      const normalized = await fetchFromGoogleHolidaysForYear(
        countryCode,
        year,
      );

      let openHolidayEntries: PublicHolidayEntry[] = [];
      try {
        openHolidayEntries = await fetchFromOpenHolidaysForYear(
          countryCode,
          year,
        );
      } catch {
        openHolidayEntries = [];
      }

      const googleDates = new Set(normalized.map((entry) => entry.date));
      const missingEntries = openHolidayEntries.filter((entry) => {
        if (entry.regional || entry.regions.length > 0) return true;
        return !googleDates.has(entry.date);
      });

      const merged = normalizeEntries([...normalized, ...missingEntries]);
      saveCachedYear(countryCode, year, merged);
      return merged;
    } catch {
      if (cached?.entries?.length) {
        return cached.entries;
      }
      try {
        const fallback = await fetchFromOpenHolidaysForYear(countryCode, year);
        saveCachedYear(countryCode, year, fallback);
        return fallback;
      } catch {
        throw new Error("Unable to fetch Google public holidays");
      }
    }
  })();

  inFlightRequests.set(requestKey, request);

  try {
    return await request;
  } finally {
    inFlightRequests.delete(requestKey);
  }
};

export const loadPublicHolidays = async (
  countryCode: string,
  years: number[],
): Promise<PublicHolidayEntry[]> => {
  const uniqueYears = Array.from(new Set(years)).sort((a, b) => a - b);
  const results = await Promise.all(
    uniqueYears.map((year) => fetchHolidaysForYear(countryCode, year)),
  );

  return normalizeEntries(results.flat());
};
