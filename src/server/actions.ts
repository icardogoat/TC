
'use server';

import db from '@/lib/database/db';
import type { User, RankedPlayer } from '@/lib/types';
import { getBetsWonCountForUser } from './betting-actions';

/**
 * Garante que a tabela 'users' exista no banco de dados com todas as colunas necessárias.
 * Este comando é seguro para ser executado múltiplas vezes.
 */
async function ensureUsersTableExists() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255),
          avatar VARCHAR(255),
          email VARCHAR(255),
          entry_position SERIAL,
          fielcoins INTEGER DEFAULT 1000,
          xp INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login_at TIMESTAMP WITH TIME ZONE
      );
    `);
    // Garante que as colunas 'email' e 'entry_position' e 'fielcoins' existam
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS entry_position SERIAL;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS fielcoins INTEGER DEFAULT 1000;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;`);
    
  } catch (error) {
    console.error("Falha ao criar ou alterar a tabela 'users':", error);
    // Lançar o erro é importante para que o problema não passe despercebido.
    throw error;
  }
}

/**
 * Busca os dados de um usuário pelo seu ID, incluindo o saldo de FielCoins.
 * @param userId - O ID do Discord do usuário.
 * @returns Os dados do usuário ou null se não for encontrado.
 */
export async function getUserData(userId: string): Promise<(User & { fielcoins: number }) | null> {
    await ensureUsersTableExists();
    const { rows } = await db.query('SELECT id, username, avatar, email, fielcoins FROM users WHERE id = $1', [userId]);

    if (rows.length > 0) {
        return {
            id: rows[0].id,
            username: rows[0].username,
            avatar: rows[0].avatar,
            email: rows[0].email,
            isLoggedIn: true,
            fielcoins: parseInt(rows[0].fielcoins, 10),
        };
    }
    return null;
}


/**
 * Insere um novo usuário se ele não existir, ou atualiza suas informações se ele já existir.
 * A cada login, o username, avatar e email são atualizados com os dados mais recentes do Discord.
 * Retorna um booleano indicando se o usuário é novo no banco de dados.
 * @param user - O objeto do usuário vindo da sessão do Discord.
 * @returns Um objeto com a propriedade `isNewUser` (boolean).
 */
export async function upsertUserAndCheckIfNew(user: User): Promise<{ isNewUser: boolean }> {
  const now = new Date();
  
  try {
    // Garante que a tabela e colunas existam
    await ensureUsersTableExists();

    // 1. Verifica se o usuário já existe no banco de dados.
    const { rows } = await db.query('SELECT id FROM users WHERE id = $1', [user.id]);
    
    // 2. Se não houver resultado (rows.length === 0), o usuário não existe.
    if (rows.length === 0) {
      // Cria o registro do novo usuário, incluindo o email e o saldo inicial de fielcoins.
      await db.query(
        'INSERT INTO users (id, username, avatar, email, created_at, last_login_at, fielcoins, xp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [user.id, user.username, user.avatar, user.email, now, now, 1000, 0] // Saldo inicial e XP inicial
      );
      // Retorna que é um novo usuário.
      return { isNewUser: true };
    } else {
      // 3. Se o usuário já existe, atualiza a data do último login e também o nome, avatar e email para sincronizar mudanças.
      await db.query(
        'UPDATE users SET last_login_at = $1, username = $2, avatar = $3, email = $4 WHERE id = $5', 
        [now, user.username, user.avatar, user.email, user.id]
      );
      // Retorna que não é um novo usuário.
      return { isNewUser: false };
    }
  } catch (error) {
    console.error('Erro ao inserir ou atualizar usuário:', error);
    // Em caso de falha, assumimos que não é um novo usuário para evitar
    // mostrar a mensagem de boas-vindas em um momento de erro no banco.
    return { isNewUser: false };
  }
}

/**
 * Busca estatísticas agregadas para um usuário.
 * @param userId - O ID do Discord do usuário.
 * @returns Um objeto com as estatísticas do usuário.
 */
