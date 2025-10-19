import { NextResponse } from 'next/server';

const CORE_URL = 'http://sweet-core:4000';

export async function POST(req) {
  try {
    const body = await req.json();
    const res = await fetch(`${CORE_URL}/objects_layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Layout update failed:', err);
    return NextResponse.json({ error: 'Failed to update layout' }, { status: 500 });
  }
}
