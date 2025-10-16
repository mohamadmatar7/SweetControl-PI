import module from "module";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import express from "express";
import cors from "cors";
import Pusher from "pusher";

// Resolve local node_modules paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
module.Module._initPaths();

// Detect motor controller file (inside or outside Docker)
let ledPath = path.join(__dirname, "containers/motor/ledControl.js");
if (!existsSync(ledPath)) {
  ledPath = path.join(__dirname, "../containers/motor/ledControl.js");
}
const { setDirection } = await import(`file://${ledPath}`);

// ⚙️ Express setup
const app = express();
app.use(cors());
app.use(express.json());

// 📡 Pusher (Soketi) configuration
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "myapp",
  key: process.env.PUSHER_KEY || "mykey",
  secret: process.env.PUSHER_SECRET || "mysecret",
  host: process.env.PUSHER_HOST || "localhost",
  port: Number(process.env.PUSHER_PORT || 6001),
  useTLS: String(process.env.PUSHER_TLS || "false") === "true",
  scheme: String(process.env.PUSHER_TLS || "false") === "true" ? "https" : "http",
});

// Motor movement state
let position = { x: 0, y: 0 };

// Root test
app.get("/", (req, res) => res.send("✅ Core API running"));

// 🎮 Move command endpoint
app.post("/move", async (req, res) => {
  const { direction } = req.body;
  if (!direction) return res.status(400).json({ error: "No direction provided" });

  const step = 30;
  switch (direction) {
    case "up":
      position.y = Math.max(position.y - step, -120);
      break;
    case "down":
      position.y = Math.min(position.y + step, 120);
      break;
    case "left":
      position.x = Math.max(position.x - step, -120);
      break;
    case "right":
      position.x = Math.min(position.x + step, 120);
      break;
    case "reset":
      position = { x: 0, y: 0 };
      break;
  }

  try {
    setDirection(direction);
  } catch (err) {
    console.warn("⚠️ LED control failed:", err.message);
  }

  try {
    await pusher.trigger("joystick", "move", { direction, ...position });
    console.log(`📡 [move] Sent → ${direction}`, position);
    res.json({ ok: true, direction, position });
  } catch (error) {
    console.error("❌ Pusher trigger failed:", error.message);
    res.status(500).json({ error: "Pusher failed" });
  }
});

// Motor start (plays background sound)
app.post("/motor_start", async (req, res) => {
  console.log("🎧 Motor page opened");
  try {
    await pusher.trigger("joystick", "motor_start", {});
    console.log("📡 [motor_start] sent");
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Failed to trigger motor_start:", err.message);
    res.status(500).json({ error: "pusher failed" });
  }
});

//  Motor stop (stops background sound)
app.post("/motor_stop", async (req, res) => {
  console.log("🛑 Motor page closed");
  try {
    await pusher.trigger("joystick", "motor_stop", {});
    console.log("📡 [motor_stop] sent");
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Failed to trigger motor_stop:", err.message);
    res.status(500).json({ error: "pusher failed" });
  }
});


// Start server

app.listen(4000, () => {
  console.log("🚀 Core API running on port 4000");
  console.log("🔗 Connected to Soketi:", `${pusher.config.host}:${pusher.config.port}`);
});
