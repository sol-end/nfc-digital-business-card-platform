
import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../../../lib/api';

type Context = {
  params: Promise<{ id: string }>;
};

async function forward(
  request: NextRequest,
  context: Context,
  method: 'PATCH' | 'DELETE',
) {
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

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json(
      { message: 'Invalid card ID' },
      { status: 400 },
    );
  }

  const upstream = await fetch(
    `${API_URL}/cards/${encodeURIComponent(id)}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === 'PATCH'
          ? { 'Content-Type': 'application/json' }
          : {}),
      },
      ...(method === 'PATCH'
        ? { body: await request.text() }
        : {}),
      cache: 'no-store',
    },
  );

  const result = await upstream.json();

  return NextResponse.json(result, {
    status: upstream.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export const PATCH = (
  request: NextRequest,
  context: Context,
) => forward(request, context, 'PATCH');

export const DELETE = (
  request: NextRequest,
  context: Context,
) => forward(request, context, 'DELETE');
