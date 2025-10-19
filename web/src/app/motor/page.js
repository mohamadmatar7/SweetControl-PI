'use client';

import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import { motion } from 'framer-motion';

export default function MotorSimulator() {
  const [direction, setDirection] = useState('center');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [grabEffect, setGrabEffect] = useState(false);
  const [shake, setShake] = useState(false);
  const [objects, setObjects] = useState([]);

  const BOX_SIZE = 320;
  const HALF = BOX_SIZE / 2;
  const MIN_DISTANCE = 70;

  // Generate evenly spaced object positions
  const generatePositions = (count) => {
    const placed = [];
    for (let i = 0; i < count; i++) {
      let pos;
      let tries = 0;
      do {
        pos = {
          x: Math.floor(Math.random() * 220 - 110),
          y: Math.floor(Math.random() * 220 - 110),
        };
        tries++;
      } while (
        placed.some((p) => Math.hypot(p.x - pos.x, p.y - pos.y) < MIN_DISTANCE) &&
        tries < 50
      );
      placed.push(pos);
    }
    return placed;
  };

  const moveMotor = (dir) => {
    setPosition((prev) => {
      let { x, y } = prev;
      const step = 30;
      if (dir === 'up') y -= step;
      if (dir === 'down') y += step;
      if (dir === 'left') x -= step;
      if (dir === 'right') x += step;
      x = Math.max(-120, Math.min(120, x));
      y = Math.max(-120, Math.min(120, y));
      return { x, y };
    });
  };

  useEffect(() => {
    async function initLayout() {
      try {
        const res = await fetch('/api/objects');
        const data = await res.json();
        const positions = generatePositions(data.length);
        const randomized = data.map((obj, i) => ({
          ...obj,
          ...positions[i],
          color: `hsl(${Math.random() * 360}, 70%, 75%)`,
        }));

        setObjects(randomized);
        await fetch('/api/objects_layout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ objects: randomized }),
        });
        console.log('✅ Sent object layout to Core');
      } catch (err) {
        console.error('❌ Failed to send layout:', err.message);
      }
    }

    initLayout();

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const host = process.env.NEXT_PUBLIC_SOKETI_HOST || 'localhost';
    const port = Number(process.env.NEXT_PUBLIC_SOKETI_PORT || 6001);

    const pusher = new Pusher(key, {
      wsHost: host,
      wsPort: port,
      forceTLS: false,
      enabledTransports: ['ws'],
      disableStats: true,
    });

    const channel = pusher.subscribe('joystick');

    channel.bind('move', (data) => {
      setDirection(data.direction);
      if (data.direction === 'grab') {
        setGrabEffect(true);
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setTimeout(() => setGrabEffect(false), 1200);
      } else {
        moveMotor(data.direction);
      }
    });

    channel.bind('grab', (data) => {
      console.log('Grab result:', data);
    });

    return () => {
      pusher.unsubscribe('joystick');
      pusher.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-blue-100 text-gray-800">
      <h1 className="text-4xl font-bold mb-4 tracking-tight text-indigo-700">
        Motor Visualization
      </h1>
      <p className="mb-6 text-lg text-gray-600">
        Last Direction: <b className="text-indigo-800">{direction}</b>
      </p>

      <div className="relative w-[320px] h-[320px] bg-white rounded-3xl border border-indigo-200 shadow-lg overflow-hidden">
        {objects.map((obj) => (
          <motion.div
            key={obj.id}
            className="absolute flex flex-col items-center justify-center rounded-full text-[13px] font-semibold shadow-md select-none"
            style={{
              width: 60,
              height: 60,
              left: HALF + obj.x - 30,
              top: HALF + obj.y - 30,
              backgroundColor: obj.color,
              color: '#1f2937',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
            animate={{ y: [0, -3, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 1.5,
            }}
          >
            <span className="text-center leading-tight">{obj.name}</span>
          </motion.div>
        ))}

        <motion.div
          className="absolute w-14 h-14 rounded-full shadow-lg border border-indigo-200"
          animate={{
            x: position.x,
            y: position.y,
            scale: grabEffect ? [1, 1.3, 1] : 1,
            backgroundColor: grabEffect ? '#9333ea' : '#3b82f6',
            rotate: shake ? [0, -10, 10, -10, 0] : 0,
          }}
          transition={{
            duration: grabEffect ? 0.3 : 0.05,
            ease: 'easeOut',
          }}
          style={{ left: HALF - 28, top: HALF - 28 }}
        />
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Each candy is softly animated and evenly spaced.
      </p>
    </div>
  );
}
