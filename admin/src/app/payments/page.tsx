"use client";

import { CreditCard, Info } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto gap-4">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
        <CreditCard className="w-7 h-7 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-bold mb-1">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Payment gateway integration (Payme / Click / ATMOS) is not yet
          connected. This page will show real transaction history once a
          payment provider is configured.
        </p>
      </div>
      <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-2.5 text-left">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Order payments are currently tracked via{" "}
          <span className="font-mono text-foreground">Order.paymentMethod</span>{" "}
          and <span className="font-mono text-foreground">Order.status</span>.
          Connect a payment provider to enable full transaction analytics.
        </p>
      </div>
    </div>
  );
}
