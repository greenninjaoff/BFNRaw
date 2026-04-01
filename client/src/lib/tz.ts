/**
 * All timestamps are displayed in Asia/Tashkent timezone (UTC+5).
 * Date locale formatting follows the active UI language.
 */
const TZ = "Asia/Tashkent";

// Map our app lang codes to BCP-47 locale strings
const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  ru: "ru-RU",
  uz: "uz-UZ",
};

function toLocale(lang?: string): string {
  return LOCALE_MAP[lang || "en"] || "en-US";
}

/** Full datetime: locale-aware, e.g. "31 мар., 21:30" in RU */
export function fmtDateTime(iso: string, lang?: string): string {
  return new Date(iso).toLocaleString(toLocale(lang), {
    timeZone: TZ, month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

/** Date only: locale-aware, e.g. "31 мар. 2024 г." in RU */
export function fmtDate(iso: string, lang?: string): string {
  return new Date(iso).toLocaleDateString(toLocale(lang), {
    timeZone: TZ, month: "short", day: "numeric", year: "numeric",
  });
}

/** Time only: "21:30" (same format regardless of locale) */
export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

/** True if iso falls on today in Tashkent TZ */
export function isTodayTZ(iso: string): boolean {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
  return fmt.format(new Date(iso)) === fmt.format(new Date());
}

/**
 * Relative date: "Today 21:30" or locale-aware full date.
 * todayLabel should come from t("common.today") so it's translated.
 */
export function fmtRelative(iso: string, lang?: string, todayLabel?: string): string {
  return isTodayTZ(iso) ? `${todayLabel || "Today"} ${fmtTime(iso)}` : fmtDate(iso, lang);
}
