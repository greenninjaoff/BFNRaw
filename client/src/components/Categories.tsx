"use client";

import { useRef } from "react";
import { ShoppingBasket, Dumbbell, Pill, Flame, Zap, Apple } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCategories } from "@/hooks/useProducts";
import { useT } from "@/i18n/t";
import useLangStore from "@/stores/langStore";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "protein-bars":  <Apple className="w-4 h-4" />,
  "healthy-bars":  <Apple className="w-4 h-4" />,
  "wpc":           <Dumbbell className="w-4 h-4" />,
  "wpcwpi":        <Dumbbell className="w-4 h-4" />,
  "bcaa":          <Zap className="w-4 h-4" />,
  "creatine":      <Flame className="w-4 h-4" />,
  "multivitamins": <Pill className="w-4 h-4" />,
  "pre-workout":   <Zap className="w-4 h-4" />,
};

/** Pick the right localized name from a category object */
function localizedCatName(cat: any, lang: string): string {
  if (lang === "ru" && cat.nameRu) return cat.nameRu;
  if (lang === "uz" && cat.nameUz) return cat.nameUz;
  if (cat.nameEn) return cat.nameEn;
  return cat.name || cat.slug;
}

export default function Categories() {
  const { categories } = useCategories();
  const { lang } = useLangStore();
  const t = useT();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedCategory = searchParams.get("category") || "all";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollerRef.current; if (!el) return;
    isDown.current = true; startX.current = e.pageX - el.offsetLeft; scrollLeft.current = el.scrollLeft;
  };
  const stopDrag = () => { isDown.current = false; };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollerRef.current; if (!el || !isDown.current) return;
    e.preventDefault(); el.scrollLeft = scrollLeft.current - (e.pageX - el.offsetLeft - startX.current);
  };

  const allCategories = [
    { label: t("filter.all"), slug: "all", icon: <ShoppingBasket className="w-4 h-4" /> },
    ...categories.map((c) => ({
      label: localizedCatName(c, lang),
      slug: c.slug,
      icon: CATEGORY_ICONS[c.slug] || <ShoppingBasket className="w-4 h-4" />,
    })),
  ];

  return (
    <div className="bg-[rgb(var(--surface))] p-2 rounded-lg mb-4 text-sm mt-4">
      <div
        ref={scrollerRef}
        onMouseDown={onMouseDown} onMouseLeave={stopDrag} onMouseUp={stopDrag} onMouseMove={onMouseMove}
        className="flex gap-2 overflow-x-auto whitespace-nowrap no-scrollbar select-none"
      >
        {allCategories.map((category) => {
          const isActive = category.slug === selectedCategory;
          return (
            <button
              type="button"
              key={category.slug}
              onClick={() => handleChange(category.slug)}
              className={
                "flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 " +
                (isActive
                  ? "bg-[rgb(var(--btn-bg))] active:bg-[rgb(var(--btn-bg-hover))] text-[rgb(var(--btn-text))]"
                  : "text-[rgb(var(--muted))] bg-[rgb(var(--card))] hover:text-[rgb(var(--btn-text))] hover:bg-[rgb(var(--btn-bg-hover))] active:bg-[rgb(var(--btn-bg-hover))]")
              }
            >
              {category.icon}
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
