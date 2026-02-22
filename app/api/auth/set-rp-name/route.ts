import { NextRequest, NextResponse } from 'next/server';
import { getSession, signSession } from '@/lib/auth';
import { saveRpUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { rpName } = await request.json();
  if (!rpName || typeof rpName !== 'string' || rpName.trim().length < 3) {
    return new NextResponse('Nom RP invalide (minimum 3 caractères)', { status: 400 });
  }

  saveRpUser({ discordId: session.id as string, rpName: rpName.trim() });

  const newToken = await signSession({
    id: session.id,
    username: session.username,
    discriminator: session.discriminator,
    avatar: session.avatar,
    roles: session.roles,
    rpName: rpName.trim(),
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'session',
    value: newToken,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return response;
}
