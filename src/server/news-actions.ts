'use server';

import db from "@/lib/database/db";
import type { NewsArticle } from "@/lib/types";

function generateSlug(title: string, id: string): string {
    const noEmojis = title.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

    const baseSlug = noEmojis
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 70);

    return `${baseSlug}-${id.slice(-5)}`;
}


const parseMessage = (message: any): Omit<NewsArticle, 'slug' | 'link' | 'publishedAt'> & { originalDate: Date } | null => {
  const { content, attachments, timestamp, id, author } = message;
  if (!content) return null;

  let cleanedContent = content;
  let title = "Notícia Sem Título";

  cleanedContent = cleanedContent.replace(/<:\w+:\d+>/g, '').trim();

  const titlePatterns = [
    /(?:#+\s*)?(?:[\w\p{Extended_Pictographic}]+\s*\|)?\s*\*\*(.*?)\*\*/u, 
    /(?:#+\s*)?(?:[\w\p{Extended_Pictographic}]+\s*\|)?\s*(.*?)\n/u,
  ];
  
  let titleMatch;
  for (const pattern of titlePatterns) {
    const match = cleanedContent.match(pattern);
    if (match && match[1] && match[1].trim().length > 5) {
        titleMatch = match;
        break;
    }
  }

  if (titleMatch) {
    title = titleMatch[1].trim().replace(/\|/g, '').replace(/\*/g, '').trim();
    cleanedContent = cleanedContent.replace(titleMatch[0], '').trim();
  }

  let fullContent = cleanedContent
    .split('\n')
    .filter(line => 
        !line.match(/^#?\s*[\p{Extended_Pictographic}✍🏻🗞️📸🔔]/u) &&
        !line.match(/^\s*#/) &&
        !line.match(/<@!?&?\d+>/) &&
        line.trim() !== ''
    )
    .join('\n')
    .replace(/^>\s/gm, '')
    .replace(/^-/gm, '')
    .trim();

  const imageUrl = attachments.length > 0 ? attachments[0].url : 'https://picsum.photos/seed/' + id + '/800/600';
  const originalDate = new Date(timestamp);
  
  const discriminator = author.discriminator !== '0' 
        ? author.discriminator 
        : (parseInt(author.id.substring(author.id.length - 4)) % 5).toString();
  const authorAvatarUrl = author.avatar
      ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discriminator) % 5}.png`;

  return {
    id: id,
    title: title,
    content: fullContent,
    snippet: fullContent.substring(0, 150) + (fullContent.length > 150 ? '...' : ''),
    imageUrl: imageUrl,
    category: 'Notícias do Discord',
    originalDate: originalDate,
    imageHint: 'discord news',
    authorName: author.global_name || author.username,
    authorAvatarUrl: authorAvatarUrl
  };
};

async function ensureNewsTableExists() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS news_articles (
            id VARCHAR(255) PRIMARY KEY,
            slug VARCHAR(255) NOT NULL UNIQUE,
            title TEXT NOT NULL,
            snippet TEXT,
            content TEXT,
            image_url TEXT,
            category VARCHAR(100),
            published_at TIMESTAMP WITH TIME ZONE NOT NULL,
            image_hint VARCHAR(100),
            author_name VARCHAR(255),
            author_avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function syncNewsFromDiscord() {
    await ensureNewsTableExists();

    const channelId = process.env.NOTICIAS_CANAL_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!channelId || !botToken) {
        throw new Error('Configurações do Discord (ID do canal ou Token do bot) não encontradas.');
    }

    const response = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages?limit=20`, {
        headers: { Authorization: `Bot ${botToken}` },
        next: { revalidate: 300 }
    });

    if (!response.ok) {
        throw new Error(`Falha ao buscar mensagens do Discord: ${response.statusText}`);
    }

    const messages = await response.json();
    const articles = messages.map(parseMessage).filter((a: any): a is NonNullable<typeof a> => a !== null);

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        for (const article of articles) {
            const slug = generateSlug(article.title, article.id);

            await client.query(`
                INSERT INTO news_articles (id, slug, title, snippet, content, image_url, category, published_at, image_hint, author_name, author_avatar_url, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    slug = EXCLUDED.slug,
                    title = EXCLUDED.title,
                    snippet = EXCLUDED.snippet,
                    content = EXCLUDED.content,
                    image_url = EXCLUDED.image_url,
                    published_at = EXCLUDED.published_at,
                    author_name = EXCLUDED.author_name,
                    author_avatar_url = EXCLUDED.author_avatar_url,
                    updated_at = NOW();
            `, [
                article.id, slug, article.title, article.snippet, article.content, article.imageUrl, article.category, article.originalDate, article.imageHint, article.authorName, article.authorAvatarUrl
            ]);
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

const mapRowToArticle = (row: any): NewsArticle => {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        snippet: row.snippet,
        content: row.content,
        imageUrl: row.image_url,
        link: `/noticias/${row.slug}`, // Link interno para a página do slug
        category: row.category,
        publishedAt: new Date(row.published_at).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
        }),
        imageHint: row.image_hint,
        authorName: row.author_name,
        authorAvatarUrl: row.author_avatar_url,
    };
};

export async function getAllArticles({ limit, excludeId }: { limit?: number; excludeId?: string } = {}): Promise<NewsArticle[]> {
    let query = 'SELECT * FROM news_articles';
    const params = [];

    if (excludeId) {
        query += ' WHERE id != $1';
        params.push(excludeId);
    }
    
    query += ' ORDER BY published_at DESC';

    if (limit) {
        const nextParam = params.length + 1;
        query += ` LIMIT $${nextParam}`;
        params.push(limit);
    }
    
    const { rows } = await db.query(query, params);
    return rows.map(mapRowToArticle);
}

export async function getArticleById(id: string): Promise<NewsArticle | null> {
    const { rows } = await db.query('SELECT * FROM news_articles WHERE id = $1', [id]);
    if (rows.length > 0) {
        return mapRowToArticle(rows[0]);
    }
    return null;
}

export async function getArticleBySlug(slug: string): Promise<NewsArticle | null> {
    const { rows } = await db.query('SELECT * FROM news_articles WHERE slug = $1', [slug]);
    if (rows.length > 0) {
        return mapRowToArticle(rows[0]);
    }
    return null;
}
