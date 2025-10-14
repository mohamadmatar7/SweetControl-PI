import express from "express";
import cors from "cors";
import Pusher from "pusher";
import { setDirection } from "./containers/motor/ledControl.js";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Simulated motor (claw) position
let position = { x: 0, y: 0 };

app.get("/", (req, res) => {
  res.send("✅ Core API running");
});

app.post("/move", async (req, res) => {
  const { direction } = req.body;
  if (!direction) return res.status(400).json({ error: "No direction provided" });

  const step = 30; // pixels per move

  // Update simulated position
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

  // 🔹 Control physical LEDs
  try {
    setDirection(direction);
  } catch (err) {
    console.warn("⚠️ LED control failed:", err.message);
  }

  // 🔹 Send move event to Pusher
  try {
    await pusher.trigger("joystick", "move", {
      direction,
      x: position.x,
      y: position.y,
    });

    console.log(`📡 Sent via Pusher → ${direction}`, position);
    res.json({ ok: true, direction, position });
  } catch (error) {
    console.error("❌ Pusher trigger failed:", error);
    res.status(500).json({ error: "Pusher failed" });
  }
});

app.listen(4000, () => {
  console.log("🚀 Core API running on port 4000");
});
