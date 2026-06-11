import type { Server, Socket } from "socket.io";
import type { Challenge } from "../../../generated/prisma";
import { db } from "~/server/db";
import { validateAnswer, calculateScore } from "~/server/game/scoring";

// ─── Payload tipovi (dijeljeni s klijentom putem re-exporta iz shared/socketTypes.ts) ─

export interface LobbyPlayer {
  userId: string;
  name: string;
  image: string | null;
  connected: boolean;
}

export interface ChallengePayload {
  index: number;
  total: number;
  id: string;
  prompt: string;
  type: Challenge["type"];
  content: unknown;
  mediaUrl: string | null;
  timeLimitSec: number;
  difficulty: Challenge["difficulty"];
  serverStartedAt: number;
}

export interface RoundResultEntry {
  userId: string;
  name: string;
  isCorrect: boolean;
  pointsAwarded: number;
  timeTakenMs: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
}

export interface ServerToClientEvents {
  "lobby:update": (data: { players: LobbyPlayer[] }) => void;
  "game:challenge": (data: ChallengePayload) => void;
  "answer:ack": (data: { isCorrect: boolean; pointsAwarded: number }) => void;
  "player:answered": (data: { userId: string; name: string }) => void;
  "round:result": (data: { perPlayer: RoundResultEntry[]; leaderboard: LeaderboardEntry[] }) => void;
  "game:over": (data: { leaderboard: LeaderboardEntry[]; winnerId: string | null }) => void;
  "room:error": (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  "lobby:join": (data: { code: string }) => void;
  "host:start": (data: { code: string }) => void;
  "answer:submit": (data: { code: string; givenAnswer: Record<string, unknown> }) => void;
}

export interface SocketData {
  userId: string;
  name: string;
  role: string;
}

// ─── Stanje sobe u memoriji ────────────────────────────────────────────────────

interface PlayerState {
  userId: string;
  name: string;
  image: string | null;
  score: number;
  streak: number;
  socketId: string;
  connected: boolean;
}

interface RoundAnswer {
  isCorrect: boolean;
  points: number;
  timeTakenMs: number;
}

interface RoomState {
  code: string;
  quizId: string;
  hostId: string;
  status: "LOBBY" | "IN_PROGRESS" | "FINISHED";
  players: Map<string, PlayerState>; // key = userId
  challenges: Challenge[];
  currentIndex: number;
  currentStartedAt: number;
  answersThisRound: Map<string, RoundAnswer>; // key = userId
  timer: ReturnType<typeof setTimeout> | null;
}

const rooms = new Map<string, RoomState>();

export function getActiveRoomCount(): number {
  let count = 0;
  for (const room of rooms.values()) {
    if (room.status !== "FINISHED") count++;
  }
  return count;
}

// ─── Pomoćne funkcije ──────────────────────────────────────────────────────────

function buildLeaderboard(players: Map<string, PlayerState>): LeaderboardEntry[] {
  return Array.from(players.values())
    .sort((a, b) => b.score - a.score)
    .map((p) => ({ userId: p.userId, name: p.name, score: p.score }));
}

function buildLobbyPlayers(players: Map<string, PlayerState>): LobbyPlayer[] {
  return Array.from(players.values()).map((p) => ({
    userId: p.userId,
    name: p.name,
    image: p.image,
    connected: p.connected,
  }));
}

function connectedCount(players: Map<string, PlayerState>): number {
  let n = 0;
  for (const p of players.values()) if (p.connected) n++;
  return n;
}

function sanitizeChallenge(ch: Challenge, index: number, total: number, startedAt: number): ChallengePayload {
  return {
    index,
    total,
    id: ch.id,
    prompt: ch.prompt,
    type: ch.type,
    content: ch.content,
    mediaUrl: ch.mediaUrl,
    timeLimitSec: ch.timeLimitSec,
    difficulty: ch.difficulty,
    serverStartedAt: startedAt,
  };
}

// ─── Logika runde ──────────────────────────────────────────────────────────────

function startRound(
  io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
  room: RoomState,
) {
  const ch = room.challenges[room.currentIndex];
  if (!ch) return;

  room.answersThisRound = new Map();
  room.currentStartedAt = Date.now();

  if (room.timer) clearTimeout(room.timer);
  room.timer = setTimeout(() => {
    void endRound(io, room);
  }, ch.timeLimitSec * 1000 + 500); // +500ms grace

  io.to(room.code).emit(
    "game:challenge",
    sanitizeChallenge(ch, room.currentIndex, room.challenges.length, room.currentStartedAt),
  );
}

async function endRound(
  io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
  room: RoomState,
) {
  if (room.timer) { clearTimeout(room.timer); room.timer = null; }

  const ch = room.challenges[room.currentIndex];
  if (!ch) return;

  const perPlayer: RoundResultEntry[] = Array.from(room.players.values()).map((p) => {
    const ans = room.answersThisRound.get(p.userId);
    return {
      userId: p.userId,
      name: p.name,
      isCorrect: ans?.isCorrect ?? false,
      pointsAwarded: ans?.points ?? 0,
      timeTakenMs: ans?.timeTakenMs ?? ch.timeLimitSec * 1000,
    };
  });

  io.to(room.code).emit("round:result", {
    perPlayer,
    leaderboard: buildLeaderboard(room.players),
  });

  room.currentIndex++;
  const hasMore = room.currentIndex < room.challenges.length;

  await new Promise((r) => setTimeout(r, 3000));

  if (!hasMore) {
    await finishGame(io, room);
  } else {
    startRound(io, room);
  }
}

async function finishGame(
  io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
  room: RoomState,
) {
  room.status = "FINISHED";
  const leaderboard = buildLeaderboard(room.players);
  const winnerId = leaderboard[0]?.userId ?? null;

  io.to(room.code).emit("game:over", { leaderboard, winnerId });

  // Spremi finalne rezultate u bazu
  try {
    const dbRoom = await db.room.findUnique({ where: { code: room.code }, select: { id: true } });
    if (!dbRoom) return;

    await db.room.update({
      where: { id: dbRoom.id },
      data: { status: "FINISHED", finishedAt: new Date() },
    });

    await Promise.all(
      Array.from(room.players.values()).map((p) =>
        db.roomPlayer.update({
          where: { roomId_userId: { roomId: dbRoom.id, userId: p.userId } },
          data: { finalScore: p.score },
        }),
      ),
    );

    // Kreiraj GameSession za svakog igrača (pojavljuje se u globalnoj ljestvici)
    const quiz = await db.quiz.findUnique({ where: { id: room.quizId }, select: { quizChallenges: { include: { challenge: true }, orderBy: { order: "asc" } } } });
    if (quiz) {
      await Promise.all(
        Array.from(room.players.values()).map((p) =>
          db.gameSession.create({
            data: {
              userId: p.userId,
              quizId: room.quizId,
              mode: "MULTIPLAYER",
              status: "FINISHED",
              totalScore: p.score,
              finishedAt: new Date(),
            },
          }),
        ),
      );
    }
  } catch (e) {
    console.error("[socket] finishGame DB error:", e);
  }

  rooms.delete(room.code);
}

// ─── Registracija handlera ─────────────────────────────────────────────────────

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
) {
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>) => {
    const { userId, name } = socket.data;

    // ── lobby:join ──────────────────────────────────────────────────────────
    socket.on("lobby:join", async ({ code }) => {
      const upperCode = code.toUpperCase();

      // Pokušaj naći sobu u memoriji
      let room = rooms.get(upperCode);

      if (!room) {
        // Učitaj iz baze (reconnect ili novi klijent)
        const dbRoom = await db.room.findUnique({
          where: { code: upperCode },
          include: {
            players: { include: { user: { select: { id: true, name: true, image: true } } } },
          },
        });
        if (!dbRoom) {
          socket.emit("room:error", { message: "Soba nije pronađena." });
          return;
        }
        if (dbRoom.status === "FINISHED") {
          socket.emit("room:error", { message: "Igra je završena." });
          return;
        }

        room = {
          code: upperCode,
          quizId: dbRoom.quizId,
          hostId: dbRoom.hostId,
          status: dbRoom.status as RoomState["status"],
          players: new Map(
            dbRoom.players.map((rp) => [
              rp.userId,
              {
                userId: rp.userId,
                name: rp.user.name ?? "Igrač",
                image: rp.user.image,
                score: rp.finalScore,
                streak: 0,
                socketId: "",
                connected: false,
              },
            ]),
          ),
          challenges: [],
          currentIndex: 0,
          currentStartedAt: 0,
          answersThisRound: new Map(),
          timer: null,
        };
        rooms.set(upperCode, room);
      }

      if (room.status === "IN_PROGRESS" && !room.players.has(userId)) {
        socket.emit("room:error", { message: "Igra je već u tijeku." });
        return;
      }

      await socket.join(upperCode);

      const existing = room.players.get(userId);
      if (existing) {
        existing.socketId = socket.id;
        existing.connected = true;
      } else {
        // Novi igrač koji se pridružuje u LOBBY fazi
        const dbUser = await db.user.findUnique({
          where: { id: userId },
          select: { name: true, image: true },
        });
        room.players.set(userId, {
          userId,
          name: dbUser?.name ?? name,
          image: dbUser?.image ?? null,
          score: 0,
          streak: 0,
          socketId: socket.id,
          connected: true,
        });
      }

      io.to(upperCode).emit("lobby:update", { players: buildLobbyPlayers(room.players) });

      // Ako je reconnect u tijeku igre, pošalji trenutni izazov
      if (room.status === "IN_PROGRESS" && room.challenges.length > 0) {
        const ch = room.challenges[room.currentIndex];
        if (ch) {
          socket.emit("game:challenge", sanitizeChallenge(ch, room.currentIndex, room.challenges.length, room.currentStartedAt));
        }
      }
    });

    // ── host:start ──────────────────────────────────────────────────────────
    socket.on("host:start", async ({ code }) => {
      const upperCode = code.toUpperCase();
      const room = rooms.get(upperCode);
      if (!room) { socket.emit("room:error", { message: "Soba nije pronađena." }); return; }
      if (room.hostId !== userId) { socket.emit("room:error", { message: "Samo host može pokrenuti igru." }); return; }
      if (room.status !== "LOBBY") { socket.emit("room:error", { message: "Igra je već pokrenuta." }); return; }
      if (connectedCount(room.players) < 1) { socket.emit("room:error", { message: "Nema dovoljno igrača." }); return; }

      // Učitaj izazove
      const quiz = await db.quiz.findUnique({
        where: { id: room.quizId },
        include: {
          quizChallenges: {
            include: { challenge: true },
            orderBy: { order: "asc" },
          },
        },
      });
      if (!quiz?.quizChallenges.length) {
        socket.emit("room:error", { message: "Kviz nema izazova." });
        return;
      }

      room.challenges = quiz.quizChallenges.map((qc) => qc.challenge);
      room.status = "IN_PROGRESS";
      room.currentIndex = 0;

      await db.room.update({ where: { code: upperCode }, data: { status: "IN_PROGRESS" } });

      startRound(io, room);
    });

    // ── answer:submit ───────────────────────────────────────────────────────
    socket.on("answer:submit", ({ code, givenAnswer }) => {
      const upperCode = code.toUpperCase();
      const room = rooms.get(upperCode);
      if (!room || room.status !== "IN_PROGRESS") return;
      if (room.answersThisRound.has(userId)) return; // već odgovoreno

      const ch = room.challenges[room.currentIndex];
      if (!ch) return;

      const timeTakenMs = Math.min(Date.now() - room.currentStartedAt, ch.timeLimitSec * 1000);
      const isCorrect = validateAnswer(ch.type, ch.correctAnswer, givenAnswer);
      const player = room.players.get(userId);
      if (!player) return;

      const streak = isCorrect ? player.streak : 0;
      const points = isCorrect
        ? calculateScore({
            basePoints: ch.basePoints,
            timeLimitSec: ch.timeLimitSec,
            difficulty: ch.difficulty,
            timeTakenMs,
            streak,
          })
        : 0;

      player.score += points;
      player.streak = isCorrect ? streak + 1 : 0;

      room.answersThisRound.set(userId, { isCorrect, points, timeTakenMs });

      socket.emit("answer:ack", { isCorrect, pointsAwarded: points });
      io.to(upperCode).emit("player:answered", { userId, name: player.name });

      // Završi rundu ranije ako su svi spojeni igrači odgovorili
      if (room.answersThisRound.size >= connectedCount(room.players)) {
        void endRound(io, room);
      }
    });

    // ── disconnect ──────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      for (const [code, room] of rooms) {
        const player = room.players.get(userId);
        if (player?.socketId === socket.id) {
          player.connected = false;
          io.to(code).emit("lobby:update", { players: buildLobbyPlayers(room.players) });

          // Ako je soba u LOBBY i nema više spojenih igrača, očisti je
          if (room.status === "LOBBY" && connectedCount(room.players) === 0) {
            rooms.delete(code);
          }
          break;
        }
      }
    });
  });
}
