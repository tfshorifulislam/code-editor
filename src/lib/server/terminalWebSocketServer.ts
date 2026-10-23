import { WebSocketServer, WebSocket } from "ws";
import { parse as parseUrl } from "url";
import {
  getTerminalSession,
  executeCommandInSession,
  writeSessionStdin,
  killSessionProcess,
  createTerminalSession,
  listTerminalSessions,
  StreamEvent,
} from "./terminalSessionManager";

let wssInstance: WebSocketServer | null = null;
let currentBoundPort: number = 3005;

/**
 * Returns the currently active WebSocket port or null if not yet started.
 */
export function getTerminalWSPort(): number {
  return currentBoundPort;
}

/**
 * Initializes or returns the singleton WebSocket server for interactive terminal sessions.
 */
export function getOrCreateTerminalWSServer(): WebSocketServer {
  if (wssInstance) {
    return wssInstance;
  }

  const preferredPort = parseInt(process.env.TERMINAL_WS_PORT || "3005", 10);

  const startServerOnPort = (port: number) => {
    try {
      const server = new WebSocketServer({ port });
      currentBoundPort = port;
      wssInstance = server;

      server.on("connection", (ws: WebSocket, req) => {
        const { query } = parseUrl(req.url || "", true);
        const projectId = query.projectId as string;
        let sessionId = query.sessionId as string;

        if (!projectId) {
          ws.send(JSON.stringify({ type: "error", data: "Missing projectId parameter.\r\n" }));
          ws.close();
          return;
        }

        // Retrieve or create session
        let session = sessionId ? getTerminalSession(projectId, sessionId) : undefined;
        if (!session) {
          const sessions = listTerminalSessions(projectId);
          session = sessions.length > 0
            ? getTerminalSession(projectId, sessions[0].id)
            : createTerminalSession(projectId);
        }

        if (!session) {
          session = createTerminalSession(projectId);
        }

        sessionId = session.id;

        // Send initialization state & buffer replay to client
        ws.send(
          JSON.stringify({
            type: "init",
            sessionId: session.id,
            name: session.name,
            shellType: session.shellType,
            cwd: session.cwd,
            history: session.history,
            recentBuffer: session.recentBuffer.join(""),
          })
        );

        let activeKillFn: (() => Promise<boolean>) | null = null;

        // Handle incoming messages from the xterm frontend
        ws.on("message", (raw) => {
          try {
            const msg = JSON.parse(raw.toString("utf-8"));

            if (msg.type === "execute" && typeof msg.command === "string") {
              activeKillFn = executeCommandInSession(
                projectId,
                sessionId,
                msg.command,
                (ev: StreamEvent) => {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(ev));
                  }
                }
              );
            } else if (msg.type === "input" && typeof msg.data === "string") {
              writeSessionStdin(projectId, sessionId, msg.data);
            } else if (msg.type === "kill") {
              killSessionProcess(projectId, sessionId).then(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "stderr", data: "^C\r\n" }));
                }
              });
            }
          } catch (err) {
            console.warn("WebSocket parse error:", err);
          }
        });

        ws.on("close", () => {
          // Client disconnected
        });

        ws.on("error", (err) => {
          console.warn("WebSocket client error:", err);
        });
      });

      server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.log(`Port ${port} in use, trying port ${port + 1}...`);
          server.close();
          startServerOnPort(port + 1);
        } else {
          console.error("Terminal WebSocket server error:", err);
        }
      });

      return server;
    } catch (e) {
      console.warn("Failed to bind WebSocket server on port", port, e);
      return startServerOnPort(port + 1);
    }
  };

  return startServerOnPort(preferredPort);
}
