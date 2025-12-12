'use server';

import { NextResponse } from 'next/server';
import { getUsersRankedByXp, getUsersRankedByFielcoins } from '@/server/actions';
import { getUsersRankedByBetsCount, getUsersRankedByTotalAmount } from '@/server/betting-actions';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'yearly';

  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
    return NextResponse.json({ error: 'Invalid period specified' }, { status: 400 });
  }

  try {
    const [
      xpPlayers,
      fielcoinsPlayers,
      betsCountPlayers,
      totalAmountPlayers
    ] = await Promise.all([
      getUsersRankedByXp(period),
      getUsersRankedByFielcoins(period),
      getUsersRankedByBetsCount(period),
      getUsersRankedByTotalAmount(period)
    ]);

    return NextResponse.json({
      xp: xpPlayers,
      fielcoins: fielcoinsPlayers,
      betsCount: betsCountPlayers,
      totalAmount: totalAmountPlayers,
    });

  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
  }
}
