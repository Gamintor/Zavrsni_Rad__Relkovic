"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useSocket } from "~/app/_components/SocketProvider";
import Timer from "~/app/play/_components/Timer";
import MultipleChoice from "~/app/play/_components/challenges/MultipleChoice";
import TrueFalse from "~/app/play/_components/challenges/TrueFalse";
import TextInput from "~/app/play/_components/challenges/TextInput";
import VisualClick from "~/app/play/_components/challenges/VisualClick";
import SpotDifference from "~/app/play/_components/challenges/SpotDifference";
import ImageOrder from "~/app/play/_components/challenges/ImageOrder";
import Sequence from "~/app/play/_components/challenges/Sequence";
import Memory from "~/app/play/_components/challenges/Memory";
import Puzzle from "~/app/play/_components/challenges/Puzzle";
import type {
  LobbyPlayer,
  ChallengePayload,
  RoundResultEntry,
  LeaderboardEntry,
} from "~/server/socket/handler";

type GamePhase =
  | "loading"
  | "lobby"
  | "in_progress"
  | "between_rounds"
  | "finished"
  | "error";

interface RoundResult {
  perPlayer: RoundResultEntry[];
  leaderboard: LeaderboardEntry[];
}

interface GameOver {
  leaderboard: LeaderboardEntry[];
  winnerId: string | null;
}

