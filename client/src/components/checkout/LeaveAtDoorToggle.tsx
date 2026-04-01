"use client";

import useCheckoutStore from "@/stores/checkoutStore";
import { useT } from "@/i18n/t";
import { DoorOpen } from "lucide-react";

const LeaveAtDoorToggle = () => {
  const t = useT();
  const leaveAtDoor = useCheckoutStore((s) => s.leaveAtDoor);
  const toggleLeaveAtDoor = useCheckoutStore((s) => s.toggleLeaveAtDoor);

  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="flex items-center gap-3">
        <DoorOpen className="h-5 w-5 text-[rgb(var(--muted))]" />
        <span className="text-sm text-[rgb(var(--text))]">{t("checkout.leaveAtDoor")}</span>
      </div>
      <button type="button" onClick={toggleLeaveAtDoor} role="switch" aria-checked={leaveAtDoor}
        className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${leaveAtDoor ? "bg-[rgb(var(--btn-bg))]" : "bg-[rgb(var(--border))]"}`}>
        <span className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-all duration-200 ${leaveAtDoor ? "left-[22px]" : "left-[3px]"}`} />
      </button>
    </div>
  );
};

export default LeaveAtDoorToggle;
