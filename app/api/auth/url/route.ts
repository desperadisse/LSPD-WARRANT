import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = `${process.env.APP_URL}/auth/callback`;
  
  if (!clientId) {
    return NextResponse.json({ error: 'Missing DISCORD_CLIENT_ID' }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds.members.read', // Need to read guild members to check roles
  });

  const url = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  
  return NextResponse.json({ url });
}
