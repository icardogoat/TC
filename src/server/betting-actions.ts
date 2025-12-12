
'use server';

import db from "@/lib/database/db";
import type { RankedPlayer, User } from "@/lib/types";
import type { Game } from "./game-actions";

export type BetOdds = {
    gameId: number;
    bookmaker: string;
    winHome: number | null;
    winDraw: number | null;
    winAway: number | null;
    bttsYes: number | null;
    bttsNo: number | null;
    over2_5: number | null;
    under2_5: number | null;
    doubleChanceHomeDraw: number | null;
    doubleChanceHomeAway: number | null;
    doubleChanceDrawAway: number | null;
    lastUpdate: Date;
}

export type PlaceBetPayload = {
    userId: string;
    gameId: number;
    betType: string;
    betValue: string;
    odds: number;
    amount: number;
}

export type BetHistoryItem = {
  id: number;
  betType: string;
  betValue: string;
  odds: number;
  amount: number;
  status: 'pending' | 'won' | 'lost';
  potentialWinnings: number;
  createdAt: Date;
  game: {
    id: number;
    date: string;
    homeTeamName: string;
    homeTeamLogo: string;
    awayTeamName: string;
    awayTeamLogo: string;
    scoreHome: number | null;
    scoreAway: number | null;
  };
};

/**
 * Garante que a tabela 'bets' exista no banco de dados.
 */
async function ensureBetsTableExists() {
  const client = await db.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS bets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id),
        game_id INTEGER NOT NULL,
        bet_type VARCHAR(50) NOT NULL,
        bet_value VARCHAR(50) NOT NULL,
        odds NUMERIC(8, 3) NOT NULL,
        amount INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        potential_winnings NUMERIC(12, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
}

/**
 * Garante que a tabela 'odds' exista no banco de dados com as novas colunas.
 */
async function ensureOddsTableExists() {
  const client = await db.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS odds (
        game_id INTEGER NOT NULL,
        bookmaker_name VARCHAR(100) NOT NULL,
        win_home NUMERIC(8, 3),
        win_draw NUMERIC(8, 3),
        win_away NUMERIC(8, 3),
        last_update TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY (game_id, bookmaker_name)
      );
    `);
    
    await client.query(`ALTER TABLE odds ADD COLUMN IF NOT EXISTS btts_yes NUMERIC(8, 3);`);
    await client.query(`ALTER TABLE odds ADD COLUMN IF NOT EXISTS btts_no NUMERIC(8, 3);`);
    await client.query(`ALTER TABLE odds ADD COLUMN IF NOT EXISTS over_2_5 NUMERIC(8, 3);`);
    await client.query(`ALTER TABLE odds ADD COLUMN IF NOT EXISTS under_2_5 NUMERIC(8, 3);`);
    await client.query(`ALTER TABLE odds ADD COLUMN IF NOT EXISTS double_chance_home_draw NUMERIC(8, 3);`);
    await client.query(`ALTER TABLE odds ADD COLUMN IF NOT EXISTS double_chance_home_away NUMERIC(8, 3);`);
    await client.query(`ALTER TABLE odds ADD COLUMN IF NOT EXISTS double_chance_draw_away NUMERIC(8, 3);`);

  } finally {
    client.release();
  }
}

async function fetchOddsFromApi(gameId: number) {
  const apiKey = process.env.RAPIDAPI_FOOTBALL_KEY;
  const apiHost = process.env.RAPIDAPI_FOOTBALL_HOST;

  if (!apiKey || !apiHost) {
    throw new Error('Football API key or host not configured');
  }

  const url = new URL(`https://api-football-v1.p.rapidapi.com/v3/odds`);
  url.searchParams.append('fixture', gameId.toString());
  url.searchParams.append('bookmaker', '11');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': apiHost,
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    console.error(`API Error for Odds (${response.status}): ${await response.text()}`);
    return null;
  }

  const data = await response.json();
  return data.response;
}

