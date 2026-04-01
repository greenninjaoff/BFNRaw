"use client";

import { Moon, Sun, LogOut, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import useAdminAuthStore from "@/stores/adminAuthStore";
import useAdminLangStore, { AdminLang } from "@/stores/adminLangStore";
import { useRouter } from "next/navigation";

const LANGS: { value: AdminLang; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "ru", label: "Русский", flag: "🇷🇺" },
  { value: "uz", label: "O'zbekcha", flag: "🇺🇿" },
];

const Navbar = () => {
  const { setTheme } = useTheme();
  const { user, logout } = useAdminAuthStore();
  const { lang, setLang, t } = useAdminLangStore();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push("/login"); };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  const currentLang = LANGS.find((l) => l.value === lang) || LANGS[0];

  return (
    <nav className="p-4 flex items-center justify-between sticky top-0 bg-background z-10 border-b">
      <SidebarTrigger />

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <span>{currentLang.flag}</span>
              <span className="hidden sm:inline">{currentLang.label}</span>
              <Globe className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LANGS.map((l) => (
              <DropdownMenuItem key={l.value} onClick={() => setLang(l.value)}
                className={lang === l.value ? "font-semibold" : ""}>
                <span className="mr-2">{l.flag}</span>{l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Admin user dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-lime-100 text-lime-800 font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">
                {user?.fullName || user?.phone}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {user && (
              <div className="px-3 py-2 border-b mb-1">
                <p className="text-xs font-semibold truncate">{user.fullName || "Admin"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.phone}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{user.role}</p>
              </div>
            )}
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              {t("common.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
