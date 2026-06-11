import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { SocketProvider } from "./_components/SocketProvider";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Kviz Arena",
  description: "Kviz aplikacija s izazovima",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <SessionProvider>
          <TRPCReactProvider>
            <SocketProvider>{children}</SocketProvider>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