export async function syncOddsForGame(gameId: number) {
    await ensureOddsTableExists();
    console.log(`Iniciando sincronização de odds para o jogo ID: ${gameId}`);

    const oddsData = await fetchOddsFromApi(gameId);
    if (!oddsData || oddsData.length === 0) {
        console.log(`Nenhuma odd encontrada na API para o jogo ${gameId}.`);
        return;
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        for (const item of oddsData) {
            const betanoBookmaker = item.bookmakers.find((b: any) => b.id === 11); 
            if (!betanoBookmaker) continue;

            const getOdd = (betId: number, value: string) => {
                const bet = betanoBookmaker.bets.find((b: any) => b.id === betId);
                if (!bet) return null;
                const oddValue = bet.values.find((v: any) => v.value === value)?.odd;
                return oddValue ? parseFloat(oddValue) : null;
            };

            const winHome = getOdd(1, 'Home');
            const winDraw = getOdd(1, 'Draw');
            const winAway = getOdd(1, 'Away');
            const bttsYes = getOdd(8, 'Yes');
            const bttsNo = getOdd(8, 'No');
            const over2_5 = getOdd(5, 'Over 2.5');
            const under2_5 = getOdd(5, 'Under 2.5');
            const doubleChanceHomeDraw = getOdd(12, 'Home/Draw');
            const doubleChanceHomeAway = getOdd(12, 'Home/Away');
            const doubleChanceDrawAway = getOdd(12, 'Draw/Away');

            await client.query(`
                INSERT INTO odds (game_id, bookmaker_name, win_home, win_draw, win_away, btts_yes, btts_no, over_2_5, under_2_5, double_chance_home_draw, double_chance_home_away, double_chance_draw_away, last_update)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (game_id, bookmaker_name) DO UPDATE SET
                    win_home = EXCLUDED.win_home, win_draw = EXCLUDED.win_draw, win_away = EXCLUDED.win_away, btts_yes = EXCLUDED.btts_yes, btts_no = EXCLUDED.btts_no, over_2_5 = EXCLUDED.over_2_5, under_2_5 = EXCLUDED.under_2_5, double_chance_home_draw = EXCLUDED.double_chance_home_draw, double_chance_home_away = EXCLUDED.double_chance_home_away, double_chance_draw_away = EXCLUDED.double_chance_draw_away, last_update = EXCLUDED.last_update;
            `, [
                gameId, 'Betano', winHome, winDraw, winAway, bttsYes, bttsNo, over2_5, under2_5, doubleChanceHomeDraw, doubleChanceHomeAway, doubleChanceDrawAway, new Date(item.update)
            ]);
        }
        await client.query('COMMIT');
        console.log(`Sincronização de odds para o jogo ${gameId} concluída.`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(`Erro ao sincronizar odds para o jogo ${gameId}:`, e);
        throw e;
    } finally {
        client.release();
    }
}

export async function getOddsForGameFromDb(gameId: number): Promise<BetOdds | null> {
    await ensureOddsTableExists();

    const { rows } = await db.query(
        "SELECT * FROM odds WHERE game_id = $1 AND bookmaker_name = 'Betano' LIMIT 1", [gameId]
    );

    if (rows.length === 0) {
        try {
            console.log(`Odds para o jogo ${gameId} não encontradas no DB. Tentando sincronização de fallback...`);
            await syncOddsForGame(gameId);
            const secondAttempt = await db.query(
                "SELECT * FROM odds WHERE game_id = $1 AND bookmaker_name = 'Betano' LIMIT 1", [gameId]
            );
            if (secondAttempt.rows.length > 0) {
                 return mapRowToOdds(secondAttempt.rows[0]);
            }
        } catch (error) {
            console.error("Falha ao tentar sincronização de fallback para as odds:", error);
            return null;
        }
    }
    
    if (rows.length > 0) {
        return mapRowToOdds(rows[0]);
    }

    return null;
}

const mapRowToOdds = (row: any): BetOdds => ({
    gameId: row.game_id,
    bookmaker: row.bookmaker_name,
    winHome: row.win_home ? parseFloat(row.win_home) : null,
    winDraw: row.win_draw ? parseFloat(row.win_draw) : null,
    winAway: row.win_away ? parseFloat(row.win_away) : null,
    bttsYes: row.btts_yes ? parseFloat(row.btts_yes) : null,
    bttsNo: row.btts_no ? parseFloat(row.btts_no) : null,
    over2_5: row.over_2_5 ? parseFloat(row.over_2_5) : null,
    under2_5: row.under_2_5 ? parseFloat(row.under_2_5) : null,
    doubleChanceHomeDraw: row.double_chance_home_draw ? parseFloat(row.double_chance_home_draw) : null,
    doubleChanceHomeAway: row.double_chance_home_away ? parseFloat(row.double_chance_home_away) : null,
    doubleChanceDrawAway: row.double_chance_draw_away ? parseFloat(row.double_chance_draw_away) : null,
    lastUpdate: new Date(row.last_update)
});


export async function placeBet(payload: PlaceBetPayload): Promise<{ success: boolean; message: string; newBalance?: number; }> {
    const { userId, gameId, betType, betValue, odds, amount } = payload;
    
    await ensureBetsTableExists();

    if (amount <= 0) {
        return { success: false, message: 'O valor da aposta deve ser positivo.' };
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // 1. Verificar o saldo do usuário
        const userResult = await client.query('SELECT fielcoins FROM users WHERE id = $1 FOR UPDATE', [userId]);
        
        if (userResult.rows.length === 0) {
            throw new Error('Usuário não encontrado.');
        }

        const currentUser = userResult.rows[0];
        const currentBalance = currentUser.fielcoins;

        if (currentBalance < amount) {
            throw new Error('Saldo de FielCoins insuficiente.');
        }

        // 2. Debitar o valor da aposta do saldo
        const newBalance = currentBalance - amount;
        await client.query('UPDATE users SET fielcoins = $1 WHERE id = $2', [newBalance, userId]);

        // 3. Inserir a aposta na tabela 'bets'
        const potentialWinnings = amount * odds;
        await client.query(`
            INSERT INTO bets (user_id, game_id, bet_type, bet_value, odds, amount, potential_winnings, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        `, [userId, gameId, betType, betValue, odds, amount, potentialWinnings]);

        // 4. Confirmar a transação
        await client.query('COMMIT');

        return {
            success: true,
            message: 'Aposta realizada com sucesso!',
            newBalance: newBalance,
        };

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Erro ao realizar aposta:', error);
        return { success: false, message: error.message || 'Ocorreu um erro ao processar sua aposta.' };
    } finally {
        client.release();
    }
}

const getInterval = (period: string) => {
    switch (period) {
        case 'daily': return '1 day';
        case 'weekly': return '7 days';
        case 'monthly': return '1 month';
        case 'yearly':
        default: return '100 years'; // effectively all time
    }
};

/**
 * Busca os top 10 usuários por número de apostas.
 */
export async function getUsersRankedByBetsCount(period: string): Promise<RankedPlayer[]> {
  try {
    await ensureBetsTableExists();
    const interval = getInterval(period);
    const { rows } = await db.query(`
      SELECT
        u.username,
        u.avatar,
        COUNT(b.id) as total_bets,
        RANK() OVER (ORDER BY COUNT(b.id) DESC) as rank
      FROM
        bets b
      JOIN
        users u ON b.user_id = u.id
      WHERE
        b.created_at >= NOW() - $1::interval
      GROUP BY
        u.id
      ORDER BY
        total_bets DESC
      LIMIT 10;
    `, [interval]);

    return rows.map(row => ({
      rank: parseInt(row.rank, 10),
      name: row.username,
      avatarUrl: row.avatar,
      points: parseInt(row.total_bets, 10),
      imageHint: 'profile picture'
    }));

  } catch (error) {
    console.error('Erro ao buscar ranking de contagem de apostas:', error);
    return [];
  }
}

/**
 * Busca os top 10 usuários por valor total apostado.
 */
export async function getUsersRankedByTotalAmount(period: string): Promise<RankedPlayer[]> {
  try {
    await ensureBetsTableExists();
    const interval = getInterval(period);
    const { rows } = await db.query(`
      SELECT
        u.username,
        u.avatar,
        SUM(b.amount) as total_amount,
        RANK() OVER (ORDER BY SUM(b.amount) DESC) as rank
      FROM
        bets b
      JOIN
        users u ON b.user_id = u.id
      WHERE
        b.created_at >= NOW() - $1::interval
      GROUP BY
        u.id
      ORDER BY
        total_amount DESC
      LIMIT 10;
    `, [interval]);

    return rows.map(row => ({
      rank: parseInt(row.rank, 10),
      name: row.username,
      avatarUrl: row.avatar,
      points: parseInt(row.total_amount, 10),
      imageHint: 'profile picture'
    }));

  } catch (error) {
    console.error('Erro ao buscar ranking de valor total apostado:', error);
    return [];
  }
}

/**
 * Conta o número de apostas ganhas para um usuário.
 * @param userId - O ID do Discord do usuário.
 * @returns O número de apostas ganhas.
 */
export async function getBetsWonCountForUser(userId: string): Promise<number> {
    try {
        await ensureBetsTableExists();
        const { rows } = await db.query(
            "SELECT COUNT(*) as bets_won FROM bets WHERE user_id = $1 AND status = 'won'",
            [userId]
        );

        if (rows.length > 0) {
            return parseInt(rows[0].bets_won, 10);
        }
        return 0;
    } catch (error) {
        console.error(`Erro ao contar apostas ganhas para o usuário ${userId}:`, error);
        return 0;
    }
}


/**
 * Busca o histórico de apostas para um usuário específico.
 */
export async function getBetHistoryForUser(userId: string): Promise<BetHistoryItem[]> {
  await ensureBetsTableExists();

  const { rows } = await db.query(`
    SELECT
      b.id,
      b.bet_type,
      b.bet_value,
      b.odds,
      b.amount,
      b.status,
      b.potential_winnings,
      b.created_at,
      g.id as game_id,
      g.date as game_date,
      g.home_team_name,
      g.home_team_logo,
      g.away_team_name,
      g.away_team_logo,
      g.score_home,
      g.score_away
    FROM bets b
    JOIN games g ON b.game_id = g.id
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC
    LIMIT 50;
  `, [userId]);

  return rows.map(row => ({
    id: row.id,
    betType: row.bet_type,
    betValue: row.bet_value,
    odds: parseFloat(row.odds),
    amount: parseInt(row.amount, 10),
    status: row.status,
    potentialWinnings: parseFloat(row.potential_winnings),
    createdAt: row.created_at,
    game: {
      id: row.game_id,
      date: row.game_date,
      homeTeamName: row.home_team_name,
      homeTeamLogo: row.home_team_logo,
      awayTeamName: row.away_team_name,
      awayTeamLogo: row.away_team_logo,
      scoreHome: row.score_home,
      scoreAway: row.score_away,
    }
  }));
}
