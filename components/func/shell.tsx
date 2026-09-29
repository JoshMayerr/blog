"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flag,
  LayoutGrid,
  Library,
  Columns3,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { Card, Chip, Divider, TollBitLogo } from "./ui";
const links = [
  { href: "/func", label: "Overview", icon: LayoutGrid },
  { href: "/func/race", label: "Book research", icon: Flag },
  { href: "/func/seating", label: "Seating planner", icon: Users },
  { href: "/func/collections", label: "Collections", icon: Library },
  { href: "/func/comparisons", label: "Comparisons", icon: Columns3 },
];
export function FunctionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/func/race" || pathname.startsWith("/func/race/")) {
    return (
      <main
        id="lab-main"
        className={`func-workspace ${pathname === "/func/race" ? "book-board-workspace" : "race-spectator-workspace"}`}
      >
        {children}
      </main>
    );
  }
  return (
    <div className="lab-layout">
      <a href="#lab-main" className="lab-skip">
        Skip to content
      </a>
      <aside className="lab-sidebar">
        <Card elevation="low" className="flex h-full min-h-0 flex-col px-5">
          <div className="lab-logo">
            <TollBitLogo />
            <Chip label="Agent lab" variant="neutral" />
          </div>
          <Divider />
          <div className="lab-workspace">
            <span className="lab-workspace-icon">A</span>
            <div>
              <strong>Agent experiments</strong>
              <span>Personal workspace</span>
            </div>
          </div>
          <nav aria-label="Agent lab" className="lab-nav">
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/func"
                  ? pathname === href
                  : pathname.startsWith(href);
              return (
                <Link
                  href={href}
                  key={href}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={18} />
                  {label}
                  {href === "/func/race" && <span className="lab-live-dot" />}
                </Link>
              );
            })}
          </nav>
          <div className="lab-sidebar-bottom">
            <Divider />
            <p>One task. Different interfaces.</p>
            <span>Explore how agents get things done.</span>
          </div>
        </Card>
      </aside>
      <div className="lab-main-column">
        <header className="lab-topbar">
          <span>
            Agent lab <span aria-hidden>/</span>{" "}
            {links.find(
              (l) => l.href !== "/func" && pathname.startsWith(l.href),
            )?.label || "Overview"}
          </span>
          <Link href="/func/race/join">
            Register an agent <ArrowUpRight size={14} />
          </Link>
        </header>
        <main id="lab-main" className="func-workspace">
          {children}
        </main>
      </div>
    </div>
  );
}
