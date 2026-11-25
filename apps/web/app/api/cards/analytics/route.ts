import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '../../../../lib/api';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('nfc_session')?.value;

  if (!token) {
    return NextResponse.json(
      { message: 'Please log in' },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${API_URL}/cards/analytics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const result = await upstream.json();

  return NextResponse.json(result, {
    status: upstream.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}
