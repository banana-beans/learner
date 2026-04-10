"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ROUTES } from "@/lib/constants";

const navItems = [
  {
    label: "Home",
    href: ROUTES.HOME,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Skill Tree",
    href: ROUTES.TREE,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="5" r="3" fill={active ? "currentColor" : "none"} />
        <circle cx="5" cy="19" r="3" fill={active ? "currentColor" : "none"} />
        <circle cx="19" cy="19" r="3" fill={active ? "currentColor" : "none"} />
        <line x1="12" y1="8" x2="12" y2="14" />
        <line x1="12" y1="14" x2="5" y2="16" />
        <line x1="12" y1="14" x2="19" y2="16" />
      </svg>
    ),
  },
  {
    label: "Review",
    href: ROUTES.REVIEW,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.15" : "0"} />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: ROUTES.PROFILE,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.2" : "0"} />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-sm">
      <div className="flex items-stretch h-16 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex-1 flex flex-col items-center justify-center gap-1 relative",
                "transition-colors duration-150",
                isActive
                  ? "text-[var(--accent-blue)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--accent-blue)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {item.icon(isActive)}
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
