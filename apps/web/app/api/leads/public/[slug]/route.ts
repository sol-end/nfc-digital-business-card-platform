import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../../../../lib/api';

type Context = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: NextRequest, context: Context) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: 'Invalid request origin' },
      { status: 403 },
    );
  }

  const { slug } = await context.params;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json(
      { message: 'Invalid card URL' },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Invalid JSON' },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(
      `${API_URL}/leads/public/${encodeURIComponent(slug)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    );

    const result = await upstream.json();

    return NextResponse.json(result, {
      status: upstream.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { message: 'Lead service is unavailable' },
      { status: 502 },
    );
  }
}
