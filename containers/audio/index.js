import WebSocket from "ws";
import { spawn } from "child_process";
import path from "path";

const APP_KEY = process.env.PUSHER_KEY || "mykey";
const HOST = process.env.SOKETI_HOST || "sweet-soketi";
const PORT = process.env.SOKETI_PORT || 6001;

// Sound file paths
const basePath = "./sounds";
const sounds = {
  start: `${basePath}/background.mp3`,
  move: `${basePath}/move.mp3`,
  stop: `${basePath}/stop.mp3`,
  grab: `${basePath}/grab.mp3`,
};

let backgroundProcess = null;
let lastMoveTime = 0;
const MOVE_COOLDOWN_MS = 200; // Minimum delay between move sounds

// Play a sound using ffplay
function playSound(file, { loop = false, persistent = false } = {}) {
  const fullPath = path.resolve(file);
  const env = {
    ...process.env,
    PULSE_SERVER: "unix:/run/user/1000/pulse/native",
    XDG_RUNTIME_DIR: "/run/user/1000",
    HOME: "/home/pi",
  };

  const args = [];
  if (loop) args.push("-loop", "0");
  args.push("-nodisp", "-loglevel", "quiet");
  if (!persistent) args.push("-autoexit");
  args.push(fullPath);

  const ff = spawn("ffplay", args, { env });
  ff.on("error", (err) => console.error("ffplay failed:", err.message));
  return ff;
}

// Connect to Soketi server
const wsUrl = `ws://${HOST}:${PORT}/app/${APP_KEY}?protocol=7&client=js&version=8.4.0`;
console.log("Connecting to Soketi:", wsUrl);

const ws = new WebSocket(wsUrl);

ws.on("open", () => {
  console.log("Connected to Soketi server");

  ws.send(
    JSON.stringify({
      event: "pusher:subscribe",
      data: { channel: "joystick" },
    })
  );
});

ws.on("message", (message) => {
  try {
    const parsed = JSON.parse(message.toString());
    if (!parsed.event || !parsed.channel) return;

    console.log("🔊 Received:", parsed.event, parsed.data);

    // Parse data if it comes as a JSON string
    let data = parsed.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (err) {
        console.error("Failed to parse event data:", data);
        return;
      }
    }

    const startTime = performance.now();

    switch (parsed.event) {
      case "motor_start":
        console.log("motor_start received");
        if (!backgroundProcess)
          backgroundProcess = playSound(sounds.start, {
            loop: true,
            persistent: true,
          });
        break;

      case "move": {
        const { direction } = data || {};
        const now = Date.now();

        if (!direction) return;

        if (direction === "grab") {
          console.log("grab received");
          playSound(sounds.grab);
          lastMoveTime = now;
          return;
        }

        if (now - lastMoveTime >= MOVE_COOLDOWN_MS) {
          console.log("move received:", direction);
          playSound(sounds.move);
          lastMoveTime = now;
        }
        break;
      }

      case "motor_stop":
        console.log("motor_stop received");
        if (backgroundProcess) {
          backgroundProcess.kill("SIGTERM");
          backgroundProcess = null;
        }
        playSound(sounds.stop);
        break;
    }

    const endTime = performance.now();
    console.log(
      `Event "${parsed.event}" handled in ${(endTime - startTime).toFixed(2)} ms`
    );
  } catch (err) {
    console.error("Error handling message:", err.message);
  }
});

ws.on("error", (err) => console.error("WebSocket error:", err.message));
ws.on("close", () => console.log("Disconnected from Soketi"));

process.on("SIGINT", () => {
  if (backgroundProcess) backgroundProcess.kill("SIGTERM");
  ws.close();
  process.exit();
});
