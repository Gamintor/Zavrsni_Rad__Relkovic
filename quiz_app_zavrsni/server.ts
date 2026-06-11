import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server } from "socket.io";
import { decode } from "@auth/core/jwt";
import { registerSocketHandlers } from "./src/server/socket/handler.js";
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from "./src/server/socket/handler.js";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;


const app = next({ dev });
const handle = app.getRequestHandler();

await app.prepare();

const httpServer = createServer((req, res) => {
  const parsedUrl = parse(req.url ?? "/", true);
  void handle(req, res, parsedUrl);
});

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
  cors: { origin: "*", credentials: true },
});

// ─── Socket.IO auth middleware ─────────────────────────────────────────────────
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((c) => c.trim().split("="))
        .filter((parts) => parts.length >= 2)
        .map(([k, ...v]) => [k!.trim(), decodeURIComponent(v.join("="))]),
    );

    // const cookieName = dev ? "authjs.session-token" : "__Secure-authjs.session-token";
    // const token = cookies[cookieName];
    const candidates = ["__Secure-authjs.session-token", "authjs.session-token"];

    let cookieName = candidates.find((n) => cookies[n] !== undefined);
    let token = cookieName ? cookies[cookieName] : undefined;

    if (!token) {
      for (const base of candidates) {
        const parts = Object.keys(cookies).filter((k) => k.startsWith(base + ".")).sort();
        if (parts.length) {
          cookieName = base;                       // salt MORA biti bazno ime, ne ".0"
          token = parts.map((k) => cookies[k]).join("");
          break;
        }
      }
    }

    if (!token || !cookieName) {
      next(new Error("Unauthorized: no session token"));
      return;
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      next(new Error("Server misconfig: AUTH_SECRET missing"));
      return;
    }
    const decoded = await decode({ token, secret, salt: cookieName });

    if (!decoded) {
      next(new Error("Unauthorized: invalid token"));
      return;
    }

    const d = decoded as Record<string, unknown>;
    const userId = (d.id as string | undefined) ?? decoded.sub ?? "";
    const name = (decoded.name as string | undefined) ?? "Igrač";
    const role = (d.role as string | undefined) ?? "PLAYER";

    socket.data = { userId, name, role };
    next();
  } catch {
    next(new Error("Unauthorized: token decode failed"));
  }
});

registerSocketHandlers(io);

httpServer.listen(port,"0.0.0.0", () => {
  console.log(`> Ready on port:${port} [${dev ? "dev" : "production"}]`);
});
