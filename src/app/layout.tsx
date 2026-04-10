import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "Learner — Gamified Developer Learning",
  description:
    "A gamified, offline-first developer learning platform with skill trees, challenges, and spaced repetition.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Learner",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f8ef7",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[var(--background)] text-[var(--foreground)] antialiased">
        <div className="flex h-full min-h-dvh">
          {/* Desktop sidebar — hidden on mobile */}
          <Sidebar />

          {/* Main content */}
          <main className="flex-1 min-w-0 overflow-y-auto">
            {/* Top header (mobile) */}
            <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[var(--accent-blue)] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="font-bold text-[var(--foreground)] text-sm">Learner</span>
              </div>
            </header>

            {/* Page content with bottom padding for mobile nav */}
            <div className="pb-20 md:pb-0">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <BottomNav />
      </body>
    </html>
  );
}
