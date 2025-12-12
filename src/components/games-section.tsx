'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Shield, Tv } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Team = {
  name: string;
  logo: string;
};

type Game = {
  id: number;
  date: string;
  status: string;
  venue: string;
  league: {
    name: string;
    logo: string;
  };
  homeTeam: Team;
  awayTeam: Team;
  score: {
    home: number | null;
    away: number | null;
  };
};

type GamesData = {
  oldGames: Game[];
  newGame: Game | null;
  nextGame: Game | null;
};

function GameCard({ game, type }: { game: Game; type: 'past' | 'next' }) {
    const gameDate = parseISO(game.date);

    return (
        <Card className="bg-black/30 border border-white/10 text-white w-full">
        <CardHeader className="p-3 bg-black/20">
            <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                    <Image src={game.league.logo} alt={game.league.name} width={16} height={16} />
                    <span className="truncate">{game.league.name}</span>
                </div>
                 <span className="capitalize">{format(gameDate, 'E, d MMM', { locale: ptBR })}</span>
            </div>
        </CardHeader>
        <CardContent className="p-4 flex flex-col items-center gap-4">
            <div className="grid grid-cols-3 items-center w-full">
            <div className="flex flex-col items-center text-center">
                <Image src={game.homeTeam.logo} alt={game.homeTeam.name} width={48} height={48} className="mb-2 h-12 w-12 object-contain"/>
                <p className="text-sm font-semibold truncate">{game.homeTeam.name}</p>
            </div>
            
            {type === 'past' ? (
                <div className="text-center">
                    <p className="font-headline text-4xl tracking-wider">{game.score.home} - {game.score.away}</p>
                    <p className="text-xs text-gray-400 bg-red-500/80 rounded-full px-2 py-0.5 w-fit mx-auto">Encerrado</p>
                </div>
            ) : (
                <div className="text-center">
                    <p className="font-headline text-3xl tracking-wider">{format(gameDate, 'HH:mm')}</p>
                     <div className="text-xs text-primary bg-primary/20 rounded-full px-2 py-0.5 w-fit mx-auto mt-1">
                        Próximo Jogo
                    </div>
                </div>
            )}

            <div className="flex flex-col items-center text-center">
                <Image src={game.awayTeam.logo} alt={game.awayTeam.name} width={48} height={48} className="mb-2 h-12 w-12 object-contain"/>
                <p className="text-sm font-semibold truncate">{game.awayTeam.name}</p>
            </div>
            </div>
             <div className="text-center text-xs text-gray-400 w-full truncate">
                <p>{game.venue}</p>
            </div>
        </CardContent>
        </Card>
    );
}

function GameCardSkeleton() {
    return (
        <Card className="bg-black/30 border border-white/10 text-white w-full">
            <CardHeader className="p-3 bg-black/20">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center gap-4">
                <div className="grid grid-cols-3 items-center w-full">
                    <div className="flex flex-col items-center text-center gap-2">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="text-center">
                        <Skeleton className="h-10 w-24 mx-auto" />
                        <Skeleton className="h-4 w-16 mx-auto mt-2" />
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
                <Skeleton className="h-4 w-40" />
            </CardContent>
        </Card>
    )
}

export function GamesSection() {
  const [games, setGames] = useState<GamesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/games');
        if (!res.ok) {
            throw new Error('Failed to fetch games data from server');
        }
        const data = await res.json();
        setGames(data);
      } catch (e: any) {
        setError(e.message || 'Ocorreu um erro ao buscar os jogos.');
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

  if (loading) {
    return (
         <Card className="bg-gray-900/50 border border-white/10 text-white max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline text-2xl tracking-wider">Jogos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-2">Próximo Jogo</h3>
                    <GameCardSkeleton />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Jogo Recente</h3>
                    <GameCardSkeleton />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">Jogos Anteriores</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <GameCardSkeleton />
                        <GameCardSkeleton />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
  }

  if (error) {
    return (
        <Card className="bg-gray-900/50 border border-red-500/50 text-white max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline text-2xl tracking-wider text-red-400">Erro ao Carregar Jogos</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-red-300">{error}</p>
                <p className="text-gray-400 text-sm mt-2">Por favor, verifique sua chave da API e a configuração do servidor.</p>
            </CardContent>
        </Card>
    )
  }
  
  if (!games || (!games.nextGame && !games.newGame && games.oldGames.length === 0)) {
     return (
        <Card className="bg-gray-900/50 border border-white/10 text-white max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline text-2xl tracking-wider">Jogos</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-gray-400">Nenhuma informação de jogo disponível no momento.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="bg-gray-900/50 border border-white/10 text-white max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl tracking-wider">Próximos e Últimos Jogos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {games.nextGame && (
          <div className="animate-float">
            <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2"><Calendar className="h-5 w-5" />Próximo Jogo</h3>
            <GameCard game={games.nextGame} type="next" />
          </div>
        )}

        {games.newGame && (
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2"><Clock className="h-5 w-5" />Último Resultado</h3>
            <GameCard game={games.newGame} type="past" />
          </div>
        )}

        {games.oldGames.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-400 mb-3 flex items-center gap-2"><Shield className="h-5 w-5" />Resultados Anteriores</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {games.oldGames.map(game => (
                <GameCard key={game.id} game={game} type="past" />
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
