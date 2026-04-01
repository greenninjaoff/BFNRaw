"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useT } from "@/i18n/t";

function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, "");
}

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const { login, isLoading, error, clearError, user } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { if (user) router.replace("/"); }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); clearError();
    try { await login(normalizePhone(phone), password); router.replace("/"); } catch {}
  };

  const inputCls = "w-full h-12 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm text-[rgb(var(--text))] outline-none transition focus:border-[rgb(var(--btn-bg))] placeholder:text-[rgb(var(--muted))]";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[rgb(var(--text))]">{t("auth.loginHint")}</h1>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{t("common.welcomeBack")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}

          <div>
            <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1.5 block">{t("auth.phone")}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder={t("auth.phonePlaceholder")} required className={inputCls} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[rgb(var(--muted))]">{t("auth.password")}</label>
              <Link href="/forgot-password" className="text-xs text-[rgb(var(--btn-bg-hover))] hover:underline">
                {t("forgotPw.forgotLink")}
              </Link>
            </div>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")} required className={`${inputCls} pr-12`} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="mt-2 h-12 w-full rounded-2xl bg-[rgb(var(--btn-bg))] text-sm font-semibold text-[rgb(var(--btn-text))] transition hover:bg-[rgb(var(--btn-bg-hover))] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2">
            {isLoading
              ? <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
              : <><LogIn className="w-4 h-4" />{t("auth.login")}</>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[rgb(var(--muted))]">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-medium text-[rgb(var(--btn-bg-hover))] hover:underline">{t("auth.signUp")}</Link>
        </p>
      </div>
    </div>
  );
}
