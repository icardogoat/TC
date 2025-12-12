'use server';

import db from "@/lib/database/db";
import { syncOddsForGame } from "./betting-actions";

const TEAM_ID = 131; // Corinthians
const SYNC_INTERVAL = 12 * 60 * 60 * 1000; // 12 horas em milissegundos

export type Game = {
  id: number;
  date: string;
  status: string;
  venue: string;
  league: {
    name: string;
    logo: string;
  };
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  score: {
    home: number | null;
    away: number | null;
  };
};

/**
 * Garante que a tabela 'games' e 'sync_log' existam.
 */
async function ensureGamesTableExists() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY,
            date TIMESTAMP WITH TIME ZONE NOT NULL,
            status VARCHAR(10),
            venue VARCHAR(255),
            league_name VARCHAR(255),
            league_logo TEXT,
            home_team_id INTEGER,
            home_team_name VARCHAR(255),
            home_team_logo TEXT,
            away_team_id INTEGER,
            away_team_name VARCHAR(255),
            away_team_logo TEXT,
            score_home INTEGER,
            score_away INTEGER,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);
    
     await db.query(`
        CREATE TABLE IF NOT EXISTS sync_log (
            id SERIAL PRIMARY KEY,
            sync_type VARCHAR(50) UNIQUE NOT NULL,
            last_sync_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
    `);
}


/**
 * Busca dados da API de futebol.
 */
async function fetchFromApi(endpoint: string, params: Record<string, any>) {
  const apiKey = process.env.RAPIDAPI_FOOTBALL_KEY;
  const apiHost = process.env.RAPIDAPI_FOOTBALL_HOST;

  if (!apiKey || !apiHost) {
    throw new Error('Football API key or host not configured');
  }

  const url = new URL(`https://api-football-v1.p.rapidapi.com/v3/${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': apiHost,
    },
    // O cache agora é gerenciado pela nossa lógica de sincronização, não pelo Next.
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error (${response.status}): ${errorBody}`);
    throw new Error(`Failed to fetch data from football API: ${response.statusText}`);
  }

  return response.json();
}


/**
 * Sincroniza os dados da API de futebol com o banco de dados.
 * A sincronização só ocorre se o intervalo de tempo desde a última foi ultrapassado.
 */
export async function syncGamesFromApi() {
    await ensureGamesTableExists();
    
    const client = await db.connect();
    try {
        const lastSyncResult = await client.query("SELECT last_sync_at FROM sync_log WHERE sync_type = 'football_games'");
        
        if (lastSyncResult.rows.length > 0) {
            const lastSyncTime = new Date(lastSyncResult.rows[0].last_sync_at).getTime();
            if (Date.now() - lastSyncTime < SYNC_INTERVAL) {
                // Intervalo de tempo não atingido, não faz a sincronização.
                return;
            }
        }
        
        console.log("Iniciando sincronização dos jogos de futebol...");

        // Busca últimos e próximos jogos da API
        const lastGamesData = await fetchFromApi('fixtures', { team: TEAM_ID, last: 3, status: 'FT' });
        const nextGameData = await fetchFromApi('fixtures', { team: TEAM_ID, next: 1 });
        
        const allGames = [...lastGamesData.response, ...nextGameData.response];

        // Usa transação para garantir a atomicidade
        await client.query('BEGIN');

        for (const game of allGames) {
            const { fixture, teams, goals, league } = game;
            await client.query(`
                INSERT INTO games (id, date, status, venue, league_name, league_logo, home_team_id, home_team_name, home_team_logo, away_team_id, away_team_name, away_team_logo, score_home, score_away, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    date = EXCLUDED.date,
                    status = EXCLUDED.status,
                    venue = EXCLUDED.venue,
                    score_home = EXCLUDED.score_home,
                    score_away = EXCLUDED.score_away,
                    updated_at = NOW();
            `, [
                fixture.id, fixture.date, fixture.status.short, fixture.venue.name,
                league.name, league.logo,
                teams.home.id, teams.home.name, teams.home.logo,
                teams.away.id, teams.away.name, teams.away.logo,
                goals.home, goals.away
            ]);
            
            // Após salvar o próximo jogo, tenta sincronizar as odds para ele.
            if(fixture.status.short === 'NS') {
                syncOddsForGame(fixture.id).catch(err => {
                    console.error(`Falha na sincronização de odds para o jogo ${fixture.id} em segundo plano:`, err);
                });
            }
        }
        
        // Atualiza o registro de tempo da sincronização
        await client.query(`
            INSERT INTO sync_log (sync_type, last_sync_at) VALUES ('football_games', NOW())
            ON CONFLICT (sync_type) DO UPDATE SET last_sync_at = NOW();
        `);

        await client.query('COMMIT');
        console.log("Sincronização dos jogos de futebol concluída.");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Erro durante a sincronização dos jogos:", err);
        throw err; // Lança o erro para que o chamador saiba que falhou.
    } finally {
        client.release();
    }
}


// Helper para mapear linha do DB para o objeto Game
const mapRowToGame = (row: any): Game => ({
    id: row.id,
    date: row.date,
    status: row.status,
    venue: row.venue,
    league: { name: row.league_name, logo: row.league_logo },
    homeTeam: { id: row.home_team_id, name: row.home_team_name, logo: row.home_team_logo },
    awayTeam: { id: row.away_team_id, name: row.away_team_name, logo: row.away_team_logo },
    score: { home: row.score_home, away: row.score_away },
});

/**
 * Busca os jogos do banco de dados.
 */
export async function getGamesFromDb(): Promise<{ oldGames: Game[], newGame: Game | null, nextGame: Game | null }> {
    await ensureGamesTableExists();
    const now = new Date();

    // Busca os 3 últimos jogos encerrados (FT) que aconteceram antes de agora
    const lastGamesResult = await db.query(
        "SELECT * FROM games WHERE status = 'FT' AND date < $1 ORDER BY date DESC LIMIT 3", [now]
    );
    const lastThreeGames = lastGamesResult.rows.map(mapRowToGame);

    // Busca o próximo jogo que ainda não começou (NS)
    const nextGameResult = await db.query(
        "SELECT * FROM games WHERE status = 'NS' AND date > $1 ORDER BY date ASC LIMIT 1", [now]
    );
    const nextGame = nextGameResult.rows.length > 0 ? mapRowToGame(nextGameResult.rows[0]) : null;

    // A lógica para separar o jogo novo e os antigos permanece a mesma
    const newGame = lastThreeGames.length > 0 ? lastThreeGames[0] : null;
    const oldGames = lastThreeGames.slice(1, 3);

    return { oldGames, newGame, nextGame };
}
