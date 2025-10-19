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
  alert: `${basePath}/alert.mp3`, // Add this new alert sound file
};

let backgroundProcess = null;
let alertInterval = null;
let lastMoveTime = 0;
const MOVE_COOLDOWN_MS = 200;

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

// Start alert beep loop (dynamic speed)
function startAlertLoop(sugarValue) {
  stopAlertLoop();

  // The higher the sugar value, the faster the beep
  const intervalTime = Math.max(200, 1000 - (sugarValue - 175) * 10);

  console.log(`Starting alert loop at ${intervalTime} ms`);

  alertInterval = setInterval(() => {
    playSound(sounds.alert);
  }, intervalTime);
}

// Stop alert loop
function stopAlertLoop() {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
    console.log("Alert loop stopped");
  }
}

// Connect to Soketi
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
    const eventName = parsed.event;
    if (!eventName) return;

    let data = parsed.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        data = {};
      }
    }

    console.log("Received event:", eventName, data);
    const startTime = performance.now();

    switch (eventName) {
      case "pusher_internal:subscription_succeeded":
        console.log("Subscribed to joystick channel");
        break;

      case "motor_start":
        console.log("motor_start received");
        if (!backgroundProcess)
          backgroundProcess = playSound(sounds.start, {
            loop: true,
            persistent: true,
          });
        break;

      case "motor_stop":
        console.log("motor_stop received");
        if (backgroundProcess) {
          backgroundProcess.kill("SIGTERM");
          backgroundProcess = null;
        }
        playSound(sounds.stop);
        stopAlertLoop();
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
          playSound(sounds.move);
          lastMoveTime = now;
        }
        break;
      }

      // New event: sugar level alert
      case "sugar_alert": {
        const { level } = data || {};
        console.log(`Sugar level alert: ${level}`);

        if (level > 175) {
          startAlertLoop(level);
        } else {
          stopAlertLoop();
        }
        break;
      }
    }

    const endTime = performance.now();
    console.log(
      `Event "${eventName}" handled in ${(endTime - startTime).toFixed(2)} ms`
    );
  } catch (err) {
    console.error("Error handling message:", err.message);
  }
});

ws.on("error", (err) => console.error("WebSocket error:", err.message));
ws.on("close", () => console.log("Disconnected from Soketi"));

process.on("SIGINT", () => {
  if (backgroundProcess) backgroundProcess.kill("SIGTERM");
  stopAlertLoop();
  ws.close();
  process.exit();
});
