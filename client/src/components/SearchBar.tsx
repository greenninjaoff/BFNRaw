"use client";
import { useT } from "@/i18n/t";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function SearchBarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const [value, setValue] = useState(searchParams.get("search") || "");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(searchParams.get("search") || "");
  }, [searchParams]);

  const applySearch = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) { params.set("search", q.trim()); } else { params.delete("search"); }
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setValue(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applySearch(q), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { if (debounceRef.current) clearTimeout(debounceRef.current); applySearch(value); }
    if (e.key === "Escape") inputRef.current?.blur();
  };

  const handleClear = () => {
    setValue("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    applySearch("");
    inputRef.current?.focus();
  };

  return (
    <div className={`hidden sm:flex items-center gap-2 rounded-md ring-1 bg-[rgb(var(--card))] px-2 py-1 shadow-md transition-all ${focused ? "ring-[rgb(var(--btn-bg))]" : "ring-[rgb(var(--border))]"}`}>
      <Search className="w-4 h-4 text-[rgb(var(--muted))] shrink-0" />
      <input ref={inputRef} id="search" value={value} onChange={handleChange} onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={t("common.search")}
        className="text-sm outline-0 bg-transparent text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] w-40" />
      {value && (
        <button type="button" onClick={handleClear} className="text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] transition shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// Suspense boundary needed because useSearchParams is used
const SearchBar = () => (
  <Suspense fallback={
    <div className="hidden sm:flex items-center gap-2 rounded-md ring-1 ring-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 shadow-md">
      <Search className="w-4 h-4 text-[rgb(var(--muted))]" />
      <div className="w-40 h-4 rounded bg-[rgb(var(--surface))]" />
    </div>
  }>
    <SearchBarInner />
  </Suspense>
);

export default SearchBar;
