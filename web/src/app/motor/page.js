'use client';

import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import { motion } from 'framer-motion';

export default function MotorSimulator() {
  const [direction, setDirection] = useState('center');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [grabEffect, setGrabEffect] = useState(false);
  const [shake, setShake] = useState(false);

  // Handle motor movement
  const moveMotor = (dir) => {
    setPosition((prev) => {
      let { x, y } = prev;
      const step = 30;
      if (dir === 'up') y -= step;
      if (dir === 'down') y += step;
      if (dir === 'left') x -= step;
      if (dir === 'right') x += step;

      // Keep within boundaries
      x = Math.max(-120, Math.min(120, x));
      y = Math.max(-120, Math.min(120, y));

      return { x, y };
    });
  };

  useEffect(() => {
    let coreUrl = process.env.NEXT_PUBLIC_CORE_URL || "http://sweet-core:4000";

    if (typeof window !== "undefined") {
      const isDocker =
        window.location.hostname === "sweet-web" ||
        window.location.hostname === "localhost";

      if (!isDocker) {
        const host = window.location.hostname;
        coreUrl = `http://${host}:4000`;
      }
    }

    console.log("Using Core URL →", coreUrl);

    // Notify server that motor visualization started
    fetch(`${coreUrl}/motor_start`, { method: "POST" })
      .then(() => console.log("motor_start sent"))
      .catch((err) => console.error("motor_start failed:", err.message));

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const host =
      typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname)
        ? window.location.hostname
        : (process.env.NEXT_PUBLIC_SOKETI_HOST || "localhost");
    const port = Number(process.env.NEXT_PUBLIC_SOKETI_PORT || 6001);
    const useTLS = String(process.env.NEXT_PUBLIC_SOKETI_TLS || "false") === "true";

    const pusher = new Pusher(key, {
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: useTLS,
      enabledTransports: useTLS ? ["wss"] : ["ws"],
      disableStats: true,
    });

    const channel = pusher.subscribe("joystick");
    channel.bind("move", (data) => {
      console.log("Move event received:", data.direction);
      setDirection(data.direction);

      if (data.direction === "grab") {
        // Apply grab visual effect
        setGrabEffect(true);
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setTimeout(() => setGrabEffect(false), 2000);
      } else {
        moveMotor(data.direction);
      }
    });

    // Send motor_stop on unload
    const stopMotor = () => {
      console.log("Sending motor_stop before unload...");
      navigator.sendBeacon(`${coreUrl}/motor_stop`);
    };

    window.addEventListener("beforeunload", stopMotor);

    return () => {
      stopMotor();
      window.removeEventListener("beforeunload", stopMotor);
      pusher.unsubscribe("joystick");
      pusher.disconnect();
    };
  }, []);

  // UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Motor Visualization</h1>
      <p className="mb-4 text-lg">
        Last Direction: <b>{direction}</b>
      </p>

      <div className="relative w-[300px] h-[300px] bg-gray-200 rounded-xl border-4 border-gray-400 flex items-center justify-center overflow-hidden">
        <motion.div
          className="w-12 h-12 rounded-full shadow-lg"
          animate={{
            x: position.x,
            y: position.y,
            scale: grabEffect ? 1.5 : 1,
            backgroundColor: grabEffect ? "#9333ea" : "#3b82f6",
            rotate: shake ? [0, -10, 10, -10, 0] : 0,
          }}
          transition={{
            duration: grabEffect ? 0.3 : 0.05,
            ease: "easeOut",
          }}
        />
      </div>

      <p className="mt-6 text-sm text-gray-500">
        The blue circle shows the motor’s position in real time.
      </p>
    </div>
  );
}
