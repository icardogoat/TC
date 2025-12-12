'use server';

import { getSession } from '@/lib/session';
import { getBetHistoryForUser } from '@/server/betting-actions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session.isLoggedIn || !session.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const betHistory = await getBetHistoryForUser(session.id);
    return NextResponse.json({ betHistory });
  } catch (error) {
    console.error('Erro ao buscar histórico de apostas:', error);
    return NextResponse.json({ error: 'Falha ao buscar histórico de apostas' }, { status: 500 });
  }
}
