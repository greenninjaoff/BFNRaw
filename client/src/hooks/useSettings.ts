"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";

let cache: Record<string, string> | null = null;

export function useSettings() {
  const [settings, setSettings] = useState<Record<string, string>>(cache || {});

  useEffect(() => {
    if (cache) { setSettings(cache); return; }
    settingsApi.get()
      .then((s) => { cache = s; setSettings(s); })
      .catch(() => {});
  }, []);

  // Support both single "delivery_fee" and legacy split keys
  const deliveryFee = Number(
    settings["delivery_fee"] ??
    settings["delivery_fee_standard"] ??
    9900
  );
  // Service fee is 0 - removed from checkout flow
  const serviceFee = 0;

  return { settings, deliveryFee, serviceFee };
}
