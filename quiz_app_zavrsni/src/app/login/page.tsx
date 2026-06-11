"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Neispravni podaci. Provjeri email i lozinku.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Greška pri prijavi. Pokušaj ponovno.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div
        className="anim-rise w-full max-w-sm rounded-[var(--r-lg)] p-8"
        style={{ background: "var(--glass)", border: "1px solid var(--border-soft)", backdropFilter: "blur(16px)", boxShadow: "var(--shadow-card)" }}
      >
        <h1 className="mb-2 text-center text-2xl font-extrabold text-cream">Prijava</h1>
        <p className="mb-6 text-center text-sm" style={{ color: "var(--text-mut)" }}>
          Dobrodošao natrag u Kviz Arenu
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-mut)" }} htmlFor="email">
              Email
            </label>
            <input id="email" type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field" placeholder="ime@primjer.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-mut)" }} htmlFor="password">
              Lozinka
            </label>
            <input id="password" type="password" autoComplete="current-password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field" placeholder="••••••••" />
          </div>

          {error && (
            <p className="rounded-[var(--r-sm)] px-4 py-2.5 text-sm font-medium"
              style={{ background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.3)", color: "#f87171" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-1 w-full py-3 text-base">
            {loading ? "Prijava..." : "Prijavi se"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-mut)" }}>
          Nemaš račun?{" "}
          <Link href="/signup" className="font-semibold text-powder hover:underline">
            Registriraj se
          </Link>
        </p>
      </div>
    </main>
  );
}
