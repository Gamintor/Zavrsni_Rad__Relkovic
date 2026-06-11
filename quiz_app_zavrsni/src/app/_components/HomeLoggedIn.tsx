"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { SignOutButton } from "./SignOutButton";

function liveLabel(n: number): string {
  if (n === 0) return "Nema aktivnih igara";
  if (n === 1) return "1 live igra";
  if (n <= 4) return `${n} live igre`;
  return `${n} live igara`;
}

interface Props {
  userName: string;
  isAdmin: boolean;
}

export default function HomeLoggedIn({ userName, isAdmin }: Props) {
  const { data: liveData } = api.room.getLiveCount.useQuery(undefined, {
    refetchInterval: 10_000,
  });
  const liveCount = liveData?.count ?? 0;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-4xl">
        {/* Wordmark */}
        <div className="anim-rise anim-d1 mb-10 text-center">
          <h1
            className="font-black leading-none tracking-tight"
            style={{
              fontSize: "clamp(54px, 11vw, 110px)",
              background:
                "linear-gradient(176deg, var(--powder) 0%, var(--cream) 44%, #f08a91 92%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 6px 30px rgba(168,218,220,0.18))",
            }}
          >
            KVIZ<br />ARENA
          </h1>
          <div className="anim-rise anim-d2 mt-5">
            <span className="pill">Beskonačna arena znanja</span>
          </div>
          {/* Pozdravna kartica */}
          <div className="anim-rise anim-d3 mt-4">
          <div
            className="mx-auto inline-flex items-center gap-4 rounded-[var(--r-md)] px-5 py-3"
            style={{
              background: "var(--glass)",
              border: "1px solid var(--border-soft)",
            }}
          >
            <span className="text-2xl">😎</span>
            <div className="text-left">
              <p className="text-xs" style={{ color: "var(--text-mut)" }}>Dobrodošao natrag,</p>
              <p className="text-base font-bold text-cream">{userName}</p>
            </div>
            <div className="mx-2 h-8 w-px" style={{ background: "var(--border-soft)" }} />
            <SignOutButton />
          </div>
          </div>
        </div>

        {/* Grid */}
        <div className="anim-rise anim-d3 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          {/* Solo panel */}
          <section className="glass p-5">
            <div className="mb-4 flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5 text-red"
              >
                <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
              </svg>
              <h2
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--text-mut)" }}
              >
                Brza igra (solo)
              </h2>
            </div>
            <Link
              href="/play"
              className="glass-strong hoverable flex min-h-32 flex-col items-center justify-center gap-3 p-8 text-center"
              style={{ "--tint": "rgba(230,57,70,0.3)" } as React.CSSProperties}
            >
              <span className="text-4xl">🎯</span>
              <span className="text-xl font-bold text-cream">Odaberi kviz</span>
              <span className="text-sm" style={{ color: "var(--text-mut)" }}>
                Klasična pitanja, vizualni izazovi, slagalice
              </span>
              <span className="btn-primary mt-2 text-sm">Igraj solo →</span>
            </Link>
          </section>

          {/* Desna strana */}
          <div className="flex flex-col gap-4">
            {/* Multiplayer kartica */}
            <Link
              href="/multiplayer/create"
              className="glass hoverable flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-powder"
              >
                <circle cx="9" cy="8" r="3.2" />
                <path d="M3 19a6 6 0 0 1 12 0" />
                <circle cx="17" cy="9" r="2.6" />
                <path d="M16 19a5 5 0 0 1 6-1.5" />
              </svg>
              <h3 className="text-lg font-extrabold uppercase tracking-wide text-cream">
                Multiplayer
              </h3>
              {/* Live badge */}
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                style={{
                  color: "var(--green)",
                  background: "rgba(42,157,143,0.12)",
                  border: "1px solid rgba(42,157,143,0.4)",
                }}
              >
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-green" />
                {liveLabel(liveCount)}
              </span>
            </Link>

            {/* Mini kartice */}
            <div className="grid grid-cols-3 gap-3">
              <MiniCard
                href="/leaderboard"
                label="Ljestvica"
                accent="red"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <path d="M6 4h12v3a6 6 0 0 1-12 0z" />
                    <path d="M6 5H3v1a3 3 0 0 0 3 3M18 5h3v1a3 3 0 0 1-3 3M9 16h6M8 20h8M12 13v3" />
                  </svg>
                }
              />
              <MiniCard
                href="/profile"
                label="Profil"
                accent="powder"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M6.5 18a5.5 5.5 0 0 1 11 0" />
                  </svg>
                }
              />
              {isAdmin && (
                <MiniCard
                  href="/admin"
                  label="Admin"
                  accent="red"
                  glow
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                      <path d="M9.5 12l1.8 1.8 3.2-3.6" />
                    </svg>
                  }
                />
              )}
              {!isAdmin && (
                <div /> /* prazno mjesto ako nije admin */
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

interface MiniCardProps {
  href: string;
  label: string;
  accent: "red" | "powder";
  icon: React.ReactNode;
  glow?: boolean;
}

function MiniCard({ href, label, accent, icon, glow }: MiniCardProps) {
  const iconColor = accent === "red" ? "text-red" : "text-powder";
  return (
    <Link
      href={href}
      className="glass hoverable flex flex-col items-center gap-2 py-5 text-center"
      style={
        glow
          ? ({
              "--hover-shadow": "0 14px 30px rgba(14,28,48,0.5), 0 0 22px rgba(230,57,70,0.28)",
            } as React.CSSProperties)
          : undefined
      }
    >
      <span className={iconColor}>{icon}</span>
      <span
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: "var(--text-mut)" }}
      >
        {label}
      </span>
    </Link>
  );
}
