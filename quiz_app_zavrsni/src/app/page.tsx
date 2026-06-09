import Link from "next/link";
import { auth } from "~/server/auth";
import { SignOutButton } from "./_components/SignOutButton";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center gap-8 px-4 py-16 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Quiz{" "}
          <span className="text-[hsl(280,100%,70%)]">Challenge</span>
        </h1>
        <p className="max-w-md text-lg text-white/70">
          Testiraj znanje, logiku i reflekse. Klasična pitanja, vizualni
          izazovi, slagalice. Solo ili multiplayer.
        </p>

        {session ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/play"
                className="rounded-full bg-[hsl(280,100%,70%)] px-8 py-3 font-semibold text-black transition hover:opacity-90"
              >
                Igraj
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-full bg-white/10 px-8 py-3 font-semibold transition hover:bg-white/20"
              >
                Ljestvica
              </Link>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-full bg-white/10 px-8 py-3 font-semibold transition hover:bg-white/20"
                >
                  Admin
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-white/50">
              <span>Ulogiran kao {session.user.name}</span>
              <span>·</span>
              <SignOutButton />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="rounded-full bg-[hsl(280,100%,70%)] px-10 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Prijavi se
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
            >
              Registriraj se
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
