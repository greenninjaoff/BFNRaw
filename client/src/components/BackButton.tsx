"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  fallback?: string;
}

export default function BackButton({ fallback = "/" }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(fallback)}
      aria-label="Go back"
      className="flex items-center justify-center w-9 h-9 rounded-full bg-[rgb(var(--surface))] text-[rgb(var(--text))] hover:bg-[rgb(var(--border))] transition-colors duration-150 shrink-0"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  );
}
