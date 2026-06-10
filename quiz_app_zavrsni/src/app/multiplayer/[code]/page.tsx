"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
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
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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
  const startMutation = api.room.create.useMutation(); // placeholder — host uses socket

  const isHost = room?.hostId === me?.id;

  // Registriraj socket handlere
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

  // ─── Renderiranje ──────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15162c] text-white">
        <p className="text-white/50">Spajanje na sobu...</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#15162c] text-white">
        <p className="text-red-400">{errorMsg}</p>
        <Link href="/" className="rounded-full bg-white/10 px-8 py-3 font-semibold transition hover:bg-white/20">
          Natrag na početak
        </Link>
      </div>
    );
  }

  if (phase === "lobby") {
    return (
      <main className="min-h-screen bg-[#15162c] text-white">
        <div className="container mx-auto max-w-lg px-4 py-12">
          <div className="mb-6 text-center">
            <p className="text-sm text-white/50">Kod sobe</p>
            <p className="mt-1 text-4xl font-extrabold tracking-[0.3em] text-[hsl(280,100%,70%)]">
              {upperCode}
            </p>
            <p className="mt-1 text-xs text-white/30">
              Podijeli ovaj kod s prijateljima
            </p>
          </div>

          <div className="mb-6 rounded-2xl bg-white/10 p-6">
            <h2 className="mb-4 font-semibold">
              Igrači ({players.filter((p) => p.connected).length} / {players.length})
            </h2>
            <ul className="space-y-2">
              {players.map((p) => (
                <li key={p.userId} className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${p.connected ? "bg-green-400" : "bg-white/20"}`}
                  />
                  <span className={p.connected ? "text-white" : "text-white/40"}>
                    {p.name}
                  </span>
                  {p.userId === room?.hostId && (
                    <span className="ml-auto text-xs text-[hsl(280,100%,70%)]">host</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {isHost ? (
            <button
              onClick={handleStart}
              disabled={players.filter((p) => p.connected).length < 1}
              className="w-full rounded-full bg-[hsl(280,100%,70%)] py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
            >
              Pokreni igru
            </button>
          ) : (
            <p className="text-center text-sm text-white/50">Čekaj da host pokrene igru...</p>
          )}
        </div>
      </main>
    );
  }

  if (phase === "between_rounds" && roundResult) {
    return (
      <main className="flex min-h-screen flex-col bg-[#15162c] text-white">
        <div className="container mx-auto max-w-lg px-4 py-12">
          <h2 className="mb-6 text-center text-2xl font-bold">Rezultati runde</h2>

          <div className="mb-6 overflow-hidden rounded-xl border border-white/10">
            {roundResult.perPlayer.map((p) => (
              <div key={p.userId} className="flex items-center justify-between border-t border-white/10 px-4 py-3 first:border-t-0">
                <div className="flex items-center gap-3">
                  <span className={p.isCorrect ? "text-green-400" : "text-red-400"}>
                    {p.isCorrect ? "✓" : "✗"}
                  </span>
                  <span>{p.name}</span>
                </div>
                <span className="font-bold text-[hsl(280,100%,70%)]">
                  {p.pointsAwarded > 0 ? `+${p.pointsAwarded}` : "—"}
                </span>
              </div>
            ))}
          </div>

          <h3 className="mb-3 font-semibold text-white/70">Ljestvica</h3>
          <div className="overflow-hidden rounded-xl border border-white/10">
            {roundResult.leaderboard.map((entry, i) => (
              <div key={entry.userId} className={`flex items-center justify-between border-t border-white/10 px-4 py-3 first:border-t-0 ${entry.userId === me?.id ? "bg-[hsl(280,100%,70%)]/10" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-white/40">{i + 1}.</span>
                  <span>{entry.name}</span>
                </div>
                <span className="font-bold">{entry.score}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-white/40">Sljedeći izazov stiže za trenutak...</p>
        </div>
      </main>
    );
  }

  if (phase === "finished" && gameOver) {
    const myEntry = gameOver.leaderboard.find((e) => e.userId === me?.id);
    const myRank = gameOver.leaderboard.findIndex((e) => e.userId === me?.id) + 1;
    const winner = gameOver.leaderboard[0];

    return (
      <main className="flex min-h-screen flex-col bg-[#15162c] text-white">
        <div className="container mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-6xl">🏆</p>
          <h1 className="mt-4 text-3xl font-extrabold">Igra završena!</h1>
          {winner && (
            <p className="mt-2 text-lg text-white/70">
              Pobjednik: <span className="font-bold text-[hsl(280,100%,70%)]">{winner.name}</span>
            </p>
          )}

          {myEntry && (
            <div className="mx-auto mt-6 w-fit rounded-2xl bg-white/10 px-8 py-4">
              <p className="text-4xl font-extrabold text-[hsl(280,100%,70%)]">{myEntry.score}</p>
              <p className="text-sm text-white/50">tvoji bodovi · {myRank}. mjesto</p>
            </div>
          )}

          <div className="mt-8 overflow-hidden rounded-xl border border-white/10 text-left">
            {gameOver.leaderboard.map((entry, i) => (
              <div key={entry.userId} className={`flex items-center justify-between border-t border-white/10 px-4 py-3 first:border-t-0 ${entry.userId === me?.id ? "bg-[hsl(280,100%,70%)]/10" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-white/40">{i + 1}.</span>}
                  </span>
                  <span>{entry.name}</span>
                </div>
                <span className="font-bold">{entry.score}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <Link href="/multiplayer/create" className="flex-1 rounded-full bg-[hsl(280,100%,70%)] py-3 text-center font-semibold text-black transition hover:opacity-90">
              Nova igra
            </Link>
            <Link href="/" className="flex-1 rounded-full bg-white/10 py-3 text-center font-semibold transition hover:bg-white/20">
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
    <div className="flex min-h-screen flex-col bg-[#15162c] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="text-sm text-white/60">
            <span className="font-semibold text-white">{upperCode}</span>
            <span className="mx-2">·</span>
            {challenge.index + 1} / {challenge.total}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-bold text-[hsl(280,100%,70%)]">{myScore} bod.</span>
          </div>
        </div>
        <div className="mx-auto mt-3 max-w-2xl">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[hsl(280,100%,70%)] transition-all"
              style={{ width: `${((challenge.index + 1) / challenge.total) * 100}%` }}
            />
          </div>
        </div>
        {/* Tko je odgovorio */}
        <div className="mx-auto mt-2 flex max-w-2xl gap-2">
          {players.map((p) => (
            <span
              key={p.userId}
              title={p.name}
              className={`h-2 w-2 rounded-full transition-colors ${
                answeredUserIds.has(p.userId) ? "bg-green-400" : "bg-white/20"
              }`}
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
        <div className="mb-8">
          <p className="text-xl font-semibold leading-relaxed">{challenge.prompt}</p>
          {showMediaInPrompt && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={challenge.mediaUrl!} alt="Slika izazova" className="mt-4 max-h-64 rounded-xl object-contain" />
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
          <div className={`mt-6 rounded-xl p-5 text-center font-bold ${feedback.isCorrect ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
            <p className="text-2xl">{feedback.isCorrect ? "✓ Točno!" : "✗ Netočno"}</p>
            {feedback.isCorrect && (
              <p className="mt-1 text-base font-normal">+{feedback.pointsAwarded} bodova</p>
            )}
          </div>
        )}
        {answered && !feedback && (
          <div className="mt-6 rounded-xl bg-white/10 p-5 text-center text-white/50">
            Čekaj ostale igrače...
          </div>
        )}
      </div>
    </div>
  );
}
