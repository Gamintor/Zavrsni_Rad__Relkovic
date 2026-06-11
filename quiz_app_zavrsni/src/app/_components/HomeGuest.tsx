import Link from "next/link";

export default function HomeGuest() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <div className="anim-rise anim-d1 mb-6">
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
      </div>
      <span className="pill anim-rise anim-d2 mb-10 inline-block">
        Beskonačna arena znanja
      </span>
      <div className="anim-rise anim-d3 flex flex-col items-center gap-3">
        <p className="mb-2 text-sm" style={{ color: "var(--text-mut)" }}>
          Testiraj znanje, logiku i reflekse. Solo ili multiplayer.
        </p>
        <Link href="/login" className="btn-primary px-12">
          Prijavi se
        </Link>
        <Link href="/signup" className="btn-secondary px-12">
          Registriraj se
        </Link>
      </div>
    </main>
  );
}
