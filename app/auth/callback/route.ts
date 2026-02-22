import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_POLICE_ROLE_ID = process.env.DISCORD_POLICE_ROLE_ID;
const DISCORD_DOJ_ROLE_ID = process.env.DISCORD_DOJ_ROLE_ID;
const APP_URL = process.env.APP_URL;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return new NextResponse('Missing code', { status: 400 });
  }

  try {
    // 1. Exchange code for token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${APP_URL}/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return new NextResponse(`Token exchange failed: ${error}`, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Get User Info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return new NextResponse('Failed to fetch user info', { status: 500 });
    }

    const userData = await userResponse.json();

    // 3. Get Guild Member Info (for roles)
    let roles: string[] = [];
    
    if (DISCORD_GUILD_ID) {
      const memberResponse = await fetch(
        `https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (memberResponse.ok) {
        const memberData = await memberResponse.json();
        const memberRoles = memberData.roles || [];

        if (DISCORD_POLICE_ROLE_ID && memberRoles.includes(DISCORD_POLICE_ROLE_ID)) {
          roles.push('police');
        }
        if (DISCORD_DOJ_ROLE_ID && memberRoles.includes(DISCORD_DOJ_ROLE_ID)) {
          roles.push('doj');
        }
      } else {
        console.warn('Failed to fetch guild member info, maybe not in guild?');
      }
    } else {
      // Dev mode fallback or if no guild ID configured
      console.warn('No DISCORD_GUILD_ID configured, skipping role check');
    }

    // 4. Create Session
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'default-secret-key-change-me'
    );
    
    const token = await new SignJWT({
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      roles,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // 5. Return HTML to close popup
    const response = new NextResponse(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

    // Set cookie
    response.cookies.set({
      name: 'session',
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Auth error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
