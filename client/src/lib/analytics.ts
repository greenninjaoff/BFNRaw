/**
 * Funnel event tracker - sends events to backend for conversion funnel analytics.
 * Uses sessionId from localStorage for anonymous tracking, userId when logged in.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const EVENT_TYPES = ["PRODUCT_VIEW","ADD_TO_CART","CHECKOUT_START","ORDER_PLACED","PAYMENT_SUCCESS"] as const;
type EventType = typeof EVENT_TYPES[number];

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_sid");
  if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem("_sid", sid); }
  return sid;
}

function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("auth");
    return raw ? JSON.parse(raw)?.state?.user?.id ?? null : null;
  } catch { return null; }
}

export function trackEvent(
  eventType: EventType,
  extra?: { productId?: string; orderId?: string; metadata?: Record<string, unknown> }
) {
  if (typeof window === "undefined") return;
  try {
    fetch(`${API_BASE}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        sessionId: getSessionId(),
        userId:    getUserId(),
        productId: extra?.productId ?? null,
        orderId:   extra?.orderId   ?? null,
        metadata:  extra?.metadata  ?? null,
      }),
      // Fire and forget - don't await, don't block UI
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
