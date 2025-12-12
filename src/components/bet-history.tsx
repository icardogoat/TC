'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock, Gem, History, Trophy, TrendingDown, TrendingUp } from 'lucide-react';
import type { BetHistoryItem } from '@/server/betting-actions';
import { Badge } from './ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getBetDescription(betType: string, betValue: string, homeTeam: string, awayTeam: string) {
    const descriptions: Record<string, Record<string, string>> = {
        match_winner: {
            home: `Vitória de ${homeTeam}`,
            away: `Vitória de ${awayTeam}`,
            draw: 'Empate',
        },
        btts: {
            yes: 'Ambas as equipes marcam: Sim',
            no: 'Ambas as equipes marcam: Não',
        },
        over_under: {
            'over_2.5': 'Total de Gols: Mais de 2.5',
            'under_2.5': 'Total de Gols: Menos de 2.5',
        },
        double_chance: {
            home_draw: 'Chance Dupla: Casa ou Empate',
            home_away: 'Chance Dupla: Casa ou Fora',
            draw_away: 'Chance Dupla: Empate ou Fora',
        },
    };
    return descriptions[betType]?.[betValue] || `${betType}: ${betValue}`;
}


function HistoryItem({ item }: { item: BetHistoryItem }) {
  const isPending = item.status === 'pending';
  const isWon = item.status === 'won';
  const isLost = item.status === 'lost';

  const statusInfo = {
    pending: { text: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
    won: { text: 'Ganha', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Trophy },
    lost: { text: 'Perdida', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: TrendingDown },
  };

  const currentStatus = statusInfo[item.status];
  const Icon = currentStatus.icon;

  return (
    <div className="bg-black/30 rounded-lg p-4 border border-white/10">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <Image src={item.game.homeTeamLogo} alt={item.game.homeTeamName} width={20} height={20} />
            <span>{item.game.homeTeamName}</span>
            <span className="text-gray-400">vs</span>
            <Image src={item.game.awayTeamLogo} alt={item.game.awayTeamName} width={20} height={20} />
            <span>{item.game.awayTeamName}</span>
          </div>
           <p className="text-xs text-gray-400 mt-1">{format(parseISO(item.game.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
           {!isPending && (
             <p className="text-sm font-bold mt-1">Resultado: {item.game.scoreHome} - {item.game.scoreAway}</p>
           )}
        </div>
         <Badge className={`flex-shrink-0 ${currentStatus.color}`}>
          <Icon className="h-3 w-3 mr-1" />
          {currentStatus.text}
        </Badge>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
         <p className="text-sm font-semibold text-white">
            {getBetDescription(item.betType, item.betValue, item.game.homeTeamName, item.game.awayTeamName)}
        </p>
        <div className="flex items-center justify-between text-sm mt-2 text-gray-300">
           <div>
             <span>Aposta: </span>
             <span className="font-bold text-white flex items-center gap-1">
                <Gem className="h-3 w-3 text-primary" />
                {item.amount.toLocaleString('pt-BR')} FC$
            </span>
           </div>
            <div>
             <span>Odd: </span>
             <span className="font-bold text-primary">{item.odds.toFixed(2)}</span>
           </div>
           <div>
             <span>Retorno Potencial: </span>
              <span className={`font-bold ${isWon ? 'text-green-400' : 'text-white'}`}>
                {isWon ? '+' : ''}{item.potentialWinnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} FC$
             </span>
           </div>
        </div>
      </div>
    </div>
  );
}

export function BetHistory() {
  const [history, setHistory] = useState<BetHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/bets/history');
        if (!res.ok) {
          throw new Error('Falha ao buscar o histórico de apostas.');
        }
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setHistory(data.betHistory);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <Card className="bg-gray-900/50 border border-white/10 text-white">
      <CardHeader>
        <CardTitle className="font-headline text-xl tracking-wider flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Apostas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : error ? (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : history.length === 0 ? (
          <p className="text-center text-gray-400 py-4">Você ainda não fez nenhuma aposta. <Link href="/aposta" className="text-primary hover:underline">Faça sua primeira aposta!</Link></p>
        ) : (
          history.map(item => <HistoryItem key={item.id} item={item} />)
        )}
      </CardContent>
    </Card>
  );
}
