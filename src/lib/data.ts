import type { NewsArticle, RankedPlayer } from './types';
import { PlaceHolderImages } from './placeholder-images';

// Estes dados agora são apenas um fallback ou exemplo, pois as notícias reais virão da API do Discord.
export const newsArticles: NewsArticle[] = [
  {
    id: "1",
    title: "Timão Garante Vitória em Jogo Eletrizante!",
    snippet: "Em uma final de roer as unhas, o time conquistou uma vitória crucial com um gol espetacular nos últimos minutos. A vitória impulsiona o time na tabela do campeonato...",
    imageUrl: PlaceHolderImages.find(p => p.id === 'news-image-1')?.imageUrl || "https://picsum.photos/seed/1/800/600",
    link: "#",
    category: "Futebol",
    publishedAt: "2 horas atrás",
    imageHint: "soccer game celebration"
  },
  {
    id: "2",
    title: "Novo Reforço Anunciado para o Meio-Campo",
    snippet: "A diretoria confirmou a contratação de um novo talento para fortalecer o elenco. O jogador chega com grande expectativa da torcida Fiel.",
    imageUrl: PlaceHolderImages.find(p => p.id === 'news-image-2')?.imageUrl || "https://picsum.photos/seed/2/400/300",
    link: "#",
    category: "Mercado da Bola",
    publishedAt: "Ontem",
    imageHint: "player signing contract"
  },
  {
    id: "3",
    title: "Próximo Desafio: Clássico Decisivo no Fim de Semana",
    snippet: "A equipe se prepara para um confronto direto contra seu maior rival. O técnico ajusta os últimos detalhes para o jogo que promete parar o estado.",
    imageUrl: PlaceHolderImages.find(p => p.id === 'news-image-3')?.imageUrl || "https://picsum.photos/seed/3/400/300",
    link: "#",
    category: "Pré-Jogo",
    publishedAt: "2 dias atrás",
    imageHint: "soccer training session"
  },
    {
    id: "4",
    title: "Ídolo do Clube Visita CT e Inspira Jogadores",
    snippet: "Uma lenda do Corinthians visitou o centro de treinamento, conversou com os jogadores e compartilhou experiências, motivando o elenco para a reta final da temporada.",
    imageUrl: PlaceHolderImages.find(p => p.id === 'news-image-4')?.imageUrl || "https://picsum.photos/seed/4/400/300",
    link: "#",
    category: "Bastidores",
    publishedAt: "3 dias atrás",
    imageHint: "veteran player coaching"
  }
];


export const rankedPlayersXP: RankedPlayer[] = [];
export const rankedPlayersFielcoins: RankedPlayer[] = [];
