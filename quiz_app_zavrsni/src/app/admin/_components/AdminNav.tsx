"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/categories", label: "Kategorije" },
  { href: "/admin/challenges", label: "Izazovi" },
  { href: "/admin/quizzes", label: "Kvizovi" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex w-52 shrink-0 flex-col p-5"
      style={{ borderRight: "1px solid var(--border-soft)", background: "var(--glass)" }}
    >
      <p
        className="mb-6 text-xs font-bold tracking-widest uppercase"
        style={{ color: "var(--powder)" }}
      >
        Admin Panel
      </p>
      <ul className="space-y-0.5">
        {links.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className="block rounded-[var(--r-tile)] px-3 py-2 text-sm transition"
                style={{
                  background: active ? "var(--glass-strong)" : "transparent",
                  color: active ? "var(--cream)" : "var(--text-mut)",
                  fontWeight: active ? "600" : "400",
                  borderLeft: active ? "2px solid var(--powder)" : "2px solid transparent",
                }}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto pt-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
        <Link
          href="/"
          className="block rounded-[var(--r-tile)] px-3 py-2 text-sm transition"
          style={{ color: "var(--text-mut)" }}
        >
          ← Natrag na app
        </Link>
      </div>
    </nav>
  );
}
