"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User, ClipboardList, MapPin, Bell, Globe, Moon, LogIn,
  LogOut, Phone, X, Instagram, Send, Facebook, CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import useLangStore, { Lang } from "@/stores/langStore";
import { useT } from "@/i18n/t";
import useThemeStore from "@/stores/themeStore";
import useAuthStore from "@/stores/authStore";

const Row = ({ icon, label, href, onClick }: {
  icon: React.ReactNode; label: string; href?: string; onClick?: () => void;
}) => {
  const content = (
    <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[rgb(var(--surface))] transition">
      <span className="text-[rgb(var(--muted))]">{icon}</span>
      <span className="text-sm text-[rgb(var(--text))]">{label}</span>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return <button type="button" onClick={onClick} className="w-full text-left">{content}</button>;
};

export default function ProfileDrawer() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useT();
  const { lang, setLang } = useLangStore();
  const { theme, setTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const isLoggedIn = !!user;

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push("/");
  };

  const switchBtnBase = "px-3 py-2 rounded-md ring-1 text-sm transition-colors duration-200";
  const switchBtnActive = "bg-[rgb(var(--btn-bg))] active:bg-[rgb(var(--btn-bg-hover))] text-[rgb(var(--btn-text))] ring-transparent";
  const switchBtnInactive = "bg-transparent text-[rgb(var(--text))] ring-[rgb(var(--border))] hover:bg-[rgb(var(--btn-bg-hover)/0.15)]";

  const LangButton = ({ code }: { code: Lang }) => (
    <button type="button" onClick={() => setLang(code)}
      className={`${switchBtnBase} ${lang === code ? switchBtnActive : switchBtnInactive}`}>
      {code.toUpperCase()}
    </button>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-full ring-1 ring-[rgb(var(--border))] bg-[rgb(var(--surface))] flex items-center justify-center hover:bg-[rgb(var(--surface))] transition"
        aria-label="Open profile menu">
        <User className="w-5 h-5 text-[rgb(var(--muted))]" />
      </button>

      {open && <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)} />}

      <div className={`fixed top-0 left-0 z-50 h-full w-[320px] sm:w-[360px] bg-[rgb(var(--card))] shadow-2xl transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog" aria-modal="true">
        <div className="p-4 border-b flex items-center justify-between border-[rgb(var(--border))]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[rgb(var(--surface))] flex items-center justify-center">
              <User className="w-6 h-6 text-[rgb(var(--muted))]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[rgb(var(--text))]">
                {isLoggedIn ? (user.fullName || user.phone) : t("common.guest")}
              </span>
              <span className="text-xs text-[rgb(var(--muted))]">
                {isLoggedIn ? t("common.welcomeBack") : t("common.signInHint")}
              </span>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-full hover:bg-[rgb(var(--surface))] transition flex items-center justify-center"
            aria-label={t("common.close")}>
            <X className="w-4 h-4 text-[rgb(var(--muted))]" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-2 overflow-y-auto h-[calc(100%-72px)]">
          {!isLoggedIn ? (
            <Row icon={<LogIn className="w-4 h-4" />} label={t("common.signInUp")} href="/login" />
          ) : (
            <>
              <Row icon={<User className="w-4 h-4" />} label={t("common.accountDetails")} href="/account" />
              <Row icon={<ClipboardList className="w-4 h-4" />} label={t("common.myOrders")} href="/orders" />
              <Row icon={<MapPin className="w-4 h-4" />} label={t("common.myAddresses")} href="/locations" />
              <Row icon={<Bell className="w-4 h-4" />} label={t("common.notifications")} href="/notifications" />
              <Row icon={<CreditCard className="w-4 h-4" />} label={t("cards.title")} href="/cards" />
            </>
          )}

          <div className="border-t my-2 border-[rgb(var(--border))]" />

          <div className="px-3">
            <div className="flex items-center gap-2 text-[rgb(var(--text))]">
              <Globe className="w-4 h-4 text-[rgb(var(--muted))]" />
              <span className="text-sm">{t("common.language")}</span>
            </div>
            <div className="mt-2 flex gap-2">
              <LangButton code="ru" /><LangButton code="uz" /><LangButton code="en" />
            </div>
          </div>

          <div className="px-3">
            <div className="flex items-center gap-2 text-[rgb(var(--text))]">
              <Moon className="w-4 h-4 text-[rgb(var(--muted))]" />
              <span className="text-sm">{t("common.theme")}</span>
            </div>
            <div className="mt-2 flex gap-2">
              {(["light","dark","system"] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => setTheme(mode)}
                  className={`${switchBtnBase} ${theme === mode ? switchBtnActive : switchBtnInactive}`}>
                  {mode === "light" ? t("common.themeLight") : mode === "dark" ? t("common.themeDark") : t("common.themeSystem")}
                </button>
              ))}
            </div>
          </div>

          <a href="tel:+998781136633"
            className="rounded-xl bg-[rgb(var(--surface))] p-3 flex items-center gap-3 hover:bg-[rgb(var(--surface))] transition">
            <div className="w-10 h-10 rounded-full bg-[rgb(var(--card))] ring-1 ring-[rgb(var(--border))] flex items-center justify-center">
              <Phone className="w-5 h-5 text-[rgb(var(--muted))]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[rgb(var(--muted))]">{t("common.support")}</span>
              <span className="text-sm font-semibold text-[rgb(var(--text))]">+998 78 113 66 33</span>
            </div>
          </a>

          {isLoggedIn && (
            <Row icon={<LogOut className="w-4 h-4" />} label={t("common.signOut")} onClick={handleLogout} />
          )}

          <div className="mt-3 flex items-center gap-3 justify-center text-[rgb(var(--muted))]">
            <a href="#" aria-label="Instagram" className="hover:text-[rgb(var(--text))]"><Instagram className="w-5 h-5" /></a>
            <a href="#" aria-label="Telegram" className="hover:text-[rgb(var(--text))]"><Send className="w-5 h-5" /></a>
            <a href="#" aria-label="Facebook" className="hover:text-[rgb(var(--text))]"><Facebook className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </>
  );
}
