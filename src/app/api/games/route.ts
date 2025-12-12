'use server';

import { NextResponse } from 'next/server';
import { getGamesFromDb } from '@/server/game-actions';

export async function GET() {
  try {
    const { oldGames, newGame, nextGame } = await getGamesFromDb();
    
    return NextResponse.json({
      oldGames,
      newGame,
      nextGame
    });

  } catch (error: any) {
    console.error('Error fetching football data from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch game data', details: error.message }, { status: 500 });
  }
}
