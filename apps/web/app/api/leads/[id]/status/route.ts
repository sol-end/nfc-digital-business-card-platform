import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../../../../lib/api';

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: 'Invalid request origin' },
      { status: 403 },
    );
  }

  const token = request.cookies.get('nfc_session')?.value;

  if (!token) {
    return NextResponse.json(
      { message: 'Please log in' },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json(
      { message: 'Invalid lead ID' },
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
    const upstream = await fetch(`${API_URL}/leads/${id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

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
