"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="cursor-pointer rounded-full px-3 py-1 text-sm font-semibold transition"
      style={{ color: "var(--cream)", border: "1px solid var(--border-soft)" }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "rgba(230,57,70,0.15)";
        e.currentTarget.style.borderColor = "rgba(230,57,70,0.5)";
        e.currentTarget.style.color = "var(--red)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "var(--border-soft)";
        e.currentTarget.style.color = "var(--cream)";
      }}
    >
      Odjava
    </button>
  );
}
