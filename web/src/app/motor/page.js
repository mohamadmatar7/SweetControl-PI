'use client';

import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import { motion } from 'framer-motion';

export default function MotorSimulator() {
  const [direction, setDirection] = useState('center');
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Function to move the motor visually
  const moveMotor = (dir) => {
    setPosition((prev) => {
      let { x, y } = prev;
      const step = 30; // pixels per move

      if (dir === 'up') y -= step;
      if (dir === 'down') y += step;
      if (dir === 'left') x -= step;
      if (dir === 'right') x += step;

      // Limit movement within 120px box
      x = Math.max(-120, Math.min(120, x));
      y = Math.max(-120, Math.min(120, y));

      return { x, y };
    });
  };

  // Connect to Pusher
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.error('⚠️ Missing Pusher env vars');
      return;
    }

    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe('joystick');

    channel.bind('move', (data) => {
      console.log('🎯 Move event received:', data.direction);
      setDirection(data.direction);
      moveMotor(data.direction);
    });

    return () => {
      pusher.unsubscribe('joystick');
      pusher.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Motor Visualization</h1>
      <p className="mb-4 text-lg">
        Last Direction: <b>{direction}</b>
      </p>

      <div className="relative w-[300px] h-[300px] bg-gray-200 rounded-xl border-4 border-gray-400 flex items-center justify-center overflow-hidden">
        <motion.div
          className="w-12 h-12 bg-blue-500 rounded-full shadow-lg"
          animate={{ x: position.x, y: position.y }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>

      <p className="mt-6 text-sm text-gray-500">
        A simulation. The blue circle shows the motor’s position in real time.
      </p>
    </div>
  );
}
