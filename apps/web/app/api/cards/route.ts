
import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../../lib/api';

async function forward(
  request: NextRequest,
  method: 'GET' | 'POST',
) {
  if (
    method !== 'GET' &&
    request.headers.get('origin') !== request.nextUrl.origin
  ) {
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

  const upstream = await fetch(`${API_URL}/cards`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(method === 'POST'
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    ...(method === 'POST'
      ? { body: await request.text() }
      : {}),
    cache: 'no-store',
  });

  const result = await upstream.json();

  return NextResponse.json(result, {
    status: upstream.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export const GET = (request: NextRequest) =>
  forward(request, 'GET');

export const POST = (request: NextRequest) =>
  forward(request, 'POST');
