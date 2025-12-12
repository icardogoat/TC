import { getSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Code is missing' }, { status: 400 });
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error('NEXT_PUBLIC_BASE_URL is not set');
    return NextResponse.json({ error: 'Server configuration error: NEXT_PUBLIC_BASE_URL is not set.' }, { status: 500 });
  }

  const redirectUri = `${baseUrl}/api/auth/callback`;

  if (!clientId || !clientSecret) {
    console.error('Discord client ID or secret is not set');
    return NextResponse.json({ error: 'Server configuration error: Discord client ID or secret is not set.' }, { status: 500 });
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Failed to fetch token:', tokenData);
      return NextResponse.json({ error: 'Failed to fetch token', details: tokenData }, { status: 500 });
    }

    const accessToken = tokenData.access_token;

    // 2. Use access token to fetch user data
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
        console.error('Failed to fetch user:', userData);
      return NextResponse.json({ error: 'Failed to fetch user', details: userData }, { status: 500 });
    }
    
    // Discord is phasing out discriminators. If it's "0", we generate one for the avatar.
    const discriminator = userData.discriminator !== '0' 
        ? userData.discriminator 
        : (parseInt(userData.id.substring(userData.id.length - 4)) % 5).toString();


    // 3. Save user data in session
    const session = await getSession();
    session.id = userData.id;
    session.username = userData.global_name || userData.username;
    session.email = userData.email;
    session.avatar = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discriminator) % 5}.png`;
    session.isLoggedIn = true;
    await session.save();

  } catch (error) {
    console.error('Authentication callback error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  // 4. Redirect to home page using the base URL
  redirect(baseUrl);
}
