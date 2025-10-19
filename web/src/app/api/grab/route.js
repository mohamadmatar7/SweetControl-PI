import { NextResponse } from 'next/server';

const CORE_URL = 'http://sweet-core:4000';

export async function POST(req) {
  try {
    const body = await req.json();
    const { position } = body;

    if (!position) {
      return NextResponse.json({ error: 'Missing position' }, { status: 400 });
    }

    // Send grab command with current motor coordinates
    const res = await fetch(`${CORE_URL}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction: 'grab', x: position.x, y: position.y }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Grab API failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
