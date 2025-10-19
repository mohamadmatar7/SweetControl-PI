"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans text-gray-800">
      {/* Soft gradient animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 via-pink-100 to-blue-200 animate-gradient-slow blur-3xl opacity-40"></div>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center text-center p-8 sm:p-12">
        {/* Title */}
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 text-indigo-700 tracking-tight">
          Sweet Control Dashboard
        </h1>

        {/* Subtitle / short intro */}
        <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mb-10 leading-relaxed">
          A real-time system that monitors sugar levels and interacts with 
          hardware components, lights, and sound — all working together 
          to visualize your sweet world.
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 mb-14">
          <Link
            href="/joystick"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full shadow-md transition text-lg font-medium"
          >
            Joystick Control
          </Link>
          <Link
            href="/motor"
            className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full shadow-md transition text-lg font-medium"
          >
            Motor Visualization
          </Link>
          <Link
            href="/graphic"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full shadow-md transition text-lg font-medium"
          >
            Sugar Graph
          </Link>
        </div>

        {/* Project Summary */}
        <section className="max-w-3xl bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-lg border border-white/40">
          <h2 className="text-2xl font-semibold text-indigo-800 mb-3">
            About the System
          </h2>
          <p className="text-gray-700 leading-relaxed">
            The project uses several containers working together:
            <br />
            <b>Core</b> receives data from the joystick and the database,  
            <b> Web</b> shows live visual feedback,  
            <b> Audio</b> plays alert sounds,  
            and <b> Motor</b> simulates the LED movements.  
            <br />
            All parts communicate in real time through <b>Soketi</b>.
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-sm text-gray-500">
          © {new Date().getFullYear()} Sweet Control Project.
        </footer>
      </main>

      {/* Background animation keyframes */}
      <style jsx>{`
        @keyframes gradient-slow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-slow {
          background-size: 200% 200%;
          animation: gradient-slow 12s ease infinite;
        }
      `}</style>
    </div>
  );
}
