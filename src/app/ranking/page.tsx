'use client';

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ParticleBackground } from "@/components/particle-background";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart } from "lucide-react";
import { RankingTabs } from "@/components/ranking-tabs";
import type { RankedPlayer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

type Rankings = {
  xp: RankedPlayer[];
  fielcoins: RankedPlayer[];
  betsCount: RankedPlayer[];
  totalAmount: RankedPlayer[];
};

export default function RankingPage() {
  const [rankings, setRankings] = useState<Rankings | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily'); // 'daily', 'weekly', 'monthly', 'yearly'

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/rankings?period=${period}`);
        const data = await res.json();
        setRankings(data);
      } catch (error) {
        console.error("Failed to fetch rankings", error);
        setRankings({ xp: [], fielcoins: [], betsCount: [], totalAmount: [] });
      } finally {
        setLoading(false);
      }
    }

    fetchRankings();
  }, [period]);

  const RankingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="flex flex-col rounded-lg border border-white/10 bg-gray-900/50 p-2 shadow-lg h-full">
            <CardHeader className="p-4">
                <Skeleton className="h-7 w-48" />
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                {[...Array(5)].map((_, i) => (
                     <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
        <Card className="flex flex-col rounded-lg border border-white/10 bg-gray-900/50 p-2 shadow-lg h-full">
            <CardHeader className="p-4">
                <Skeleton className="h-7 w-48" />
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                {[...Array(5)].map((_, i) => (
                     <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
  );


  return (
    <>
      <ParticleBackground />
      <div className="flex min-h-screen flex-col bg-transparent">
        <Header />
        <main className="flex-1 pt-20">
          <div className="container mx-auto px-4 py-12 md:py-20">
             <Card className="bg-gray-900/50 border border-white/10 text-white max-w-6xl mx-auto mb-8">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl md:text-4xl tracking-wider text-white flex items-center gap-3">
                        <BarChart className="h-8 w-8 text-primary" />
                        Rankings da Comunidade
                    </CardTitle>
                </CardHeader>
            </Card>

            <div className="max-w-6xl mx-auto">
                <RankingTabs 
                  period={period}
                  setPeriod={setPeriod}
                  xpPlayers={rankings?.xp} 
                  fielcoinsPlayers={rankings?.fielcoins}
                  betsCountPlayers={rankings?.betsCount}
                  totalAmountPlayers={rankings?.totalAmount}
                  loading={loading}
                  SkeletonComponent={RankingSkeleton}
                />
            </div>

          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
