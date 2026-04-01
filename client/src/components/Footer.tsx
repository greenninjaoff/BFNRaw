"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/i18n/t";

const Footer = () => {
  const t = useT();

  return (
    <footer className="hidden md:block mt-16 bg-[rgb(var(--card))] rounded-2xl p-8">
      <div className="grid grid-cols-4 gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logos/logo.png" alt="Befit Nutrition" width={36} height={36} className="w-9 h-9" />
            <span className="text-sm font-semibold text-[rgb(var(--text))]">Befit Nutrition</span>
          </Link>
          <p className="text-xs text-[rgb(var(--muted))] leading-relaxed">
            Nutrition for a better life.
          </p>
          <p className="text-xs text-[rgb(var(--muted))]">© 2025 Befit. {t("footer.rights")}</p>
        </div>

        {/* Pages */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-[rgb(var(--text))] uppercase tracking-wider">{t("footer.links")}</p>
          <Link href="/" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition">{t("footer.homepage")}</Link>
          <Link href="/products" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition">{t("footer.allProducts")}</Link>
          <Link href="/" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition">{t("footer.contact")}</Link>
        </div>

        {/* Products */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-[rgb(var(--text))] uppercase tracking-wider">{t("footer.allProducts")}</p>
          <Link href="/products" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition">{t("footer.newArrivals")}</Link>
          <Link href="/products" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition">{t("footer.bestSellers")}</Link>
          <Link href="/products" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition">{t("footer.sale")}</Link>
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-[rgb(var(--text))] uppercase tracking-wider">{t("footer.about")}</p>
          <Link href="/" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition">{t("footer.about")}</Link>
          <Link href="/" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition">{t("footer.terms")}</Link>
          <Link href="/" className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition">{t("footer.privacy")}</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
