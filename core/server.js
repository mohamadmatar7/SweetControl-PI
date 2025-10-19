import module from "module";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, writeFileSync, readFileSync } from "fs";
import express from "express";
import cors from "cors";
import Pusher from "pusher";
import { getAllObjects } from "./db.js";

// Path setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");
module.Module._initPaths();

// Detect motor LED module
let ledPath = path.join(__dirname, "containers/motor/ledControl.js");
if (!existsSync(ledPath)) {
  ledPath = path.join(__dirname, "../containers/motor/ledControl.js");
}
const { setDirection } = await import(`file://${ledPath}`);

const app = express();
app.use(cors());
app.use(express.json());

// Pusher (Soketi)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "myapp",
  key: process.env.PUSHER_KEY || "mykey",
  secret: process.env.PUSHER_SECRET || "mysecret",
  host: process.env.PUSHER_HOST || "localhost",
  port: Number(process.env.PUSHER_PORT || 6001),
  useTLS: String(process.env.PUSHER_TLS || "false") === "true",
});

// Motor position + layout cache
let position = { x: 0, y: 0 };
let objectsInBox = [];

// Try to restore layout from file if it exists
const layoutFile = path.join(__dirname, "temp_layout.json");
if (existsSync(layoutFile)) {
  try {
    const saved = JSON.parse(readFileSync(layoutFile, "utf8"));
    if (Array.isArray(saved)) {
      objectsInBox = saved;
      console.log(`[layout] Restored ${saved.length} objects from temp_layout.json`);
    }
  } catch (err) {
    console.warn("Failed to load temp layout:", err.message);
  }
}

// Receive layout from frontend
app.post("/objects_layout", (req, res) => {
  const { objects } = req.body;
  if (!Array.isArray(objects)) {
    return res.status(400).json({ error: "Invalid layout" });
  }
  objectsInBox = objects;
  writeFileSync(layoutFile, JSON.stringify(objects, null, 2));
  console.log(`[layout] Received ${objects.length} objects from frontend`);
  res.json({ ok: true });
});

// Handle motor moves
app.post("/move", async (req, res) => {
  const { direction, x, y } = req.body;
  if (!direction) return res.status(400).json({ error: "No direction provided" });

  const step = 30;
  switch (direction) {
    case "up": position.y = Math.max(position.y - step, -120); break;
    case "down": position.y = Math.min(position.y + step, 120); break;
    case "left": position.x = Math.max(position.x - step, -120); break;
    case "right": position.x = Math.min(position.x + step, 120); break;
    case "reset": position = { x: 0, y: 0 }; break;

    case "grab": {
      if (objectsInBox.length === 0) {
        console.log("[grab] ⚠️ No layout data found, ignoring grab");
        await pusher.trigger("joystick", "grab", { name: "None", sugar_value: 0 });
        break;
      }

      let grabbed = null;
      for (const obj of objectsInBox) {
        const dx = Math.abs(obj.x - x);
        const dy = Math.abs(obj.y - y);
        if (dx < 40 && dy < 40) {
          grabbed = obj;
          break;
        }
      }

      if (grabbed) {
        console.log(`[grab] Grabbed ${grabbed.name} (sugar ${grabbed.sugar_value})`);
        await pusher.trigger("joystick", "grab", grabbed);
      } else {
        console.log("[grab] No object grabbed");
        await pusher.trigger("joystick", "grab", { name: "None", sugar_value: 0 });
      }
      break;
    }
  }

  try {
    setDirection(direction);
  } catch (err) {
    console.warn("LED control failed:", err.message);
  }

  try {
    await pusher.trigger("joystick", "move", { direction, ...position });
    res.json({ ok: true, direction, position });
  } catch (error) {
    console.error("Pusher trigger failed:", error.message);
    res.status(500).json({ error: "Pusher failed" });
  }
});

// Motor start / stop (for audio)
app.post("/motor_start", async (_, res) => {
  console.log("[motor_start] triggered");
  await pusher.trigger("joystick", "motor_start", {});
  res.json({ ok: true });
});

app.post("/motor_stop", async (_, res) => {
  console.log("[motor_stop] triggered");
  await pusher.trigger("joystick", "motor_stop", {});
  res.json({ ok: true });
});

// List objects
app.get("/objects", (_, res) => {
  try {
    const data = getAllObjects();
    res.json(data);
  } catch (err) {
    console.error("DB error:", err.message);
    res.status(500).json({ error: "DB error" });
  }
});


// ---------------------------
// 🔔 NEW: Sugar alert handling
// ---------------------------
let currentSugar = 120;

// Receive sugar alert level from frontend
app.post("/sugar_alert", async (req, res) => {
  const { level } = req.body;
  if (typeof level !== "number") {
    return res.status(400).json({ error: "Invalid sugar level" });
  }

  currentSugar = level;
  console.log(`[sugar] Updated level: ${currentSugar}`);
  res.json({ ok: true });
});

// Emit sugar alert event every second
setInterval(async () => {
  try {
    await pusher.trigger("joystick", "sugar_alert", { level: currentSugar });
  } catch (err) {
    console.warn("Failed to emit sugar_alert:", err.message);
  }
}, 1000);
// ---------------------------


app.listen(4000, () => {
  console.log("✅ Core API running on port 4000");
});
