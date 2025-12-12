'use client';

import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/icons/discord-icon";
import { useEffect, useState } from "react";
import Link from "next/link";

const CACHE_KEY = 'discordMemberCount';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos

export function HeroSection() {
  const [memberCount, setMemberCount] = useState(0);
  const discordLink = process.env.NEXT_PUBLIC_DISCORD_GUILD_LINK || "https://discord.gg/sccp";

  useEffect(() => {
    const fetchMemberCount = () => {
      fetch('/api/discord-members')
        .then(res => res.json())
        .then(data => {
          if (data.count) {
            const newCachedData = {
              count: data.count,
              timestamp: new Date().getTime(),
            };
            setMemberCount(data.count);
            localStorage.setItem(CACHE_KEY, JSON.stringify(newCachedData));
          }
        })
        .catch(() => {
          // It's okay to fail silently if the API is down
          // or not configured. The UI will just show the loading state.
        });
    };

    const cachedItem = localStorage.getItem(CACHE_KEY);
    if (cachedItem) {
      const cachedData = JSON.parse(cachedItem);
      const now = new Date().getTime();

      if (now - cachedData.timestamp < CACHE_DURATION) {
        setMemberCount(cachedData.count);
      } else {
        // O cache expirou, busca novos dados
        fetchMemberCount();
      }
    } else {
      // Nenhum cache, busca os dados pela primeira vez
      fetchMemberCount();
    }
  }, []);

  const formatNumber = (num: number) => {
    if (num === 0) return '...'; // Show loading state
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.', ',') + 'k';
    }
    return num;
  };


  return (
    <section className="relative flex h-[60vh] items-center justify-center bg-transparent text-center text-white overflow-hidden">
       <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1554142344-9985a7018318?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
        data-ai-hint="stadium lights"
      />
      <div className="relative z-10 max-w-4xl px-4 animate-float">
        <h1 className="font-headline text-6xl uppercase tracking-wider text-white md:text-8xl lg:text-9xl">
          A Casa da Fiel
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300 md:text-xl">
          A comunidade de torcedores do Corinthians no Discord. Notícias exclusivas, debates, bolões e a resenha que só a Fiel sabe fazer.
        </p>
        <div className="mt-8">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg tracking-wide">
              <Link href={discordLink} target="_blank" rel="noopener noreferrer">
                <DiscordIcon className="mr-2 h-6 w-6" />
                ENTRE NO BANDO
              </Link>
            </Button>
            <p className="mt-2 text-sm text-gray-400 tracking-wide">
                Junte-se a mais de <span className="font-bold text-white">{formatNumber(memberCount)}</span> fiéis!
            </p>
        </div>
      </div>
    </section>
  );
}
