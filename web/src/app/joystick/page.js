'use client';

import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export default function JoystickPage() {
  const [direction, setDirection] = useState('stop');

  useEffect(() => {
    // Read from env (Next.js exposes NEXT_PUBLIC_* to browser)
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.error('? Missing Pusher env vars');
      return;
    }

    // Connect to Pusher
    const pusher = new Pusher(key, { cluster });
    const channel = pusher.subscribe('joystick');

    channel.bind('move', (data) => {
      console.log('?? Movement received:', data);
      setDirection(data.direction);
    });

    return () => {
      pusher.unsubscribe('joystick');
      pusher.disconnect();
    };
  }, []);

  // Send command to backend
  const sendCommand = async (cmd) => {
    try {
      await fetch('/api/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: cmd }),
      });
    } catch (err) {
      console.error('?? Could not reach backend:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
      <h1 className="text-3xl font-bold mb-8">Claw Machine Joystick</h1>

      <div className="grid grid-cols-3 gap-4">
        <div></div>
        <button
          onMouseDown={() => sendCommand('up')}
          className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 px-6 rounded-full shadow-lg"
        >
          <ArrowUp size={32} />
        </button>
        <div></div>

        <button
          onMouseDown={() => sendCommand('left')}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-full shadow-lg"
        >
          <ArrowLeft size={32} />
        </button>

        <div className="flex items-center justify-center">
          <span className="font-semibold text-xl">{direction}</span>
        </div>

        <button
          onMouseDown={() => sendCommand('right')}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-full shadow-lg"
        >
          <ArrowRight size={32} />
        </button>

        <div></div>
        <button
          onMouseDown={() => sendCommand('down')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-full shadow-lg"
        >
          <ArrowDown size={32} />
        </button>
        <div></div>
      </div>
    </div>
  );
}
