"use client";

import Image from "next/image";
import Link from "next/link";
import SearchBar from "./SearchBar";
import { Bell } from "lucide-react";
import ShoppingCartIcon from "./ShoppingCartIcon";
import ProfileDrawer from "./ProfileDrawer";
import { useEffect, useState } from "react";
import { notificationsApi } from "@/lib/api";
import useAuthStore from "@/stores/authStore";

function NotifBell() {
  const { user } = useAuthStore();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    notificationsApi.getAll()
      .then((ns: any[]) => setUnread(ns.filter((n) => !n.isRead).length))
      .catch(() => {});
    // Re-check every 60 seconds
    const id = setInterval(() => {
      notificationsApi.getAll()
        .then((ns: any[]) => setUnread(ns.filter((n) => !n.isRead).length))
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, [user]);

  return (
    <Link href="/notifications" aria-label="Notifications"
      className="relative text-[rgb(var(--text))] hover:opacity-70 transition-opacity">
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

const Navbar = () => (
  <nav className="w-full flex items-center justify-between border-b border-[rgb(var(--border))] pb-4">
    <Link href="/" className="flex items-center gap-2">
      <Image src="/logos/logo.png" alt="Befit Nutrition" width={36} height={36} className="w-8 h-6 md:w-12 md:h-9" />
      <p className="hidden md:block text-md font-medium tracking-wider text-[rgb(var(--text))]">Befit Nutrition</p>
    </Link>
    <div className="flex items-center gap-5">
      <SearchBar />
      <NotifBell />
      <ShoppingCartIcon />
      <ProfileDrawer />
    </div>
  </nav>
);

export default Navbar;