export async function getUserStats(userId: string) {
  try {
    const xpRankQuery = `
      SELECT rank FROM (
        SELECT id, RANK() OVER (ORDER BY xp DESC) as rank
        FROM users
      ) as ranked_users
      WHERE id = $1;
    `;
    
    const [xpRankResult, betsWon] = await Promise.all([
      db.query(xpRankQuery, [userId]),
      getBetsWonCountForUser(userId)
    ]);
    
    const xpRank = xpRankResult.rows.length > 0 ? parseInt(xpRankResult.rows[0].rank, 10) : null;

    return {
      xpRank,
      betsWon,
      achievements: 0, // Placeholder
      tournaments: 0, // Placeholder
    };
  } catch (error) {
    console.error(`Erro ao buscar estatísticas para o usuário ${userId}:`, error);
    return {
      xpRank: null,
      betsWon: 0,
      achievements: 0,
      tournaments: 0,
    };
  }
}


/**
 * Busca a versão atual do PostgreSQL para verificar a conexão com o banco de dados.
 * A função agora também garante que a tabela 'users' exista.
 * @returns Uma string contendo a versão do PostgreSQL ou uma mensagem de erro.
 */
export async function getPostgresVersion() {
  try {
    // Garante que a tabela exista antes de qualquer operação de leitura.
    await ensureUsersTableExists();
    const result = await db.query('SELECT version()');
    return result.rows[0].version;
  } catch (error: any) {
    console.error('Falha ao interagir com o PostgreSQL:', error);
    return `Falha ao conectar: ${error.message}`;
  }
}

const getInterval = (period: string) => {
    switch (period) {
        case 'daily': return '1 day';
        case 'weekly': return '7 days';
        case 'monthly': return '1 month';
        case 'yearly':
        default: return '100 years'; // "All time"
    }
};

/**
 * Busca os top 10 usuários ranqueados por XP.
 * @returns Uma lista de jogadores ranqueados.
 */
export async function getUsersRankedByXp(period: string): Promise<RankedPlayer[]> {
  try {
    await ensureUsersTableExists();
    const interval = getInterval(period);
    // A lógica para XP pode ser diferente, pois XP é cumulativo.
    // Aqui, vamos apenas filtrar usuários ativos no período, mas manter o XP total.
    // Se o XP fosse ganho e registrado em outra tabela, a query seria diferente.
    const { rows } = await db.query(
      `SELECT username, avatar, xp, RANK() OVER (ORDER BY xp DESC) as rank 
       FROM users 
       WHERE xp > 0 AND last_login_at >= NOW() - $1::interval
       ORDER BY xp DESC 
       LIMIT 10`,
      [interval]
    );
    
    return rows.map(row => ({
      rank: parseInt(row.rank, 10),
      name: row.username,
      avatarUrl: row.avatar,
      points: parseInt(row.xp, 10),
      imageHint: 'profile picture'
    }));

  } catch (error) {
    console.error('Erro ao buscar ranking de XP:', error);
    return [];
  }
}

/**
 * Busca os top 10 usuários ranqueados por FielCoins.
 * @returns Uma lista de jogadores ranqueados.
 */
export async function getUsersRankedByFielcoins(period: string): Promise<RankedPlayer[]> {
  try {
    await ensureUsersTableExists();
    const interval = getInterval(period);
    // Similar ao XP, FielCoins é um saldo. A query filtra por usuários ativos.
    const { rows } = await db.query(
      `SELECT username, avatar, fielcoins, RANK() OVER (ORDER BY fielcoins DESC) as rank 
       FROM users 
       WHERE last_login_at >= NOW() - $1::interval
       ORDER BY fielcoins DESC 
       LIMIT 10`,
       [interval]
    );

    return rows.map(row => ({
      rank: parseInt(row.rank, 10),
      name: row.username,
      avatarUrl: row.avatar,
      points: parseInt(row.fielcoins, 10),
      imageHint: 'profile picture'
    }));

  } catch (error) {
    console.error('Erro ao buscar ranking de FielCoins:', error);
    return [];
  }
}
