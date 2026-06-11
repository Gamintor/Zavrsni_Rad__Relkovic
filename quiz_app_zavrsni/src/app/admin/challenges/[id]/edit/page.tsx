"use client";

import { use } from "react";
import { api } from "~/trpc/react";
import ChallengeForm from "../../../_components/ChallengeForm";

export default function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: challenge, isLoading } = api.content.challenge.getById.useQuery({ id });

  if (isLoading) return <p style={{ color: "var(--text-mut)" }}>Učitavanje...</p>;
  if (!challenge) return <p style={{ color: "var(--red)" }}>Izazov nije pronađen.</p>;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold" style={{ color: "var(--cream)" }}>Uredi izazov</h1>
      <ChallengeForm existing={challenge} />
    </div>
  );
}
