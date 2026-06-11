import { auth } from "~/server/auth";
import HomeLoggedIn from "./_components/HomeLoggedIn";
import HomeGuest from "./_components/HomeGuest";

export default async function Home() {
  const session = await auth();
  if (!session?.user) return <HomeGuest />;
  return (
    <HomeLoggedIn
      userName={session.user.name ?? "Igrač"}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
