'use server';

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ParticleBackground } from "@/components/particle-background";
import { BettingOdds } from "@/components/betting-odds";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Gem } from "lucide-react";
import { getGamesFromDb } from "@/server/game-actions";

export default async function ApostaPage() {
    // Busca o próximo jogo no lado do servidor para passar para o componente cliente
    const { nextGame } = await getGamesFromDb();

    return (
        <>
            <ParticleBackground />
            <div className="flex min-h-screen flex-col bg-transparent">
                <Header />
                <main className="flex-1 pt-20">
                    <div className="container mx-auto px-4 py-12 md:py-20">
                        <div className="max-w-3xl mx-auto">
                            <Card className="bg-gray-900/50 border border-white/10 text-white mb-8 shadow-xl">
                                <CardHeader>
                                    <CardTitle className="font-headline text-3xl md:text-4xl tracking-wider text-white flex items-center gap-3">
                                        <Gem className="h-8 w-8 text-primary" />
                                        Central de Apostas
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            {nextGame ? (
                                <BettingOdds nextGame={nextGame} />
                            ) : (
                                <Card className="bg-gray-900/50 border border-white/10 text-white">
                                    <CardHeader>
                                        <CardTitle className="font-headline text-xl tracking-wider">Nenhuma Partida Futura</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-400">Não há jogos futuros disponíveis para apostas no momento. Volte mais tarde!</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}