function emptyAnswer(type: ChallengePayload["type"]): Record<string, unknown> {
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

const SELF_MEDIA_TYPES: ChallengePayload["type"][] = ["VISUAL_CLICK", "SPOT_DIFFERENCE", "PUZZLE"];

export default function MultiplayerRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const upperCode = code.toUpperCase();
  const { socket, connected } = useSocket();

  const [phase, setPhase] = useState<GamePhase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [challenge, setChallenge] = useState<ChallengePayload | null>(null);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; pointsAwarded: number } | null>(null);
  const [answeredUserIds, setAnsweredUserIds] = useState<Set<string>>(new Set());
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [gameOver, setGameOver] = useState<GameOver | null>(null);
  const [myScore, setMyScore] = useState(0);

  const { data: room } = api.room.getByCode.useQuery({ code: upperCode });
  const { data: me } = api.user.me.useQuery();

  const isHost = room?.hostId === me?.id;

  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit("lobby:join", { code: upperCode });

    socket.on("lobby:update", ({ players: p }) => {
      setPlayers(p);
      setPhase((prev) => (prev === "loading" ? "lobby" : prev));
    });

    socket.on("game:challenge", (ch) => {
      setChallenge(ch);
      setAnswered(false);
      setFeedback(null);
      setAnsweredUserIds(new Set());
      setPhase("in_progress");
    });

    socket.on("answer:ack", ({ isCorrect, pointsAwarded }) => {
      setFeedback({ isCorrect, pointsAwarded });
      if (isCorrect) setMyScore((s) => s + pointsAwarded);
    });

    socket.on("player:answered", ({ userId }) => {
      setAnsweredUserIds((prev) => new Set([...prev, userId]));
    });

    socket.on("round:result", (result) => {
      setRoundResult(result);
      setPhase("between_rounds");
    });

    socket.on("game:over", (data) => {
      setGameOver(data);
      setPhase("finished");
    });

    socket.on("room:error", ({ message }) => {
      setErrorMsg(message);
      setPhase("error");
    });

    return () => {
      socket.off("lobby:update");
      socket.off("game:challenge");
      socket.off("answer:ack");
      socket.off("player:answered");
      socket.off("round:result");
      socket.off("game:over");
      socket.off("room:error");
    };
  }, [socket, connected, upperCode]);

  const submitAnswer = useCallback(
    (givenAnswer: Record<string, unknown>) => {
      if (!socket || answered || !challenge) return;
      setAnswered(true);
      socket.emit("answer:submit", { code: upperCode, givenAnswer });
    },
    [socket, answered, challenge, upperCode],
  );

  const handleExpire = useCallback(() => {
    if (!challenge || answered) return;
    submitAnswer(emptyAnswer(challenge.type));
  }, [challenge, answered, submitAnswer]);

  const handleStart = () => {
    if (!socket) return;
    socket.emit("host:start", { code: upperCode });
  };

  // ─── Renderiranje ─────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--text-mut)" }}>Spajanje na sobu...</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p style={{ color: "var(--red)" }}>{errorMsg}</p>
        <Link href="/" className="btn-secondary px-8 py-3">Natrag na početak</Link>
      </div>
    );
  }

  if (phase === "lobby") {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto max-w-lg px-4 py-12">
          <div className="mb-6 text-center">
            <p className="text-sm" style={{ color: "var(--text-mut)" }}>Kod sobe</p>
            <p
              className="mt-1 text-4xl font-extrabold tracking-[0.3em]"
              style={{ color: "var(--powder)", textShadow: "0 0 30px rgba(168,218,220,0.4)" }}
            >
              {upperCode}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-mut)" }}>
              Podijeli ovaj kod s prijateljima
            </p>
          </div>

          <div className="glass mb-6 rounded-[var(--r-card)] p-6">
            <h2 className="mb-4 font-semibold" style={{ color: "var(--cream)" }}>
              Igrači ({players.filter((p) => p.connected).length} / {players.length})
            </h2>
            <ul className="space-y-2">
              {players.map((p) => (
                <li key={p.userId} className="flex items-center gap-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: p.connected ? "var(--green)" : "var(--border-soft)" }}
                  />
                  <span style={{ color: p.connected ? "var(--cream)" : "var(--text-mut)" }}>
                    {p.name}
                  </span>
                  {p.userId === room?.hostId && (
                    <span className="ml-auto text-xs font-semibold" style={{ color: "var(--powder)" }}>host</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {isHost ? (
            <button
              onClick={handleStart}
              disabled={players.filter((p) => p.connected).length < 1}
              className="btn-primary w-full py-3 disabled:opacity-40"
            >
              Pokreni igru
            </button>
          ) : (
            <p className="text-center text-sm" style={{ color: "var(--text-mut)" }}>Čekaj da host pokrene igru...</p>
          )}
        </div>
      </main>
    );
  }

  if (phase === "between_rounds" && roundResult) {
    return (
      <main className="min-h-screen">
        <div className="container mx-auto max-w-lg px-4 py-12">
          <h2 className="mb-6 text-center text-2xl font-bold" style={{ color: "var(--cream)" }}>Rezultati runde</h2>

          <div className="glass mb-6 overflow-hidden rounded-[var(--r-card)]">
            {roundResult.perPlayer.map((p, i) => (
              <div
                key={p.userId}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-soft)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold" style={{ color: p.isCorrect ? "var(--green)" : "var(--red)" }}>
                    {p.isCorrect ? "✓" : "✗"}
                  </span>
                  <span style={{ color: "var(--cream)" }}>{p.name}</span>
                </div>
                <span className="font-bold" style={{ color: "var(--powder)" }}>
                  {p.pointsAwarded > 0 ? `+${p.pointsAwarded}` : "—"}
                </span>
              </div>
            ))}
          </div>

          <h3 className="mb-3 font-semibold" style={{ color: "var(--text-mut)" }}>Ljestvica</h3>
          <div className="glass overflow-hidden rounded-[var(--r-card)]">
            {roundResult.leaderboard.map((entry, i) => (
              <div
                key={entry.userId}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--border-soft)",
                  background: entry.userId === me?.id ? "rgba(168,218,220,0.07)" : "transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center" style={{ color: "var(--text-mut)" }}>{i + 1}.</span>
                  <span style={{ color: "var(--cream)" }}>{entry.name}</span>
                </div>
                <span className="font-bold" style={{ color: "var(--powder)" }}>{entry.score}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--text-mut)" }}>Sljedeći izazov stiže za trenutak...</p>
        </div>
      </main>
    );
  }

  if (phase === "finished" && gameOver) {
    const myEntry = gameOver.leaderboard.find((e) => e.userId === me?.id);
    const myRank = gameOver.leaderboard.findIndex((e) => e.userId === me?.id) + 1;
    const winner = gameOver.leaderboard[0];

    return (
      <main className="min-h-screen">
        <div className="container mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-6xl">🏆</p>
          <h1 className="mt-4 text-3xl font-extrabold" style={{ color: "var(--cream)" }}>Igra završena!</h1>
          {winner && (
            <p className="mt-2 text-lg" style={{ color: "var(--text-mut)" }}>
              Pobjednik: <span className="font-bold" style={{ color: "var(--powder)" }}>{winner.name}</span>
            </p>
          )}

          {myEntry && (
            <div
              className="glass mx-auto mt-6 w-fit rounded-[var(--r-card)] px-8 py-4"
            >
              <p className="text-4xl font-extrabold" style={{ color: "var(--powder)" }}>{myEntry.score}</p>
              <p className="text-sm" style={{ color: "var(--text-mut)" }}>tvoji bodovi · {myRank}. mjesto</p>
            </div>
          )}

          <div className="glass mt-8 overflow-hidden rounded-[var(--r-card)] text-left">
            {gameOver.leaderboard.map((entry, i) => (
              <div
                key={entry.userId}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--border-soft)",
                  background: entry.userId === me?.id ? "rgba(168,218,220,0.07)" : "transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span style={{ color: "var(--text-mut)" }}>{i + 1}.</span>}
                  </span>
                  <span style={{ color: "var(--cream)" }}>{entry.name}</span>
                </div>
                <span className="font-bold" style={{ color: "var(--powder)" }}>{entry.score}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <Link href="/multiplayer/create" className="btn-primary flex-1 py-3 text-center">
              Nova igra
            </Link>
            <Link href="/" className="btn-secondary flex-1 py-3 text-center">
              Natrag
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── in_progress ──────────────────────────────────────────────────────────────
  if (!challenge) return null;

  const adjustedTimeLimitSec = Math.max(
    1,
    challenge.timeLimitSec - Math.floor((Date.now() - challenge.serverStartedAt) / 1000),
  );

  const content = challenge.content as Record<string, unknown>;
  const showMediaInPrompt = !!challenge.mediaUrl && !SELF_MEDIA_TYPES.includes(challenge.type);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)", background: "var(--glass)" }}>
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="text-sm" style={{ color: "var(--text-mut)" }}>
            <span className="font-semibold" style={{ color: "var(--cream)" }}>{upperCode}</span>
            <span className="mx-2">·</span>
            {challenge.index + 1} / {challenge.total}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-bold" style={{ color: "var(--powder)" }}>{myScore} bod.</span>
          </div>
        </div>
        {/* Progres */}
        <div className="mx-auto mt-3 max-w-2xl">
          <div className="flex gap-1">
            {Array.from({ length: challenge.total }, (_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all"
                style={{
                  background: i < challenge.index + 1 ? "var(--powder)" : "var(--border-soft)",
                  opacity: i === challenge.index ? 1 : 0.6,
                }}
              />
            ))}
          </div>
        </div>
        {/* Tko je odgovorio */}
        <div className="mx-auto mt-2 flex max-w-2xl gap-2">
          {players.map((p) => (
            <span
              key={p.userId}
              title={p.name}
              className="h-2 w-2 rounded-full transition-colors"
              style={{ background: answeredUserIds.has(p.userId) ? "var(--green)" : "var(--border-soft)" }}
            />
          ))}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
        {/* Timer */}
        <div className="mb-6">
          <Timer
            key={challenge.id}
            timeLimitSec={adjustedTimeLimitSec}
            onExpire={handleExpire}
            paused={answered}
          />
        </div>

        {/* Prompt */}
        <div className="glass mb-6 rounded-[var(--r-card)] p-6">
          <p className="text-xl font-semibold leading-relaxed" style={{ color: "var(--cream)" }}>
            {challenge.prompt}
          </p>
          {showMediaInPrompt && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={challenge.mediaUrl!}
              alt="Slika izazova"
              className="mt-4 max-h-64 rounded-[var(--r-tile)] object-contain"
            />
          )}
        </div>

        {/* Challenge komponente */}
        <div className="flex-1">
          {challenge.type === "MULTIPLE_CHOICE" && (
            <MultipleChoice options={(content.options as string[]) ?? []} onSubmit={submitAnswer} disabled={answered} />
          )}
          {challenge.type === "TRUE_FALSE" && (
            <TrueFalse onSubmit={submitAnswer} disabled={answered} />
          )}
          {challenge.type === "TEXT_INPUT" && (
            <TextInput onSubmit={submitAnswer} disabled={answered} />
          )}
          {challenge.type === "VISUAL_CLICK" && (
            <VisualClick mediaUrl={challenge.mediaUrl} onSubmit={submitAnswer} disabled={answered} />
          )}
          {challenge.type === "SPOT_DIFFERENCE" && (
            <SpotDifference mediaUrl={challenge.mediaUrl} imageB={(content.imageB as string) ?? ""} onSubmit={submitAnswer} disabled={answered} />
          )}
          {challenge.type === "IMAGE_ORDER" && (
            <ImageOrder images={(content.images as string[]) ?? []} onSubmit={submitAnswer} disabled={answered} />
          )}
          {challenge.type === "SEQUENCE" && (
            <Sequence items={(content.items as string[]) ?? []} onSubmit={submitAnswer} disabled={answered} />
          )}
          {challenge.type === "MEMORY" && (
            <Memory pairs={(content.pairs as { id: string; front: string; back: string }[]) ?? []} onSubmit={submitAnswer} disabled={answered} />
          )}
          {challenge.type === "PUZZLE" && (
            <Puzzle mediaUrl={challenge.mediaUrl} rows={(content.rows as number) ?? 3} cols={(content.cols as number) ?? 3} onSubmit={submitAnswer} disabled={answered} />
          )}
        </div>

        {/* Feedback */}
        {answered && feedback && (
          <div
            className="mt-6 rounded-[var(--r-card)] p-5 text-center font-bold"
            style={{
              background: feedback.isCorrect ? "rgba(42,157,143,0.15)" : "rgba(230,57,70,0.15)",
              border: `1px solid ${feedback.isCorrect ? "rgba(42,157,143,0.4)" : "rgba(230,57,70,0.4)"}`,
              color: feedback.isCorrect ? "var(--green)" : "var(--red)",
            }}
          >
            <p className="text-2xl">{feedback.isCorrect ? "✓ Točno!" : "✗ Netočno"}</p>
            {feedback.isCorrect && (
              <p className="mt-1 text-base font-normal">+{feedback.pointsAwarded} bodova</p>
            )}
          </div>
        )}
        {answered && !feedback && (
          <div className="glass mt-6 rounded-[var(--r-card)] p-5 text-center" style={{ color: "var(--text-mut)" }}>
            Čekaj ostale igrače...
          </div>
        )}
      </div>
    </div>
  );
}
