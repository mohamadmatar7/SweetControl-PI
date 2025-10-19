'use client';

import { useState, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hand } from 'lucide-react';

export default function JoystickPage() {
  const [direction, setDirection] = useState('stop');
  const [position, setPosition] = useState({ x: 0, y: 0 }); // current motor position
  const intervalRef = useRef(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const host =
      typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)
        ? window.location.hostname
        : process.env.NEXT_PUBLIC_SOKETI_HOST || 'localhost';
    const port = Number(process.env.NEXT_PUBLIC_SOKETI_PORT || 6001);
    const useTLS = String(process.env.NEXT_PUBLIC_SOKETI_TLS || 'false') === 'true';

    const pusher = new Pusher(key, {
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: useTLS,
      enabledTransports: useTLS ? ['wss'] : ['ws'],
      disableStats: true,
    });

    const channel = pusher.subscribe('joystick');
    channel.bind('move', (data) => {
      setDirection(data.direction);
      if (data.x !== undefined && data.y !== undefined) {
        setPosition({ x: data.x, y: data.y });
      }
    });

    return () => {
      pusher.unsubscribe('joystick');
      pusher.disconnect();
    };
  }, []);

  const sendCommand = async (cmd) => {
    try {
      if (cmd === 'grab') {
        await fetch('/api/grab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position }),
        });
      } else {
        await fetch('/api/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ direction: cmd }),
        });
      }
    } catch (err) {
      console.error('Could not reach backend:', err);
    }
  };

  const startHolding = (cmd) => {
    sendCommand(cmd);
    intervalRef.current = setInterval(() => sendCommand(cmd), 250);
  };

  const stopHolding = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
      <h1 className="text-3xl font-bold mb-8">Claw Machine Joystick</h1>

      <div className="grid grid-cols-3 gap-4 select-none">
        <div></div>
        <button
          onMouseDown={() => startHolding('up')}
          onMouseUp={stopHolding}
          onTouchStart={() => startHolding('up')}
          onTouchEnd={stopHolding}
          className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-4 px-6 rounded-full shadow-lg active:scale-95 transition"
        >
          <ArrowUp size={32} />
        </button>
        <div></div>

        <button
          onMouseDown={() => startHolding('left')}
          onMouseUp={stopHolding}
          onTouchStart={() => startHolding('left')}
          onTouchEnd={stopHolding}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-full shadow-lg active:scale-95 transition"
        >
          <ArrowLeft size={32} />
        </button>

        <button
          onMouseDown={() => sendCommand('grab')}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-6 px-8 rounded-full shadow-lg active:scale-95 transition"
        >
          <Hand size={32} />
        </button>

        <button
          onMouseDown={() => startHolding('right')}
          onMouseUp={stopHolding}
          onTouchStart={() => startHolding('right')}
          onTouchEnd={stopHolding}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-full shadow-lg active:scale-95 transition"
        >
          <ArrowRight size={32} />
        </button>

        <div></div>
        <button
          onMouseDown={() => startHolding('down')}
          onMouseUp={stopHolding}
          onTouchStart={() => startHolding('down')}
          onTouchEnd={stopHolding}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-full shadow-lg active:scale-95 transition"
        >
          <ArrowDown size={32} />
        </button>
        <div></div>
      </div>

      <div className="mt-6 text-lg font-semibold">
        Direction: {direction} | X: {position.x} Y: {position.y}
      </div>
    </div>
  );
}
