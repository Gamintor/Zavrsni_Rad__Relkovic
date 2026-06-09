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
    <nav className="flex w-52 shrink-0 flex-col border-r border-white/10 p-5">
      <p className="mb-6 text-sm font-bold tracking-widest text-[hsl(280,100%,70%)] uppercase">
        Admin
      </p>
      <ul className="space-y-0.5">
        {links.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`block rounded px-3 py-2 text-sm transition hover:bg-white/10 ${
                  active ? "bg-white/10 font-semibold" : "text-white/70"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto border-t border-white/10 pt-4">
        <Link
          href="/"
          className="block rounded px-3 py-2 text-sm text-white/50 transition hover:bg-white/10"
        >
          ← Natrag na app
        </Link>
      </div>
    </nav>
  );
}
