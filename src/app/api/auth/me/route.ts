import { getSession } from '@/lib/session';
import { getUserData } from '@/server/actions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.id) {
    return NextResponse.json({ isLoggedIn: false });
  }

  const userData = await getUserData(session.id);

  if (!userData) {
    return NextResponse.json({ isLoggedIn: false });
  }

  return NextResponse.json({
    isLoggedIn: true,
    id: userData.id,
    username: userData.username,
    avatar: userData.avatar,
    email: userData.email,
    fielcoins: userData.fielcoins,
  });
}
