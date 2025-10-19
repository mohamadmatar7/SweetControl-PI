"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import React from "react";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function GraphicPage() {
  const data = {
    labels: Array.from({ length: 12 }, (_, i) => i + 1),
    datasets: [
      {
        label: "Suikerspiegel",
        data: [120, 122, 125, 127, 130, 145, 175, 178, 179, 180, 176, 173],
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.3)",
        fill: false,
        tension: 0.3,
        pointBackgroundColor: "white",
        pointBorderColor: "yellow",
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 30, max: 300, grid: { color: "#eee" } },
      x: { grid: { color: "#eee" } },
    },
    plugins: { legend: { display: false } },
  };

  const lastValue = data.datasets[0].data.at(-1);
  const buttons = [-100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-100 to-gray-50">
      {/* 👁️ Top section — two “eyes” */}
      <div className="flex justify-center items-center mt-10 gap-8">
        {/* Left eye */}
        <div className="relative w-40 h-40 rounded-full bg-gradient-to-b from-white to-gray-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3),0_4px_10px_rgba(0,0,0,0.2)] flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-b from-blue-400 to-blue-800 flex items-center justify-center shadow-inner">
            <div className="w-6 h-6 rounded-full bg-black shadow-md" />
          </div>
          <div className="absolute top-4 left-4 w-5 h-5 bg-white rounded-full opacity-80 blur-[1px]" />
        </div>

        {/* Right eye */}
        <div className="relative w-40 h-40 rounded-full bg-gradient-to-b from-white to-gray-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3),0_4px_10px_rgba(0,0,0,0.2)] flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-b from-blue-400 to-blue-800 flex items-center justify-center shadow-inner">
            <div className="w-6 h-6 rounded-full bg-black shadow-md" />
          </div>
          <div className="absolute top-4 left-4 w-5 h-5 bg-white rounded-full opacity-80 blur-[1px]" />
        </div>
      </div>

      {/* 🧠 Dashboard label */}
      <h1 className="text-3xl font-bold text-gray-700 text-center mt-8 mb-6 tracking-tight">
        Suikerspiegel Dashboard
      </h1>

      {/* 📊 Bottom chart section */}
      <div className="flex flex-col items-center px-4">
        <div className="bg-white shadow-md rounded-2xl p-4 w-full max-w-md">
          <div className="h-64">
            <Line data={data} options={options} />
          </div>
          <p className="text-center mt-3 text-gray-700">
            Laatste waarde: <span className="font-bold">{lastValue}</span>
          </p>
        </div>

        {/* Buttons row */}
        <div className="flex flex-wrap justify-center gap-2 mt-6 mb-10">
          {buttons.map((val) => (
            <button
              key={val}
              className={`px-3 py-2 rounded-md font-semibold text-white ${
                val < 0
                  ? "bg-red-500 hover:bg-red-600"
                  : val === 0
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
