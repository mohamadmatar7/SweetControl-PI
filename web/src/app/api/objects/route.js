import { NextResponse } from 'next/server';

const CORE_URL = 'http://sweet-core:4000';

export async function GET() {
  try {
    const res = await fetch(`${CORE_URL}/objects`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Objects fetch failed:', err);
    return NextResponse.json({ error: 'Failed to fetch objects' }, { status: 500 });
  }
}
