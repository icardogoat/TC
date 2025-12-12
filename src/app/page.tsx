
'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/hero";
import { NewsFeed } from "@/components/news-feed";
import { Footer } from "@/components/layout/footer";
import { ParticleBackground } from "@/components/particle-background";
import { DiscordFeatures } from "@/components/discord-features";
import { RankingXp } from '@/components/ranking-xp';
import { RankingFielcoins } from '@/components/ranking-fielcoins';
import { getUsersRankedByXp, getUsersRankedByFielcoins } from '@/server/actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function Home() {
  const session = await getSession();
  if (session.isLoggedIn) {
    redirect('/dashboard');
  }

  const [xpPlayers, fielcoinsPlayers] = await Promise.all([
    getUsersRankedByXp('yearly'),
    getUsersRankedByFielcoins('yearly')
  ]);

  return (
    <>
      <ParticleBackground />
      <div className="flex min-h-screen flex-col bg-transparent">
        <Header />
        <main className="flex-1 pt-20">
          <HeroSection />
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline text-3xl md:text-4xl tracking-wider text-white">
                ÚLTIMAS NOTÍCIAS
              </h2>
              <Button asChild size="sm" variant="link" className="hidden md:inline-flex text-primary hover:text-primary/80">
                  <Link href="/noticias">
                      Ver todas
                      <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              <div className="col-span-1 lg:col-span-2">
                <NewsFeed initialLimit={5} showViewAll={true} showTitle={false} />
              </div>
              <div className="col-span-1 space-y-8">
                 <RankingXp players={xpPlayers} />
                 <RankingFielcoins players={fielcoinsPlayers} />
              </div>
            </div>
          </div>
          <DiscordFeatures />
        </main>
        <Footer />
      </div>
    </>
  );
}
