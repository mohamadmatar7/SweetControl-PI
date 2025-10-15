import module from "module";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import express from "express";
import cors from "cors";
import Pusher from "pusher";

// ------------------------------------------------------------------
// 🧩 Allow modules in /core/node_modules to be resolved everywhere
// ------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
module.Module._initPaths();

// ------------------------------------------------------------------
// 🧩 Auto-detect motor controller
// ------------------------------------------------------------------
let ledPath = path.join(__dirname, "containers/motor/ledControl.js"); // Docker path
if (!existsSync(ledPath)) {
  ledPath = path.join(__dirname, "../containers/motor/ledControl.js"); // Host path
}
const { setDirection } = await import(`file://${ledPath}`);

// ------------------------------------------------------------------
// ⚙️ Express setup
// ------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// 📡 Pusher setup
// ------------------------------------------------------------------
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// ------------------------------------------------------------------
// 🚗 Motor logic
// ------------------------------------------------------------------
let position = { x: 0, y: 0 };

app.get("/", (req, res) => res.send("✅ Core API running"));

app.post("/move", async (req, res) => {
  const { direction } = req.body;
  if (!direction) return res.status(400).json({ error: "No direction provided" });

  const step = 30;
  switch (direction) {
    case "up": position.y = Math.max(position.y - step, -120); break;
    case "down": position.y = Math.min(position.y + step, 120); break;
    case "left": position.x = Math.max(position.x - step, -120); break;
    case "right": position.x = Math.min(position.x + step, 120); break;
    case "reset": position = { x: 0, y: 0 }; break;
  }

  try {
    setDirection(direction);
  } catch (err) {
    console.warn("⚠️ LED control failed:", err.message);
  }

  try {
    await pusher.trigger("joystick", "move", { direction, ...position });
    console.log(`📡 Sent via Pusher → ${direction}`, position);
    res.json({ ok: true, direction, position });
  } catch (error) {
    console.error("❌ Pusher trigger failed:", error);
    res.status(500).json({ error: "Pusher failed" });
  }
});

// ------------------------------------------------------------------
// 🎧 Motor page events
// ------------------------------------------------------------------
app.post("/motor_start", async (req, res) => {
  console.log("🎧 Motor page opened");

  try {
    await pusher.trigger("joystick", "motor_start", {});
    console.log("📡 Pusher → motor_start sent");
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Failed to trigger motor_start:", err);
    res.status(500).json({ error: "pusher failed" });
  }
});

app.post("/motor_stop", async (req, res) => {
  console.log("🛑 Motor page closed");

  try {
    await pusher.trigger("joystick", "motor_stop", {});
    console.log("📡 Pusher → motor_stop sent");
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Failed to trigger motor_stop:", err);
    res.status(500).json({ error: "pusher failed" });
  }
});

// ------------------------------------------------------------------
// 🚀 Start server
// ------------------------------------------------------------------
app.listen(4000, () => console.log("🚀 Core API running on port 4000"));
