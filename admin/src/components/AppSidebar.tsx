"use client";

import {
  Users, Package, ShoppingCart, Tag, LayoutDashboard,
  Settings, Ticket, LogOut, ChevronUp, Bell,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarSeparator,
} from "./ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAdminAuthStore from "@/stores/adminAuthStore";
import useAdminLangStore from "@/stores/adminLangStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";

const AppSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminAuthStore();
  const { t } = useAdminLangStore();

  const navItems = [
    { key: "nav.dashboard",   url: "/",              icon: LayoutDashboard },
    { key: "nav.orders",      url: "/orders",        icon: ShoppingCart },
    { key: "nav.products",    url: "/products",      icon: Package },
    { key: "nav.categories",  url: "/categories",    icon: Tag },
    { key: "nav.users",       url: "/users",         icon: Users },
    { key: "nav.promoCodes",  url: "/promo-codes",   icon: Ticket },
    { key: "nav.settings",    url: "/settings",      icon: Settings },
    { key: "nav.notifications", url: "/notifications", icon: Bell },
  ];

  const handleLogout = () => { logout(); router.push("/login"); };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="gap-3">
              <Link href="/">
                <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center text-sm font-black text-black shrink-0">
                  B
                </div>
                <span className="font-bold text-sm">Befit Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{t(item.key)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-xs bg-lime-100 text-lime-800 font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left leading-tight min-w-0">
                    <span className="text-sm font-medium truncate">{user?.fullName || "Admin"}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.phone}</span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-52">
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
