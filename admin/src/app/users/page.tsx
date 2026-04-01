"use client";
import useAdminLangStore from "@/stores/adminLangStore";
import { fmtDate } from "@/lib/tz";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Users } from "lucide-react";

export default function UsersPage() {
  const { t, lang } = useAdminLangStore();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.getUsers({ search: search || undefined, limit: 100 })
      .then(({ users: u, total: t }) => { setUsers(u); setTotal(t); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [search]);

  const handleBlock = async (id: string, currentlyBlocked: boolean) => {
    setUpdatingId(id);
    try {
      await adminApi.blockUser(id, !currentlyBlocked);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isBlocked: !currentlyBlocked } : u));
    } catch (e: any) { setError(e.message); }
    finally { setUpdatingId(null); }
  };

  const handleRoleChange = async (id: string, role: string) => {
    setUpdatingId(id);
    try {
      await adminApi.updateUser(id, { role });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    } catch (e: any) { setError(e.message); }
    finally { setUpdatingId(null); }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t("nav.users")}</h1>
          <span className="text-sm text-muted-foreground">({total})</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" placeholder={t("users.searchPlaceholder")} value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-lg border bg-background text-sm outline-none focus:border-primary transition w-64"
          />
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" /></div>
      ) : (
        <div className="bg-primary-foreground rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-left">
                <th className="px-4 py-3 font-medium">{t("products.name")}</th>
                <th className="px-4 py-3 font-medium">{t("auth.phone")}</th>
                <th className="px-4 py-3 font-medium">{t("users.role")}</th>
                <th className="px-4 py-3 font-medium">{t("users.status")}</th>
                <th className="px-4 py-3 font-medium">{t("users.joined")}</th>
                <th className="px-4 py-3 font-medium">{t("common.actions")}</th>
              </tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{user.fullName || "-"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{user.id.slice(-8)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{user.phone}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={updatingId === user.id}
                        className="rounded-lg border bg-background px-2 py-1 text-xs outline-none focus:border-primary disabled:opacity-50"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPERADMIN">SUPERADMIN</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${user.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {user.isBlocked ? t("common.inactive") : t("common.active")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fmtDate(user.createdAt, lang)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={user.isBlocked ? "default" : "destructive"}
                          size="sm"
                          className="h-7 text-xs"
                          disabled={updatingId === user.id}
                          onClick={() => handleBlock(user.id, user.isBlocked)}
                        >
                          {user.isBlocked ? t("common.unblock") : t("common.block")}
                        </Button>
                        <Link href={`/users/${user.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">{t("common.view")}</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-muted-foreground">{t("users.noUsers")}</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
