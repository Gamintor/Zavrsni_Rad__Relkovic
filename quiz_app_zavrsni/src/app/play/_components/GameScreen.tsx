"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type RouterOutputs } from "~/trpc/react";
import Timer from "./Timer";
import MultipleChoice from "./challenges/MultipleChoice";
import TrueFalse from "./challenges/TrueFalse";
import TextInput from "./challenges/TextInput";
import VisualClick from "./challenges/VisualClick";
import SpotDifference from "./challenges/SpotDifference";
import ImageOrder from "./challenges/ImageOrder";
import Sequence from "./challenges/Sequence";
import Memory from "./challenges/Memory";
import Puzzle from "./challenges/Puzzle";

type SessionOk = Extract<RouterOutputs["game"]["getSession"], { status: "IN_PROGRESS" }>;
type SafeChallenge = SessionOk["challenge"];
type Phase = "loading" | "playing" | "feedback" | "error";

interface FeedbackState {
  isCorrect: boolean;
  pointsAwarded: number;
  streak: number;
}

const SELF_MEDIA_TYPES: SafeChallenge["type"][] = ["VISUAL_CLICK", "SPOT_DIFFERENCE", "PUZZLE"];

const DIFF_LABEL = { EASY: "Lako", MEDIUM: "Srednje", HARD: "Teško" } as const;
const DIFF_STYLE: Record<SafeChallenge["difficulty"], React.CSSProperties> = {
  EASY:   { color: "var(--green)",  background: "rgba(42,157,143,0.13)",  border: "1px solid rgba(42,157,143,0.42)" },
  MEDIUM: { color: "var(--powder)", background: "rgba(168,218,220,0.10)", border: "1px solid rgba(168,218,220,0.35)" },
  HARD:   { color: "var(--red)",    background: "rgba(230,57,70,0.12)",   border: "1px solid rgba(230,57,70,0.40)" },
};

function emptyAnswer(type: SafeChallenge["type"]): Record<string, unknown> {
  switch (type) {
    case "MULTIPLE_CHOICE": return { indices: [] };
    case "TRUE_FALSE":      return { value: null };
    case "TEXT_INPUT":      return { text: "" };
    case "VISUAL_CLICK":    return { x: -1, y: -1 };
    case "SPOT_DIFFERENCE": return { found: [] };
    case "IMAGE_ORDER":     return { order: [] };
    case "SEQUENCE":        return { order: [] };
    case "PUZZLE":          return { solved: false };
    case "MEMORY":          return { allMatched: false };
  }
}

function useCountUp(to: number, durationMs = 600): number {
  const [display, setDisplay] = useState(to);
  const prev = useRef(to);
  useEffect(() => {
    const from = prev.current;
    prev.current = to;
    if (from === to) return;
    const steps = 20;
    const step = (to - from) / steps;
    const interval = durationMs / steps;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplay(Math.round(from + step * i));
      if (i >= steps) { clearInterval(id); setDisplay(to); }
    }, interval);
    return () => clearInterval(id);
  }, [to, durationMs]);
  return display;
}

