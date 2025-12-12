
'use server';
import { NextResponse } from 'next/server';
import type { NewsArticle } from '@/lib/types';


// Funções de parsing movidas diretamente para cá para remover dependência do news-actions
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

const parseMessageToArticle = (message: any): NewsArticle | null => {
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
  const slug = generateSlug(title, id);
  const discriminator = author.discriminator !== '0' 
        ? author.discriminator 
        : (parseInt(author.id.substring(author.id.length - 4)) % 5).toString();
  const authorAvatarUrl = author.avatar
      ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discriminator) % 5}.png`;

  return {
    id: id,
    title: title,
    slug: slug,
    content: fullContent,
    snippet: fullContent.substring(0, 150) + (fullContent.length > 150 ? '...' : ''),
    imageUrl: imageUrl,
    link: `/noticias/${slug}`,
    category: 'Notícias do Discord',
    publishedAt: new Date(timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric'
    }),
    imageHint: 'discord news',
    authorName: author.global_name || author.username,
    authorAvatarUrl: authorAvatarUrl
  };
};

export async function GET() {
  const channelId = process.env.NOTICIAS_CANAL_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!channelId || !botToken) {
    console.error('Configurações do Discord (ID do canal ou Token do bot) não encontradas.');
    return NextResponse.json({ articles: [], error: 'Configurações do servidor do Discord ausentes.' }, { status: 500 });
  }

  try {
    // Busca as mensagens diretamente do Discord
    const response = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages?limit=20`, {
        headers: { Authorization: `Bot ${botToken}` },
        // Cacheia a resposta da API do Discord por 5 minutos para evitar rate limit
        next: { revalidate: 300 } 
    });

    if (!response.ok) {
        console.error(`Falha ao buscar mensagens do Discord: ${response.statusText}`);
        return NextResponse.json({ articles: [], error: 'Falha ao buscar notícias do Discord.' }, { status: 502 });
    }

    const messages = await response.json();
    const articles = messages.map(parseMessageToArticle).filter((a: any): a is NewsArticle => a !== null);
    
    return NextResponse.json({ articles });

  } catch (error) {
    console.error('Erro ao buscar notícias diretamente do Discord:', error);
    return NextResponse.json({ articles: [], error: 'Falha ao processar notícias do Discord.' }, { status: 500 });
  }
}
