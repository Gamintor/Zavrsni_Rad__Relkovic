"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type RouterOutputs } from "~/trpc/react";

// Count-up hook: animira broj od `from` do `to` u `durationMs`
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

// Tip izazova koji dolazi sa servera — bez correctAnswer
type SessionOk = Extract<RouterOutputs["game"]["getSession"], { status: "IN_PROGRESS" }>;
type SafeChallenge = SessionOk["challenge"];

type Phase = "loading" | "playing" | "feedback" | "error";

interface FeedbackState {
  isCorrect: boolean;
  pointsAwarded: number;
  streak: number;
}

// Tipovi koji sami prikazuju sliku unutar komponente (ne trebaju mediaUrl u promptu)
const SELF_MEDIA_TYPES: SafeChallenge["type"][] = [
  "VISUAL_CLICK",
  "SPOT_DIFFERENCE",
  "PUZZLE",
];

const DIFFICULTY_LABEL = { EASY: "Lako", MEDIUM: "Srednje", HARD: "Teško" } as const;
const DIFFICULTY_COLOR = {
  EASY: "text-green-300",
  MEDIUM: "text-yellow-300",
  HARD: "text-red-300",
} as const;

// Prazan odgovor za svaki tip — šalje se kad istekne timer
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

  const displayScore = useCountUp(totalScore);

  const startTimeRef = useRef(Date.now());

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
    if (sessionQuery.error) {
      setErrorMsg(sessionQuery.error.message);
      setPhase("error");
    }
  }, [sessionQuery.error]);

  const submitMutation = api.game.submitAnswer.useMutation({
    onSuccess: (result) => {
      setFeedback({
        isCorrect: result.isCorrect,
        pointsAwarded: result.pointsAwarded,
        streak: result.streak,
      });
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
    onError: (err) => {
      setErrorMsg(err.message);
      setPhase("error");
    },
  });

  const submitAnswer = useCallback(
    (given: Record<string, unknown>) => {
      if (!challenge || phase !== "playing") return;
      const timeTakenMs = Date.now() - startTimeRef.current;
      setPhase("feedback");
      submitMutation.mutate({
        sessionId,
        challengeId: challenge.id,
        givenAnswer: given,
        timeTakenMs,
      });
    },
    [challenge, phase, sessionId, submitMutation],
  );

  const handleExpire = useCallback(() => {
    if (!challenge || phase !== "playing") return;
    submitAnswer(emptyAnswer(challenge.type));
  }, [challenge, phase, submitAnswer]);

  // ── Renderiranje ──────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15162c] text-white">
        <p className="text-white/50">Učitavanje igre...</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#15162c] text-white">
        <p className="text-red-400">{errorMsg}</p>
        <button
          onClick={() => router.push("/play")}
          className="rounded-full bg-white/10 px-8 py-3 font-semibold transition hover:bg-white/20"
        >
          Natrag na popis
        </button>
      </div>
    );
  }

  if (!challenge) return null;

  const isSubmitted = phase === "feedback";
  const content = challenge.content as Record<string, unknown>;

  // Slika u promptu samo za tipove koji je ne prikazuju sami
  const showMediaInPrompt =
    !!challenge.mediaUrl && !SELF_MEDIA_TYPES.includes(challenge.type);

  return (
    <div className="flex min-h-screen flex-col bg-[#15162c] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="text-sm text-white/60">
            <span className="font-semibold text-white">{quizTitle}</span>
            <span className="mx-2">·</span>
            {challengeIndex + 1} / {totalChallenges}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className={DIFFICULTY_COLOR[challenge.difficulty]}>
              {DIFFICULTY_LABEL[challenge.difficulty]}
            </span>
            <span
              key={totalScore}
              className="animate-score-bump font-bold text-[hsl(280,100%,70%)]"
            >
              {displayScore} bod.
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mx-auto mt-3 max-w-2xl">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[hsl(280,100%,70%)] transition-all"
              style={{
                width: `${((challengeIndex + 1) / totalChallenges) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>

      {/* Sadržaj */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
        {/* Timer */}
        <div className="mb-6">
          <Timer
            key={challenge.id}
            timeLimitSec={challenge.timeLimitSec}
            onExpire={handleExpire}
            paused={isSubmitted}
          />
        </div>

        {/* Prompt */}
        <div className="mb-8">
          <p className="text-xl font-semibold leading-relaxed">{challenge.prompt}</p>
          {showMediaInPrompt && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={challenge.mediaUrl!}
              alt="Slika izazova"
              className="mt-4 max-h-64 rounded-xl object-contain"
            />
          )}
        </div>

        {/* ── Sučelje za odgovor (po tipu) ────────────────────────────────── */}
        <div className="flex-1">
          {challenge.type === "MULTIPLE_CHOICE" && (
            <MultipleChoice
              options={(content.options as string[]) ?? []}
              onSubmit={submitAnswer}
              disabled={isSubmitted}
            />
          )}

          {challenge.type === "TRUE_FALSE" && (
            <TrueFalse onSubmit={submitAnswer} disabled={isSubmitted} />
          )}

          {challenge.type === "TEXT_INPUT" && (
            <TextInput onSubmit={submitAnswer} disabled={isSubmitted} />
          )}

          {challenge.type === "VISUAL_CLICK" && (
            <VisualClick
              mediaUrl={challenge.mediaUrl}
              onSubmit={submitAnswer}
              disabled={isSubmitted}
            />
          )}

          {challenge.type === "SPOT_DIFFERENCE" && (
            <SpotDifference
              mediaUrl={challenge.mediaUrl}
              imageB={(content.imageB as string) ?? ""}
              onSubmit={submitAnswer}
              disabled={isSubmitted}
            />
          )}

          {challenge.type === "IMAGE_ORDER" && (
            <ImageOrder
              images={(content.images as string[]) ?? []}
              onSubmit={submitAnswer}
              disabled={isSubmitted}
            />
          )}

          {challenge.type === "SEQUENCE" && (
            <Sequence
              items={(content.items as string[]) ?? []}
              onSubmit={submitAnswer}
              disabled={isSubmitted}
            />
          )}

          {challenge.type === "MEMORY" && (
            <Memory
              pairs={
                (content.pairs as {
                  id: string;
                  front: string;
                  back: string;
                }[]) ?? []
              }
              onSubmit={submitAnswer}
              disabled={isSubmitted}
            />
          )}

          {challenge.type === "PUZZLE" && (
            <Puzzle
              mediaUrl={challenge.mediaUrl}
              rows={(content.rows as number) ?? 3}
              cols={(content.cols as number) ?? 3}
              onSubmit={submitAnswer}
              disabled={isSubmitted}
            />
          )}
        </div>

        {/* Feedback overlay */}
        {isSubmitted && feedback && (
          <div
            className={`mt-6 rounded-xl p-5 text-center font-bold ${
              feedback.isCorrect
                ? "animate-feedback-correct bg-green-500/20 text-green-300"
                : "animate-feedback-wrong bg-red-500/20 text-red-300"
            }`}
          >
            <p className="text-2xl">
              {feedback.isCorrect ? "✓ Točno!" : "✗ Netočno"}
            </p>
            {feedback.isCorrect && (
              <p className="mt-1 text-base font-normal">
                +{feedback.pointsAwarded} bodova
                {feedback.streak > 1 && (
                  <span className="animate-streak-pulse ml-2 inline-block text-[hsl(280,100%,70%)]">
                    🔥 {feedback.streak}× streak
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
