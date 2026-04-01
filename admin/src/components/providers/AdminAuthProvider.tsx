"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import useAdminAuthStore from "@/stores/adminAuthStore";
import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useAdminAuthStore();
  const [hydrated, setHydrated] = useState(false);

  // Wait for zustand to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoginPage && (!token || !user)) {
      router.replace("/login");
    }
    if (isLoginPage && token && user) {
      router.replace("/");
    }
  }, [hydrated, token, user, isLoginPage, router]);

  // Loading state before hydration
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  // Login page - render without sidebar
  if (isLoginPage) {
    if (token && user) return null; // redirecting
    return <>{children}</>;
  }

  // Protected pages - must have auth
  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  // Authenticated - render full app shell
  return (
    <SidebarProvider defaultOpen>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <Navbar />
          <div className="px-4 pb-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