export default function GameScreen({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [challenge, setChallenge] = useState<SafeChallenge | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [quizTitle, setQuizTitle] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const startTimeRef = useRef(Date.now());
  const displayScore = useCountUp(totalScore);

  const sessionQuery = api.game.getSession.useQuery(
    { sessionId },
    { enabled: phase === "loading", retry: false },
  );

  useEffect(() => {
    if (!sessionQuery.data) return;
    if (sessionQuery.data.status === "FINISHED") {
      router.replace(`/results/${sessionId}`);
      return;
    }
    const s = sessionQuery.data;
    setChallenge(s.challenge);
    setChallengeIndex(s.challengeIndex);
    setTotalChallenges(s.totalChallenges);
    setTotalScore(s.totalScore);
    setQuizTitle(s.quizTitle);
    startTimeRef.current = Date.now();
    setPhase("playing");
  }, [sessionQuery.data, router, sessionId]);

  useEffect(() => {
    if (sessionQuery.error) { setErrorMsg(sessionQuery.error.message); setPhase("error"); }
  }, [sessionQuery.error]);

  const submitMutation = api.game.submitAnswer.useMutation({
    onSuccess: (result) => {
      setFeedback({ isCorrect: result.isCorrect, pointsAwarded: result.pointsAwarded, streak: result.streak });
      setTotalScore(result.newTotalScore);
      setPhase("feedback");
      setTimeout(() => {
        setFeedback(null);
        if (result.gameFinished) {
          router.push(`/results/${sessionId}`);
        } else {
          setChallenge(result.nextChallenge);
          setChallengeIndex(result.nextIndex);
          startTimeRef.current = Date.now();
          setPhase("playing");
        }
      }, 1600);
    },
    onError: (err) => { setErrorMsg(err.message); setPhase("error"); },
  });

  const submitAnswer = useCallback(
    (given: Record<string, unknown>) => {
      if (!challenge || phase !== "playing") return;
      const timeTakenMs = Date.now() - startTimeRef.current;
      setPhase("feedback");
      submitMutation.mutate({ sessionId, challengeId: challenge.id, givenAnswer: given, timeTakenMs });
    },
    [challenge, phase, sessionId, submitMutation],
  );

  const handleExpire = useCallback(() => {
    if (!challenge || phase !== "playing") return;
    submitAnswer(emptyAnswer(challenge.type));
  }, [challenge, phase, submitAnswer]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--text-mut)" }}>Učitavanje igre...</p>
      </div>
    );
  }
  if (phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red">{errorMsg}</p>
        <button onClick={() => router.push("/play")} className="btn-secondary">
          Natrag na popis
        </button>
      </div>
    );
  }
  if (!challenge) return null;

  const isSubmitted = phase === "feedback";
  const content = challenge.content as Record<string, unknown>;
  const showMediaInPrompt = !!challenge.mediaUrl && !SELF_MEDIA_TYPES.includes(challenge.type);

  return (
    <div className="flex min-h-screen flex-col">
      {/* HUD */}
      <header className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="pill">
              Pitanje <b>{challengeIndex + 1}</b>/{totalChallenges}
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide"
              style={DIFF_STYLE[challenge.difficulty]}
            >
              {DIFF_LABEL[challenge.difficulty]}
            </span>
          </div>
          <span
            key={totalScore}
            className="animate-score-bump pill"
          >
            Bodovi: <b style={{ color: "var(--red)" }}>{displayScore}</b>
          </span>
        </div>
      </header>

      {/* Sadržaj */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
        {/* Kartica pitanja */}
        <div
          className="glass mb-6 p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="mb-6 flex items-start gap-4">
            <p className="flex-1 text-xl font-bold leading-snug text-cream">
              {challenge.prompt}
            </p>
            {/* SVG ring timer */}
            <Timer
              key={challenge.id}
              timeLimitSec={challenge.timeLimitSec}
              onExpire={handleExpire}
              paused={isSubmitted}
            />
          </div>

          {showMediaInPrompt && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={challenge.mediaUrl!}
              alt="Slika izazova"
              className="mb-4 max-h-64 w-full rounded-[var(--r-md)] object-contain"
            />
          )}

          {/* Odgovor po tipu */}
          {challenge.type === "MULTIPLE_CHOICE" && (
            <MultipleChoice options={(content.options as string[]) ?? []} onSubmit={submitAnswer} disabled={isSubmitted} />
          )}
          {challenge.type === "TRUE_FALSE" && (
            <TrueFalse onSubmit={submitAnswer} disabled={isSubmitted} />
          )}
          {challenge.type === "TEXT_INPUT" && (
            <TextInput onSubmit={submitAnswer} disabled={isSubmitted} />
          )}
          {challenge.type === "VISUAL_CLICK" && (
            <VisualClick mediaUrl={challenge.mediaUrl} onSubmit={submitAnswer} disabled={isSubmitted} />
          )}
          {challenge.type === "SPOT_DIFFERENCE" && (
            <SpotDifference mediaUrl={challenge.mediaUrl} imageB={(content.imageB as string) ?? ""} onSubmit={submitAnswer} disabled={isSubmitted} />
          )}
          {challenge.type === "IMAGE_ORDER" && (
            <ImageOrder images={(content.images as string[]) ?? []} onSubmit={submitAnswer} disabled={isSubmitted} />
          )}
          {challenge.type === "SEQUENCE" && (
            <Sequence items={(content.items as string[]) ?? []} onSubmit={submitAnswer} disabled={isSubmitted} />
          )}
          {challenge.type === "MEMORY" && (
            <Memory pairs={(content.pairs as { id: string; front: string; back: string }[]) ?? []} onSubmit={submitAnswer} disabled={isSubmitted} />
          )}
          {challenge.type === "PUZZLE" && (
            <Puzzle mediaUrl={challenge.mediaUrl} rows={(content.rows as number) ?? 3} cols={(content.cols as number) ?? 3} onSubmit={submitAnswer} disabled={isSubmitted} />
          )}

          {/* Feedback */}
          {isSubmitted && feedback && (
            <div
              className={`mt-5 rounded-[var(--r-md)] p-4 text-center font-bold ${
                feedback.isCorrect ? "animate-feedback-correct" : "animate-feedback-wrong"
              }`}
              style={
                feedback.isCorrect
                  ? { background: "rgba(42,157,143,0.16)", border: "1px solid rgba(42,157,143,0.5)", color: "var(--green)" }
                  : { background: "rgba(230,57,70,0.13)", border: "1px solid rgba(230,57,70,0.45)", color: "var(--red)" }
              }
            >
              <p className="text-xl">{feedback.isCorrect ? "✓ Točno!" : "✗ Netočno"}</p>
              {feedback.isCorrect && (
                <p className="mt-1 text-sm font-normal text-cream">
                  +{feedback.pointsAwarded} bodova
                  {feedback.streak > 1 && (
                    <span className="animate-streak-pulse ml-2 inline-block font-bold" style={{ color: "var(--powder)" }}>
                      🔥 {feedback.streak}× streak
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progress segmenti */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${totalChallenges}, 1fr)` }}
        >
          {Array.from({ length: totalChallenges }).map((_, i) => (
            <div
              key={i}
              className="relative h-1.5 overflow-hidden rounded-full"
              style={{
                background:
                  i < challengeIndex ? "var(--powder)" : "var(--border-soft)",
              }}
            >
              {i === challengeIndex && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: isSubmitted ? "100%" : "0%",
                    background: "var(--powder)",
                    transition: isSubmitted ? "width 1.5s ease-out" : "none",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Quiz naziv */}
        <p className="mt-3 text-center text-xs" style={{ color: "var(--text-mut)" }}>
          {quizTitle}
        </p>
      </div>
    </div>
  );
}
