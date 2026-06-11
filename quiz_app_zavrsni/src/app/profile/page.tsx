import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth";
import ProfileClient from "./_components/ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--cream)" }}>Profil</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-mut)" }}>{session.user.name}</p>
          </div>
          <Link
            href="/"
            className="text-sm transition"
            style={{ color: "var(--text-mut)" }}
          >
            ← Natrag
          </Link>
        </div>
        <ProfileClient />
      </div>
    </main>
  );
}
