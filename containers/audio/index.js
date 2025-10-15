import Pusher from "pusher-js";
import { spawn } from "child_process";
import path from "path";

// 📡 Connect to Pusher
const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

if (!key || !cluster) {
  console.error("❌ Missing Pusher configuration");
  process.exit(1);
}

const pusher = new Pusher(key, { cluster });
const channel = pusher.subscribe("joystick");

console.log("🎧 Audio service connected to Pusher...");

// Paths for sound effects
const basePath = "./sounds";
const sounds = {
  start: `${basePath}/background.mp3`,
  move: `${basePath}/move.mp3`,
  stop: `${basePath}/stop.mp3`,
};

// Track background music process
let backgroundProcess = null;

// 🧩 Helper: play sound via ffplay using PulseAudio
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

  ff.on("error", (err) => console.error("🔇 ffplay failed:", err.message));
  ff.on("exit", (code) => {
    if (code !== 0 && !persistent) console.error("🔇 ffplay exited with code:", code);
  });

  return ff;
}

// 🔔 Events from Pusher
channel.bind("motor_start", () => {
  console.log("🎵 Starting background music...");

  // Prevent multiple background tracks
  if (backgroundProcess) {
    console.log("🎶 Background already playing.");
    return;
  }

  backgroundProcess = playSound(sounds.start, { loop: true, persistent: true });
});

channel.bind("move", (data) => {
  console.log(`🎚️ Move sound triggered: ${data.direction}`);
  playSound(sounds.move);
});

channel.bind("motor_stop", () => {
  console.log("🛑 Stopping background music...");
  if (backgroundProcess) {
    backgroundProcess.kill("SIGTERM");
    backgroundProcess = null;
  }
  playSound(sounds.stop);
});

// Optionally, clean up on exit
process.on("SIGINT", () => {
  if (backgroundProcess) backgroundProcess.kill("SIGTERM");
  process.exit();
});
