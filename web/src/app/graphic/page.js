"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import Pusher from "pusher-js";
import { motion, useAnimation } from "framer-motion";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

export default function GraphicPage() {
  const [dataPoints, setDataPoints] = useState([120]);
  const [eyeOffset, setEyeOffset] = useState(0);
  const [eyeScale, setEyeScale] = useState(1);
  const [eyeColor, setEyeColor] = useState("from-blue-400 to-blue-800");
  const [lastGrab, setLastGrab] = useState(null);
  const [bgColor, setBgColor] = useState("from-green-100 to-green-50");
  const [isAlert, setIsAlert] = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [pulse, setPulse] = useState(false);
  const shakeControls = useAnimation();

  // Helper to send requests to the core container
  const sendToCore = async (endpoint, body = null) => {
    try {
      const coreHost =
        typeof window !== "undefined" &&
        window.location.hostname !== "sweet-web"
          ? process.env.NEXT_PUBLIC_CORE_URL || "http://192.168.0.7:4000"
          : "http://sweet-core:4000";

      await fetch(`${coreHost}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      console.warn(`[core] ${endpoint} failed:`, err.message);
    }
  };

  // Start audio on load
  useEffect(() => {
    sendToCore("motor_start");
  }, []);

  // Setup Pusher real-time updates
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const host = process.env.NEXT_PUBLIC_SOKETI_HOST || "localhost";
    const port = Number(process.env.NEXT_PUBLIC_SOKETI_PORT || 6001);
    const pusher = new Pusher(key, {
      wsHost: host,
      wsPort: port,
      forceTLS: false,
      enabledTransports: ["ws"],
      disableStats: true,
    });

    const channel = pusher.subscribe("joystick");

    // Listen for grab events
    channel.bind("grab", async (data) => {
      if (!data || data.name === "None" || data.sugar_value === 0) {
        console.log("Empty grab ignored");
        return;
      }

      setLastGrab(data.name);

      setDataPoints((prev) => {
        const prevValue = prev.at(-1);
        const newLevel = Math.min(prevValue + data.sugar_value, 300);
        sendToCore("sugar_alert", { level: newLevel });
        return [...prev.slice(-11), newLevel];
      });

      const sugar = data.sugar_value;
      const capped = Math.min(sugar, 100);
      const fatigue = Math.min(capped / 100, 1);

      setEyeOffset(fatigue * 25);
      setEyeScale(1 - fatigue * 0.2);
      setEyeColor(
        fatigue < 0.3
          ? "from-blue-400 to-blue-800"
          : fatigue < 0.6
          ? "from-yellow-400 to-orange-600"
          : "from-red-500 to-red-800"
      );

      if (capped < 15) setBgColor("from-green-100 via-green-200 to-green-50");
      else if (capped < 25)
        setBgColor("from-lime-100 via-yellow-100 to-yellow-50");
      else if (capped < 40)
        setBgColor("from-yellow-100 via-orange-100 to-orange-50");
      else setBgColor("from-red-200 via-pink-200 to-pink-100");
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  // Stop sound and broadcast refresh when closing page
  useEffect(() => {
    const handleUnload = async () => {
      console.log("[unload] Stopping sound and notifying others");
      await sendToCore("motor_stop");
      await sendToCore("sugar_alert", { level: 120 });
      await sendToCore("broadcast_refresh");
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Listen for refresh_all broadcast (sync all clients)
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const host = process.env.NEXT_PUBLIC_SOKETI_HOST || "localhost";
    const port = Number(process.env.NEXT_PUBLIC_SOKETI_PORT || 6001);
    const pusher = new Pusher(key, {
      wsHost: host,
      wsPort: port,
      forceTLS: false,
      enabledTransports: ["ws"],
      disableStats: true,
    });
    const system = pusher.subscribe("system");

    system.bind("refresh_all", () => {
      console.log("[system] Refresh triggered");
      window.location.reload();
    });

    return () => {
      system.unbind_all();
      system.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  // Detect alert state
  useEffect(() => {
    const last = dataPoints.at(-1);
    setIsAlert(last > 175);
  }, [dataPoints]);

  // Red flashing overlay when alert active
  useEffect(() => {
    let interval;
    if (isAlert) {
      interval = setInterval(() => {
        setFlashOpacity(0.3);
        setTimeout(() => setFlashOpacity(0), 500);
      }, 1200);
    } else setFlashOpacity(0);
    return () => clearInterval(interval);
  }, [isAlert]);

  // Screen shake effect when alert active
  useEffect(() => {
    let active = true;

    if (isAlert) {
      document.body.style.overflowX = "hidden";
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowX = "";
      document.body.style.overflowY = "";
    }

    async function shakeLoop() {
      while (active && isAlert) {
        await shakeControls.start({
          x: [0, -4, 4, -4, 4, 0],
          rotate: [0, -1, 1, -1, 1, 0],
          transition: { duration: 0.45, ease: "easeInOut" },
        });
      }
    }

    if (isAlert) shakeLoop();
    else shakeControls.start({ x: 0, rotate: 0 });

    return () => {
      active = false;
      document.body.style.overflowX = "";
      document.body.style.overflowY = "";
    };
  }, [isAlert]);

  // Chart pulsing
  useEffect(() => {
    if (isAlert) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 400);
      return () => clearTimeout(t);
    }
  }, [dataPoints]);

  const lastValue = dataPoints.at(-1);

  // Chart setup
  const chartData = {
    labels: Array.from({ length: dataPoints.length }, (_, i) => i + 1),
    datasets: [
      {
        label: "Suikerwaarde",
        data: dataPoints,
        borderColor: isAlert ? "#ef4444" : "#6366f1",
        backgroundColor: isAlert
          ? "rgba(239,68,68,0.25)"
          : "rgba(99,102,241,0.25)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  return (
    <motion.div
      animate={shakeControls}
      className={`relative min-h-screen flex flex-col items-center justify-start bg-gradient-to-b ${bgColor} overflow-hidden`}
    >
      {/* Flash overlay */}
      <motion.div
        animate={{ opacity: flashOpacity }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-red-500 pointer-events-none z-0"
      />

      {/* Eyes */}
      <div className="flex justify-center items-center mt-6 gap-8 z-10">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="relative w-40 h-40 rounded-full bg-gradient-to-b from-white to-gray-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3),0_4px_10px_rgba(0,0,0,0.2)] flex items-center justify-center"
            animate={{
              scale: eyeScale,
              rotate: i === 0 ? -eyeOffset / 10 : eyeOffset / 10,
            }}
            transition={{ type: "spring", stiffness: 60, damping: 12 }}
          >
            <motion.div
              animate={{
                y: eyeOffset,
                filter:
                  lastValue > 175
                    ? "blur(4px) brightness(0.8)"
                    : "blur(0px) brightness(1)",
              }}
              transition={{ type: "spring", stiffness: 60, damping: 10 }}
              className={`w-18 h-18 rounded-full bg-gradient-to-b ${eyeColor} flex items-center justify-center shadow-inner`}
            >
              <motion.div
                animate={{ scale: 1 - eyeOffset / 50 }}
                transition={{ duration: 0.3 }}
                className="w-6 h-6 rounded-full bg-black shadow-md"
              />
            </motion.div>
            <div className="absolute top-4 left-4 w-5 h-5 bg-white rounded-full opacity-80 blur-[1px]" />
          </motion.div>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-700 text-center mt-6 mb-1 z-10">
        Suikerspiegel Dashboard
      </h1>

      {/* Show last grabbed snack */}
      {lastGrab && (
        <p className="text-center text-gray-600 mb-4 z-10">
          Laatste snack: <b className="text-pink-700">{lastGrab}</b>
        </p>
      )}


      {/* Chart */}
      <motion.div
        animate={pulse ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`bg-white shadow-lg rounded-2xl p-5 w-full max-w-md border ${
          isAlert ? "border-red-300" : "border-gray-200"
        } z-10 mt-6`}
      >
        <div className="h-60">
          <Line data={chartData} options={options} />
        </div>
        <p className="text-center mt-3 text-gray-700 text-lg">
          Laatste waarde:{" "}
          <span
            className={`font-bold ${
              isAlert ? "text-red-600" : "text-pink-700"
            }`}
          >
            {lastValue}
          </span>
        </p>
      </motion.div>

      <p className="mt-5 text-center text-sm text-gray-500 mb-4 z-10">
        When sugar exceeds 175, the system shakes and enters alert mode
      </p>
    </motion.div>
  );
}
