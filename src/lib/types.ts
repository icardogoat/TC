import type { LucideIcon } from "lucide-react";

export type NavLink = {
  name: string;
  href: string;
  icon?: LucideIcon;
};

export type User = {
  id: string;
  username: string;
  avatar: string;
  email?: string;
  isLoggedIn: boolean;
  fielcoins?: number;
  xp?: number;
};

export type NewsArticle = {
  id: string; // ID da mensagem do Discord
  slug: string; // URL amigável
  title: string;
  snippet: string;
  content: string;
  imageUrl: string;
  link: string; // Agora será /noticias/{slug}
  category: string;
  publishedAt: string; // Pode ser um objeto Date ou uma string formatada
  imageHint: string;
  authorName: string;
  authorAvatarUrl: string;
  createdAt?: Date; // Data de criação no DB
};

export type RankedPlayer = {
  rank: number;
  name:string;
  points: number;
  avatarUrl: string;
  imageHint: string;
};
