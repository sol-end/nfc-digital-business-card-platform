import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../../lib/api';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: 'Invalid request origin' },
      { status: 403 },
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

  if (
    !body ||
    typeof body !== 'object' ||
    !('action' in body) ||
    !('email' in body) ||
    !('password' in body)
  ) {
    return NextResponse.json(
      { message: 'Invalid credentials' },
      { status: 400 },
    );
  }

  const data = body as Record<string, unknown>;

  if (
    !['login', 'register'].includes(String(data.action)) ||
    typeof data.email !== 'string' ||
    typeof data.password !== 'string'
  ) {
    return NextResponse.json(
      { message: 'Invalid request' },
      { status: 400 },
    );
  }

  const action = String(data.action);

  const upstream = await fetch(`${API_URL}/auth/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      action === 'register'
        ? {
            name: data.name,
            email: data.email,
            password: data.password,
          }
        : {
            email: data.email,
            password: data.password,
          },
    ),
    cache: 'no-store',
  });

  const result = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json(
      { message: result.message ?? 'Authentication failed' },
      { status: upstream.status },
    );
  }

  if (typeof result.accessToken !== 'string') {
    return NextResponse.json(
      { message: 'Authentication response invalid' },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set('nfc_session', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60,
  });

  return response;
}

export async function DELETE(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json(
      { message: 'Invalid request origin' },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('nfc_session');
  return response;
}
