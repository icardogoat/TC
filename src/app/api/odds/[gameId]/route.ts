'use server';
import { NextResponse } from 'next/server';
import { getOddsForGameFromDb } from '@/server/betting-actions';

export async function GET(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  const gameId = parseInt(params.gameId, 10);

  if (isNaN(gameId)) {
    return NextResponse.json({ error: 'ID do jogo é inválido' }, { status: 400 });
  }

  try {
    const odds = await getOddsForGameFromDb(gameId);
    
    if (!odds) {
      return NextResponse.json({ odds: null, error: 'Odds para este jogo não foram encontradas ou ainda não estão disponíveis.' }, { status: 404 });
    }

    return NextResponse.json({ odds });

  } catch (error) {
    console.error(`Erro ao buscar odds para o jogo '${gameId}':`, error);
    return NextResponse.json({ error: 'Falha ao buscar odds do banco de dados' }, { status: 500 });
  }
}
