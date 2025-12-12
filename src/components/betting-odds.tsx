'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Clock, Gem } from 'lucide-react';
import { Game } from '@/server/game-actions';
import { BetOdds, placeBet, PlaceBetPayload } from '@/server/betting-actions';
import { differenceInMinutes, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

type BettingSectionProps = {
  nextGame: Game | null;
};

type BetSelection = {
  label: string;
  odd: number;
  type: string;
  value: string;
} | null;

export function BettingOdds({ nextGame }: BettingSectionProps) {
  const { toast } = useToast();
  const [session, setSession] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [odds, setOdds] = useState<BetOdds | null>(null);
  const [loadingOdds, setLoadingOdds] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bettingClosed, setBettingClosed] = useState(false);

  const [betSelection, setBetSelection] = useState<BetSelection>(null);
  const [betAmount, setBetAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.isLoggedIn) {
          setSession(data);
        }
      } catch (error) {
        // Silently fail
      } finally {
        setLoadingUser(false);
      }
    }
    fetchSession();
  }, []);

  useEffect(() => {
    if (!nextGame) {
      setLoadingOdds(false);
      return;
    }

    const checkBettingStatus = () => {
      const gameTime = new Date(nextGame.date);
      const minutesToStart = differenceInMinutes(gameTime, new Date());
      if (minutesToStart <= 15) {
        setBettingClosed(true);
      }
    };
    checkBettingStatus();
    const interval = setInterval(checkBettingStatus, 60000);

    async function fetchOdds() {
      setLoadingOdds(true);
      setError(null);
      try {
        const res = await fetch(`/api/odds/${nextGame!.id}`);
        if (!res.ok) throw new Error('Falha ao buscar odds do servidor.');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setOdds(data.odds);
      } catch (e: any) {
        setError(e.message || 'Ocorreu um erro ao buscar as odds.');
      } finally {
        setLoadingOdds(false);
      }
    }
    fetchOdds();
    
    return () => clearInterval(interval);
  }, [nextGame]);

  const handlePlaceBet = async () => {
    if (!betSelection || !session || !nextGame) return;
    
    const amount = parseInt(betAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Valor Inválido', description: 'Por favor, insira um valor numérico positivo.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: PlaceBetPayload = {
        userId: session.id,
        gameId: nextGame.id,
        betType: betSelection.type,
        betValue: betSelection.value,
        odds: betSelection.odd,
        amount: amount,
      };

      const result = await placeBet(payload);

      if (result.success) {
        toast({
          title: 'Aposta Realizada!',
          description: `Você apostou ${amount} FielCoins em "${betSelection.label}".`,
        });
        setBetSelection(null);
        setBetAmount('');
        // Atualiza o saldo no estado da sessão local
        if (result.newBalance !== undefined) {
          setSession(prev => prev ? { ...prev, fielcoins: result.newBalance } : null);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Apostar',
        description: error.message || 'Não foi possível completar a aposta.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!nextGame) {
    return null;
  }
  
  const gameDate = new Date(nextGame.date);

  if (loadingOdds || loadingUser) {
    return <BettingSkeleton />;
  }

  if (!session) {
    return (
        <Card className="bg-gray-900/50 border border-white/10 text-white">
            <CardHeader>
                <CardTitle className="font-headline text-xl tracking-wider">Faça Login para Apostar</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-gray-400 mb-4">Você precisa estar conectado para participar das apostas.</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                    <a href="/api/auth/login">Entrar com Discord</a>
                </Button>
            </CardContent>
        </Card>
    )
  }
  
  if (error || !odds) {
      return (
         <Card className="bg-gray-900/50 border border-white/10 text-white">
            <CardHeader>
                <CardTitle className="font-headline text-xl tracking-wider">Apostas Indisponíveis</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-red-400">{error || "Não foi possível carregar as odds."}</p>
                <p className="text-xs text-gray-400 mt-2">As cotações para esta partida podem não estar disponíveis ainda. Tente novamente mais tarde.</p>
            </CardContent>
        </Card>
      )
  }

  const bettingButtonProps = (label: string, odd: number | null, type: string, value: string) => ({
    label,
    odd,
    disabled: bettingClosed || !odd,
    onClick: () => {
      if (!bettingClosed && odd) {
        setBetSelection({ label, odd, type, value });
      }
    }
  });
  
  const hasMatchWinnerOdds = odds.winHome !== null || odds.winDraw !== null || odds.winAway !== null;
  const hasBttsOdds = odds.bttsYes !== null || odds.bttsNo !== null;
  const hasOverUnderOdds = odds.over2_5 !== null || odds.under2_5 !== null;
  const hasDoubleChanceOdds = odds.doubleChanceHomeDraw !== null || odds.doubleChanceHomeAway !== null || odds.doubleChanceDrawAway !== null;


  return (
    <Dialog open={!!betSelection} onOpenChange={(isOpen) => !isOpen && setBetSelection(null)}>
        <div className="space-y-6 animate-float">
            <Card className="bg-black/40 border border-white/10 text-white overflow-hidden">
                <CardHeader className="p-4 bg-black/30">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-sm text-gray-300">
                            <Image src={nextGame.league.logo} alt={nextGame.league.name} width={20} height={20} />
                            <span className="font-semibold truncate">{nextGame.league.name}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 border border-white/10 text-sm">
                            <Gem className="h-4 w-4 text-primary" />
                            <span className="font-bold text-white whitespace-nowrap">
                                FC$ {session.fielcoins?.toLocaleString('pt-BR') ?? '0'}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-3 items-center w-full gap-4">
                        <div className="flex flex-col items-center text-center">
                            <Image src={nextGame.homeTeam.logo} alt={nextGame.homeTeam.name} width={64} height={64} className="mb-2 h-16 w-16 object-contain"/>
                            <p className="text-base font-bold truncate">{nextGame.homeTeam.name}</p>
                        </div>
                        <div className="text-center">
                            <p className="font-headline text-4xl tracking-wider">{format(gameDate, 'HH:mm')}</p>
                            <p className="text-sm text-gray-400 capitalize">{format(gameDate, 'E, d MMM', { locale: ptBR })}</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <Image src={nextGame.awayTeam.logo} alt={nextGame.awayTeam.name} width={64} height={64} className="mb-2 h-16 w-16 object-contain"/>
                            <p className="text-base font-bold truncate">{nextGame.awayTeam.name}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {bettingClosed && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-3 rounded-md text-center text-sm flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" /> Apostas encerradas para esta partida!
                </div>
            )}

            <Accordion type="multiple" defaultValue={['resultado', 'gols']} className="w-full space-y-4">
                {hasMatchWinnerOdds && (
                    <AccordionItem value="resultado" className="bg-gray-900/50 border border-white/10 rounded-lg px-4">
                        <AccordionTrigger className="font-headline text-lg text-white hover:no-underline">Resultado Final</AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <BettingButton {...bettingButtonProps(nextGame.homeTeam.name, odds.winHome, 'match_winner', 'home')} />
                                <BettingButton {...bettingButtonProps('Empate', odds.winDraw, 'match_winner', 'draw')} />
                                <BettingButton {...bettingButtonProps(nextGame.awayTeam.name, odds.winAway, 'match_winner', 'away')} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}
                
                {hasDoubleChanceOdds && (
                    <AccordionItem value="chance_dupla" className="bg-gray-900/50 border border-white/10 rounded-lg px-4">
                        <AccordionTrigger className="font-headline text-lg text-white hover:no-underline">Chance Dupla</AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <BettingButton {...bettingButtonProps('Casa ou Empate', odds.doubleChanceHomeDraw, 'double_chance', 'home_draw')} />
                                <BettingButton {...bettingButtonProps('Casa ou Fora', odds.doubleChanceHomeAway, 'double_chance', 'home_away')} />
                                <BettingButton {...bettingButtonProps('Empate ou Fora', odds.doubleChanceDrawAway, 'double_chance', 'draw_away')} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {hasBttsOdds && (
                    <AccordionItem value="ambas_marcam" className="bg-gray-900/50 border border-white/10 rounded-lg px-4">
                        <AccordionTrigger className="font-headline text-lg text-white hover:no-underline">Ambas as Equipes Marcam</AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <BettingButton {...bettingButtonProps('Sim', odds.bttsYes, 'btts', 'yes')} />
                                <BettingButton {...bettingButtonProps('Não', odds.bttsNo, 'btts', 'no')} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {hasOverUnderOdds && (
                    <AccordionItem value="gols" className="bg-gray-900/50 border border-white/10 rounded-lg px-4">
                        <AccordionTrigger className="font-headline text-lg text-white hover:no-underline">Total de Gols (Mais/Menos de 2.5)</AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <BettingButton {...bettingButtonProps('Mais de 2.5', odds.over2_5, 'over_under', 'over_2.5')} />
                                <BettingButton {...bettingButtonProps('Menos de 2.5', odds.under2_5, 'over_under', 'under_2.5')} />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}
            </Accordion>

            <p className="text-xs text-center text-gray-500">
                Odds da Betano. Atualizado em: {new Date(odds.lastUpdate).toLocaleString('pt-BR')}
            </p>
        </div>

        <DialogContent className="bg-gray-900 border-white/10 text-white">
            <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-primary">Confirmar Aposta</DialogTitle>
            </DialogHeader>
            {betSelection && (
                <div className="space-y-4">
                    <div className="bg-black/30 p-4 rounded-md">
                        <p className="text-gray-400">Sua seleção:</p>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-lg font-semibold text-white">{betSelection.label}</p>
                            <p className="text-lg font-bold text-primary">{betSelection.odd.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="betAmount" className="text-gray-300">Valor da Aposta (FC$)</Label>
                        <Input
                            id="betAmount"
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            placeholder="Ex: 100"
                            className="bg-black/30 border-white/20 text-white"
                        />
                    </div>
                    
                    <div className="bg-black/30 p-3 rounded-md text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Saldo Atual:</span>
                            <span className="text-white">FC$ {session?.fielcoins?.toLocaleString('pt-BR') ?? '0'}</span>
                        </div>
                         <div className="flex justify-between mt-2">
                            <span className="text-gray-400">Possível Retorno:</span>
                            <span className="text-green-400 font-bold">
                                FC$ {(Number(betAmount) * betSelection.odd).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
                </DialogClose>
                <Button onClick={handlePlaceBet} disabled={isSubmitting || !betAmount} className="bg-primary hover:bg-primary/90">
                    {isSubmitting ? 'Apostando...' : 'Confirmar Aposta'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}

type BettingButtonProps = {
    label: string;
    odd: number | null;
    disabled: boolean;
    onClick: () => void;
};

function BettingButton({ label, odd, disabled, onClick }: BettingButtonProps) {
    if (odd === null) return null;

    return (
        <DialogTrigger asChild>
            <Button
                variant="outline"
                className="flex justify-between items-center h-auto p-3 border-primary/30 hover:bg-primary/10 text-white w-full text-base disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
                onClick={onClick}
            >
                <span className="text-sm text-gray-200 truncate">{label}</span>
                <span className="font-bold text-lg text-primary bg-black/50 px-3 py-1 rounded">{odd.toFixed(2)}</span>
            </Button>
        </DialogTrigger>
    );
}

function BettingSkeleton() {
    return (
       <div className="space-y-6">
            <Card className="bg-black/40 border border-white/10 text-white">
                <CardHeader className="p-4 bg-black/30">
                     <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-3 items-center w-full gap-4">
                         <div className="flex flex-col items-center text-center gap-2">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="text-center space-y-2">
                             <Skeleton className="h-10 w-24 mx-auto" />
                             <Skeleton className="h-4 w-20 mx-auto" />
                        </div>
                        <div className="flex flex-col items-center text-center gap-2">
                             <Skeleton className="h-16 w-16 rounded-full" />
                             <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                </CardContent>
            </Card>
             <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                     <Card key={i} className="bg-gray-900/50 border border-white/10 p-4">
                        <Skeleton className="h-7 w-1/2 mb-4" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             <Skeleton className="h-14 w-full" />
                             <Skeleton className="h-14 w-full" />
                        </div>
                    </Card>
                ))}
            </div>
       </div>
    )
}

    