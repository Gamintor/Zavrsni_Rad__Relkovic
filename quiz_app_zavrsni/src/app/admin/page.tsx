"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function AdminDashboard() {
  const { data: categories } = api.content.category.list.useQuery();
  const { data: challenges } = api.content.challenge.list.useQuery();
  const { data: quizzes } = api.content.quiz.list.useQuery();

  const stats = [
    {
      label: "Kategorije",
      value: categories?.length,
      href: "/admin/categories",
    },
    {
      label: "Izazovi",
      value: challenges?.length,
      href: "/admin/challenges",
    },
    { label: "Kvizovi", value: quizzes?.length, href: "/admin/quizzes" },
    {
      label: "Objavljeni",
      value: quizzes?.filter((q) => q.isPublished).length,
      href: "/admin/quizzes",
    },
  ];

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl bg-white/10 p-6 transition hover:bg-white/20"
          >
            <div className="text-3xl font-bold text-[hsl(280,100%,70%)]">
              {value ?? "—"}
            </div>
            <div className="mt-1 text-sm text-white/60">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Nova kategorija", href: "/admin/categories" },
          { label: "Novi izazov", href: "/admin/challenges/new" },
          { label: "Novi kviz", href: "/admin/quizzes/new" },
        ].map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border border-white/20 p-4 text-center text-sm font-semibold transition hover:bg-white/10"
          >
            + {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
