"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { passwordResetApi } from "@/lib/api";
import { ChevronLeft, Phone, KeyRound, Lock, CheckCircle } from "lucide-react";
import { useT } from "@/i18n/t";

type Step = "phone" | "code" | "password" | "done";

export default function ForgotPasswordPage() {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

  const inputCls = "w-full h-12 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm text-[rgb(var(--text))] outline-none transition focus:border-[rgb(var(--btn-bg))] placeholder:text-[rgb(var(--muted))]";

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { setError(t("forgotPw.enterPhone")); return; }
    setLoading(true); setError("");
    try {
      const res = await passwordResetApi.request(phone.trim());
      if (res.code) setDevCode(res.code);
      setStep("code");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) { setError(t("forgotPw.enterCode")); return; }
    setError(""); setStep("password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setError(t("account.passwordMismatch")); return; }
    if (newPw.length < 6) { setError(t("account.passwordTooShort")); return; }
    setLoading(true); setError("");
    try { await passwordResetApi.confirm(phone.trim(), code.trim(), newPw); setStep("done"); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const stepTitle = step === "phone" ? t("forgotPw.title")
    : step === "code" ? t("forgotPw.enterCode")
    : step === "password" ? t("forgotPw.newPassword")
    : t("forgotPw.success");

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="relative flex items-center justify-center mb-8">
          <Link href="/login"
            className="absolute left-0 flex items-center justify-center w-9 h-9 rounded-full bg-[rgb(var(--surface))] text-[rgb(var(--text))] hover:bg-[rgb(var(--border))] transition">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-[rgb(var(--text))]">{stepTitle}</h1>
        </div>

        {step === "phone" && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--surface))] flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-[rgb(var(--muted))]" />
              </div>
              <p className="text-sm text-[rgb(var(--muted))]">{t("forgotPw.enterPhone")}</p>
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <div>
              <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1.5 block">{t("auth.phone")}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder={t("auth.phonePlaceholder")} required className={inputCls} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-2xl bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] font-semibold text-sm transition hover:bg-[rgb(var(--btn-bg-hover))] disabled:opacity-60 flex items-center justify-center">
              {loading ? <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : t("forgotPw.sendCode")}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--surface))] flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6 text-[rgb(var(--muted))]" />
              </div>
              <p className="text-sm text-[rgb(var(--muted))]">{t("forgotPw.codeSent")} <span className="font-medium text-[rgb(var(--text))]">{phone}</span></p>
              {devCode && (
                <div className="mt-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-xs text-yellow-700 font-medium">Dev: <span className="font-mono">{devCode}</span></p>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <input type="text" inputMode="numeric" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000" autoFocus
              className={`${inputCls} tracking-[0.3em] text-center font-mono text-lg`} />
            <button type="submit"
              className="w-full h-12 rounded-2xl bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] font-semibold text-sm transition hover:bg-[rgb(var(--btn-bg-hover))] flex items-center justify-center">
              {t("forgotPw.verify")}
            </button>
            <button type="button" onClick={() => { setStep("phone"); setDevCode(""); }}
              className="w-full text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition">
              {t("forgotPw.changePhone")}
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--surface))] flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-[rgb(var(--muted))]" />
              </div>
              <p className="text-sm text-[rgb(var(--muted))]">{t("forgotPw.newPassword")}</p>
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")} required className={inputCls} />
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
              placeholder={t("auth.passwordPlaceholder")} required className={inputCls} />
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-2xl bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] font-semibold text-sm transition hover:bg-[rgb(var(--btn-bg-hover))] disabled:opacity-60 flex items-center justify-center">
              {loading ? <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : t("forgotPw.reset")}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-[rgb(var(--text))] mb-2">{t("forgotPw.success")}</h2>
            <p className="text-sm text-[rgb(var(--muted))] mb-6">{t("forgotPw.successMsg")}</p>
            <button onClick={() => router.push("/login")}
              className="w-full h-12 rounded-2xl bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] font-semibold text-sm transition hover:bg-[rgb(var(--btn-bg-hover))]">
              {t("forgotPw.signIn")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
