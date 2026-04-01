"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/stores/authStore";
import { User, Phone, Lock, CheckCircle, CreditCard, MapPin, ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useT } from "@/i18n/t";

const inputCls = "w-full h-12 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm text-[rgb(var(--text))] outline-none transition focus:border-[rgb(var(--btn-bg))] placeholder:text-[rgb(var(--muted))]";

export default function AccountPage() {
  const t = useT();
  const router = useRouter();
  const { user, isLoading, error, updateProfile, changePassword, clearError } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    setFullName(user.fullName || ""); setPhone(user.phone || "");
  }, [user, router]);

  if (!user) return null;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault(); clearError(); setProfileSuccess(false);
    try {
      await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      setProfileSuccess(true); setTimeout(() => setProfileSuccess(false), 3000);
    } catch {}
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError(""); setPwSuccess(false);
    if (newPw !== confirmPw) { setPwError(t("account.passwordMismatch")); return; }
    if (newPw.length < 6) { setPwError(t("account.passwordTooShort")); return; }
    try {
      await changePassword(currentPw, newPw);
      setPwSuccess(true); setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e: any) { setPwError(e.message); }
  };

  const quickLinks = [
    { href: "/cards", icon: <CreditCard className="w-4 h-4" />, label: t("cards.title") },
    { href: "/locations", icon: <MapPin className="w-4 h-4" />, label: t("common.myAddresses") },
    { href: "/orders", icon: <User className="w-4 h-4" />, label: t("common.myOrders") },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="relative"><PageHeader title={t("account.title")} backFallback="/" /></div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {quickLinks.map(({ href, icon, label }) => (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] hover:border-[rgb(var(--btn-bg))] transition group">
            <span className="text-[rgb(var(--muted))] group-hover:text-[rgb(var(--text))] transition">{icon}</span>
            <span className="text-xs text-[rgb(var(--muted))] text-center leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      {/* Personal info */}
      <div className="rounded-2xl bg-[rgb(var(--card))] p-6 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[rgb(var(--surface))] flex items-center justify-center">
            <User className="w-4 h-4 text-[rgb(var(--muted))]" />
          </div>
          <h2 className="text-sm font-semibold text-[rgb(var(--text))]">{t("account.personalInfo")}</h2>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {profileSuccess && <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle className="w-4 h-4" />{t("account.saved")}</div>}
          <div>
            <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1.5 block">{t("account.fullName")}</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("auth.namePlaceholder")} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-[rgb(var(--muted))] mb-1.5 block">{t("account.phone")}</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted))]" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder={t("auth.phonePlaceholder")} className={`${inputCls} pl-11`} />
            </div>
          </div>
          <button type="submit" disabled={isLoading}
            className="w-full h-11 rounded-2xl bg-[rgb(var(--btn-bg))] text-[rgb(var(--btn-text))] text-sm font-semibold transition hover:bg-[rgb(var(--btn-bg-hover))] disabled:opacity-60 flex items-center justify-center">
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : t("account.save")}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-2xl bg-[rgb(var(--card))] p-6 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[rgb(var(--surface))] flex items-center justify-center">
            <Lock className="w-4 h-4 text-[rgb(var(--muted))]" />
          </div>
          <h2 className="text-sm font-semibold text-[rgb(var(--text))]">{t("account.changePassword")}</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          {pwError && <p className="text-sm text-red-500">{pwError}</p>}
          {pwSuccess && <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle className="w-4 h-4" />{t("account.passwordChanged")}</div>}
          <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
            placeholder={t("account.currentPassword")} required className={inputCls} />
          <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
            placeholder={t("account.newPassword")} required className={inputCls} />
          <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
            placeholder={t("account.confirmPassword")} required className={inputCls} />
          <button type="submit" disabled={isLoading}
            className="w-full h-11 rounded-2xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text))] text-sm font-semibold transition hover:bg-[rgb(var(--border))] disabled:opacity-60 flex items-center justify-center">
            {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : t("account.updatePassword")}
          </button>
        </form>
        {/* Forgot password shortcut */}
        <Link href="/forgot-password"
          className="mt-3 flex items-center justify-between text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition py-2">
          <span>{t("forgotPw.forgotLink")}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
