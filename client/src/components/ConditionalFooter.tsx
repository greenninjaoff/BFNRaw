"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

// Pages where footer should be hidden
const HIDE_FOOTER = ["/cart"];

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDE_FOOTER.some((p) => pathname.startsWith(p))) return null;
  return <Footer />;
}
