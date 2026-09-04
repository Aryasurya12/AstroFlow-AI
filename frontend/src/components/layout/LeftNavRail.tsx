"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  Activity,
  Terminal,
  ClipboardList,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, tag: "DASH" },
  { name: "Live View", href: "/live", icon: Video, tag: "LIVE" },
  { name: "Telemetry", href: "/telemetry", icon: Activity, tag: "TELEM" },
  { name: "Logs", href: "/logs", icon: Terminal, tag: "LOGS" },
  { name: "Protocol", href: "/protocol", icon: ClipboardList, tag: "SOP" },
];

export function LeftNavRail() {
  const pathname = usePathname();

  return (
    <aside className="w-14 flex-none bg-surface border-r border-border flex flex-col items-center py-2 select-none z-20">
      <div className="flex flex-col gap-2.5 w-full px-1.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              title={`${item.name} [${item.tag}]`}
              className={`group relative flex flex-col items-center justify-center h-12 w-full rounded-[2px] transition-all duration-150 ${
                isActive
                  ? "bg-accent/15 text-accent border border-accent/60 shadow-glow-cyan"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/70 border border-transparent"
              }`}
            >
              {/* Active Indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-[2px]" />
              )}

              <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
              <span className="text-[8px] font-mono tracking-tighter mt-1 opacity-80 leading-none">
                {item.tag}
              </span>

              {/* Tooltip on hover */}
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-surface-elevated border border-border text-foreground text-[10px] font-mono whitespace-nowrap rounded-[2px] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Status / Mode Pin */}
      <div className="w-full px-2 pt-2 border-t border-border flex flex-col items-center text-center">
        <div className="w-2 h-2 rounded-full bg-status-nominal status-indicator-pulse mb-1" />
        <span className="text-[8px] font-mono text-muted-foreground leading-none">
          AIRGAP
        </span>
        <span className="text-[7px] font-mono text-accent/80 leading-none mt-0.5">
          LOCAL
        </span>
      </div>
    </aside>
  );
}
