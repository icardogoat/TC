'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RankingXp } from "@/components/ranking-xp";
import { RankingFielcoins } from "@/components/ranking-fielcoins";
import { Button } from "./ui/button";
import type { RankedPlayer } from "@/lib/types";
import { RankingList } from "./ranking-list";
import { HandCoins, Trophy } from "lucide-react";

type RankingTabsProps = {
    period: string;
    setPeriod: (period: string) => void;
    xpPlayers: RankedPlayer[] | undefined;
    fielcoinsPlayers: RankedPlayer[] | undefined;
    betsCountPlayers: RankedPlayer[] | undefined;
    totalAmountPlayers: RankedPlayer[] | undefined;
    loading: boolean;
    SkeletonComponent: React.FC;
}

const periods = [
    { key: 'daily', label: 'Diário' },
    { key: 'weekly', label: 'Semanal' },
    { key: 'monthly', label: 'Mensal' },
    { key: 'yearly', label: 'Anual' },
];

export function RankingTabs({ 
    period, 
    setPeriod, 
    xpPlayers, 
    fielcoinsPlayers, 
    betsCountPlayers, 
    totalAmountPlayers,
    loading,
    SkeletonComponent
}: RankingTabsProps) {
    return (
        <Tabs defaultValue="points" className="w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <TabsList className="bg-gray-900/50 border border-white/10 p-1 h-auto">
                    <TabsTrigger value="points">Classificação de Pontos</TabsTrigger>
                    <TabsTrigger value="bets">Classificação de Apostas</TabsTrigger>
                </TabsList>
                 <div className="flex items-center gap-2">
                    {periods.map(p => (
                        <Button
                            key={p.key}
                            variant={period === p.key ? "outline" : "outline"}
                            size="sm"
                            onClick={() => setPeriod(p.key)}
                            className={period === p.key ? "bg-primary/10 border-primary/50 text-primary" : ""}
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
            </div>
            <TabsContent value="points">
                {loading ? <SkeletonComponent /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="w-full">
                            <RankingXp players={xpPlayers} />
                        </div>
                        <div className="w-full">
                            <RankingFielcoins players={fielcoinsPlayers} />
                        </div>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="bets">
                 {loading ? <SkeletonComponent /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <RankingList 
                            title="Mais Apostas"
                            players={betsCountPlayers}
                            icon={Trophy}
                            pointUnit="apostas"
                        />
                        <RankingList 
                            title="Valores Apostados"
                            players={totalAmountPlayers}
                            icon={HandCoins}
                            pointUnit="FC$"
                            isCurrency
                        />
                    </div>
                 )}
            </TabsContent>
        </Tabs>
    )
}
