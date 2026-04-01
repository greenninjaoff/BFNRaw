import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter";
import { ToastContainer } from "react-toastify";
import ThemeProvider from "@/components/ThemeProvider";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Befit Nutrition - Best Nutrition",
  description:
    "Nutrition for a better life. Shop our high-quality protein bars and supplements to fuel your fitness journey.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`
(function(){try{var s=localStorage.getItem("theme");var t="system";if(s){var p=JSON.parse(s);t=p?.state?.theme||"system";}var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");}catch(e){}})();
        `}</Script>
      </head>
      <body className="antialiased font-sans">
        <ThemeProvider />
        <ToastContainer position="top-right" autoClose={2500} />
        <div className="mx-auto p-4 sm:px-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-6xl">
          <Navbar />
          {children}
          <ConditionalFooter />
        </div>
      </body>
    </html>
  );
}
