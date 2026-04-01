import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import AdminAuthProvider from "@/components/providers/AdminAuthProvider";

export const metadata: Metadata = {
  title: "Befit Nutrition - Admin",
  description: "Admin panel for Befit Nutrition",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AdminAuthProvider>
            {children}
          </AdminAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
