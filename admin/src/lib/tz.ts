/**
 * All timestamps use Asia/Tashkent timezone (UTC+5).
 * Admin panel defaults to the admin's selected language.
 */
const TZ = "Asia/Tashkent";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  ru: "ru-RU",
  uz: "uz-UZ",
};

function toLocale(lang?: string): string {
  return LOCALE_MAP[lang || "en"] || "en-US";
}

const TODAY_LABELS: Record<string, string> = {
  en: "Today", ru: "Сегодня", uz: "Bugun",
};

/** Full datetime: "Jun 15, 09:30" (en) or "15 июн., 09:30" (ru) */
export function fmtDateTime(iso: string, lang?: string): string {
  return new Date(iso).toLocaleString(toLocale(lang), {
    timeZone: TZ, month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

/** Date only */
export function fmtDate(iso: string, lang?: string): string {
  return new Date(iso).toLocaleDateString(toLocale(lang), {
    timeZone: TZ, month: "short", day: "numeric", year: "numeric",
  });
}

/** Time only: "09:30" */
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export function isTodayTZ(iso: string): boolean {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
  return fmt.format(new Date(iso)) === fmt.format(new Date());
}

/** "Today 09:30" or locale date, using current admin lang */
export function fmtRelative(iso: string, lang?: string): string {
  const todayLabel = TODAY_LABELS[lang || "en"] || "Today";
  return isTodayTZ(iso) ? `${todayLabel} ${fmtTime(iso)}` : fmtDate(iso, lang);
}

/**
 * Format a chart period string.
 * - hint="hour":  "YYYY-MM-DD HH" or bare "HH" → "9:00"
 * - hint="day":   "YYYY-MM-DD" → "Mar 15"
 * - hint="month": "YYYY-MM" → "Mar '24"
 */
export function fmtPeriodLabel(period: string, hint: "hour" | "day" | "month", lang?: string): string {
  const locale = toLocale(lang);
  try {
    if (hint === "hour") {
      const parts = period.trim().split(" ");
      const h = parseInt(parts[parts.length - 1], 10);
      if (isNaN(h)) return period;
      return `${h}:00`;
    }
    if (hint === "month") {
      const [y, m] = period.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: "short", year: "2-digit" });
    }
    const [y, m, d] = period.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(locale, { month: "short", day: "numeric" });
  } catch { return period; }
}
