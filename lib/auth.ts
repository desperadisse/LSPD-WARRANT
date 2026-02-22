import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-me'
);

export async function signSession(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return await verifySession(token);
}

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  if (!token) return;

  // Refresh the session expiration
  const payload = await verifySession(token);
  if (!payload) return;

  const newToken = await signSession(payload);
  
  const res = NextResponse.next();
  res.cookies.set({
    name: 'session',
    value: newToken,
    httpOnly: true,
    secure: true, // Required for iframe context
    sameSite: 'none', // Required for iframe context
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return res;
}
