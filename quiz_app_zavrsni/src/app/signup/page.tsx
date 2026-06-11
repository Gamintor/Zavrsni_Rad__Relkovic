"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const registerMutation = api.auth.register.useMutation({
    onError(err) { setError(err.message); },
    async onSuccess() {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Registracija uspješna, ali prijava nije uspjela. Prijavi se ručno.");
      } else {
        router.push("/");
        router.refresh();
      }
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div
        className="anim-rise w-full max-w-sm rounded-[var(--r-lg)] p-8"
        style={{ background: "var(--glass)", border: "1px solid var(--border-soft)", backdropFilter: "blur(16px)", boxShadow: "var(--shadow-card)" }}
      >
        <h1 className="mb-2 text-center text-2xl font-extrabold text-cream">Registracija</h1>
        <p className="mb-6 text-center text-sm" style={{ color: "var(--text-mut)" }}>
          Kreiraj račun i uđi u arenu
        </p>

        <form onSubmit={(e) => { e.preventDefault(); setError(null); registerMutation.mutate({ name, email, password }); }}
          className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-mut)" }} htmlFor="name">
              Ime
            </label>
            <input id="name" type="text" autoComplete="name" required minLength={2} value={name}
              onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Tvoje ime" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-mut)" }} htmlFor="email">
              Email
            </label>
            <input id="email" type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="ime@primjer.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-mut)" }} htmlFor="password">
              Lozinka <span style={{ color: "var(--text-mut)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(min. 8 znakova)</span>
            </label>
            <input id="password" type="password" autoComplete="new-password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="••••••••" />
          </div>

          {error && (
            <p className="rounded-[var(--r-sm)] px-4 py-2.5 text-sm font-medium"
              style={{ background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.3)", color: "#f87171" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={registerMutation.isPending} className="btn-primary mt-1 w-full py-3 text-base">
            {registerMutation.isPending ? "Registracija..." : "Registriraj se"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-mut)" }}>
          Već imaš račun?{" "}
          <Link href="/login" className="font-semibold text-powder hover:underline">
            Prijavi se
          </Link>
        </p>
      </div>
    </main>
  );
}
