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

  const args = ["-nodisp", "-loglevel", "quiet", fullPath];
  if (!persistent) args.push("-autoexit");
  if (loop) args.unshift("-loop", "0");

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

  // Subscribe to the joystick channel
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
        const now = Date.now();
        if (now - lastMoveTime >= MOVE_COOLDOWN_MS) {
          console.log("move received");
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
  } catch {
    // Ignore control messages
  }
});

ws.on("error", (err) => console.error("WebSocket error:", err.message));
ws.on("close", () => console.log("Disconnected from Soketi"));

process.on("SIGINT", () => {
  if (backgroundProcess) backgroundProcess.kill("SIGTERM");
  ws.close();
  process.exit();
});
