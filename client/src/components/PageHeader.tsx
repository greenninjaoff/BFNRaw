"use client";

import BackButton from "./BackButton";

interface PageHeaderProps {
  title: string;
  backFallback?: string;
  right?: React.ReactNode;
}

export default function PageHeader({ title, backFallback = "/", right }: PageHeaderProps) {
  return (
    <div className="relative flex items-center justify-between py-4">
      {/* Back button - left */}
      <BackButton fallback={backFallback} />

      {/* Title - perfectly centered regardless of side content */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <h1 className="text-lg font-semibold text-[rgb(var(--text))]">{title}</h1>
      </span>

      {/* Right slot - same width as back button to keep symmetry */}
      <div className="w-9 h-9 flex items-center justify-center">
        {right ?? null}
      </div>
    </div>
  );
}
