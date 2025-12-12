import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    console.error('DISCORD_CLIENT_ID is not set');
    return NextResponse.json({ error: 'Server configuration error: DISCORD_CLIENT_ID is not set.' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error('NEXT_PUBLIC_BASE_URL is not set');
    return NextResponse.json({ error: 'Server configuration error: NEXT_PUBLIC_BASE_URL is not set.' }, { status: 500 });
  }

  const redirectUri = `${baseUrl}/api/auth/callback`;
  
  const scope = ['identify', 'email'].join(' ');
  const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scope)}`;

  redirect(discordUrl);
}
