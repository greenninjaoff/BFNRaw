"use client";
import useAdminLangStore from "@/stores/adminLangStore";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useAdminAuthStore from "@/stores/adminAuthStore";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const { t } = useAdminLangStore();
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAdminAuthStore();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(phone.trim(), password);
      router.push("/");
    } catch {
      // error shown from store
    }
  };

  const inputCls =
    "w-full h-11 rounded-lg border bg-background px-4 text-sm outline-none focus:border-primary transition placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-lime-400 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold">Befit Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auth.signIn")} - Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 000 00 00"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 h-11 w-full rounded-lg bg-lime-400 hover:bg-lime-500 text-sm font-semibold text-black transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
            ) : t("auth.signIn")}
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-muted-foreground">
          Admin access only. Contact your system administrator.
        </p>
      </div>
    </div>
  );
}
