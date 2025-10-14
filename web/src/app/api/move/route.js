import { NextResponse } from "next/server";

// ? Base Core URL (no `/move` here)
const CORE_URL = "http://sweet-core:4000";

export async function POST(req) {
  try {
    const { direction } = await req.json();

    if (!direction) {
      return NextResponse.json({ error: "Direction missing" }, { status: 400 });
    }

    // ? Send to Core
    const res = await fetch(`${CORE_URL}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });

    // ? Safely parse response
    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error("?? Core returned non-JSON:", text);
      return NextResponse.json({ error: "Invalid Core response" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("? Move API failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
