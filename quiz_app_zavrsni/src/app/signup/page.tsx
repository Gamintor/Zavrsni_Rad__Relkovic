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
    onError(err) {
      // Prikaži grešku korisniku (npr. email već zauzet)
      setError(err.message);
    },
    async onSuccess() {
      // Automatska prijava nakon uspješne registracije
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Registracija uspješna, ali prijava nije uspjela. Pokušaj se prijaviti ručno.");
      } else {
        router.push("/");
        router.refresh();
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    registerMutation.mutate({ name, email, password });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="w-full max-w-sm rounded-2xl bg-white/10 p-8 backdrop-blur">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Registracija
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-white/70" htmlFor="name">
              Ime
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg bg-white/10 px-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/20 focus:ring-[hsl(280,100%,70%)]"
              placeholder="Tvoje ime"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/70" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-white/10 px-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/20 focus:ring-[hsl(280,100%,70%)]"
              placeholder="ime@primjer.com"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-white/70"
              htmlFor="password"
            >
              Lozinka{" "}
              <span className="text-white/40">(min. 8 znakova)</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-white/10 px-4 py-2.5 text-white placeholder-white/30 outline-none ring-1 ring-white/20 focus:ring-[hsl(280,100%,70%)]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="mt-2 rounded-full bg-[hsl(280,100%,70%)] py-2.5 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {registerMutation.isPending ? "Registracija..." : "Registriraj se"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/50">
          Već imaš račun?{" "}
          <Link
            href="/login"
            className="text-[hsl(280,100%,70%)] hover:underline"
          >
            Prijavi se
          </Link>
        </p>
      </div>
    </main>
  );
}
