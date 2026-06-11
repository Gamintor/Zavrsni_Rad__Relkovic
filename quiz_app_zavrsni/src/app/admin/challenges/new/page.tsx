import ChallengeForm from "../../_components/ChallengeForm";

export default function NewChallengePage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold" style={{ color: "var(--cream)" }}>Novi izazov</h1>
      <ChallengeForm />
    </div>
  );
}
