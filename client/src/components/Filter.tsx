"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/i18n/t";

const Filter = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const currentSort = searchParams.get("sort") || "newest";

  const handleSort = (value: string) => {
    // Preserve ALL existing params, only update sort
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center justify-end gap-2 text-sm text-[rgb(var(--muted))] my-6">
      <span>{t("filter.sortBy")}:</span>
      <select
        value={currentSort}
        className="ring-1 ring-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--text))] shadow-md p-1.5 rounded-lg text-sm outline-none focus:ring-[rgb(var(--btn-bg))] transition cursor-pointer"
        onChange={(e) => handleSort(e.target.value)}
      >
        <option value="newest">{t("filter.newest")}</option>
        <option value="oldest">{t("filter.oldest")}</option>
        <option value="asc">{t("filter.priceLowHigh")}</option>
        <option value="desc">{t("filter.priceHighLow")}</option>
      </select>
    </div>
  );
};

export default Filter;
