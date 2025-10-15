import { NextResponse } from "next/server";

const CORE_URL = "http://sweet-core:4000"; // internal Docker network URL

export async function POST(req) {
  try {
    const body = await req.json();
    const { direction, action } = body;

    // 🎬 Handle motor start / stop events
    if (action === "motor_start" || action === "motor_stop") {
      const endpoint = action === "motor_start" ? "motor_start" : "motor_stop";

      const res = await fetch(`${CORE_URL}/${endpoint}`, { method: "POST" });
      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = { ok: true }; // fallback if no JSON
      }

      return NextResponse.json(data);
    }

    // 🕹️ Handle movement commands
    if (!direction) {
      return NextResponse.json({ error: "Direction missing" }, { status: 400 });
    }

    const res = await fetch(`${CORE_URL}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("⚠️ Core returned non-JSON:", text);
      return NextResponse.json({ error: "Invalid Core response" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("❌ Move API failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
