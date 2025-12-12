
'use client';

import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ParticleBackground } from "@/components/particle-background";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, BarChart, Gem, Trophy, PartyPopper, Hand, Shield, Gamepad2, History, Store } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { upsertUserAndCheckIfNew, getUserStats } from "@/server/actions";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BetHistory } from "@/components/bet-history";

type HighestRole = {
  name: string;
  color: string;
}

type UserStats = {
    xpRank: number | null;
    betsWon: number;
    achievements: number;
    tournaments: number;
}

export default function DashboardPage() {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [highestRole, setHighestRole] = useState<HighestRole | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.isLoggedIn) {
          setSession(data);
        } else {
          redirect("/");
        }
      } catch (error) {
        redirect("/");
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, []);

  useEffect(() => {
    if (!session) return;

    async function fetchUserData() {
      const { isNewUser } = await upsertUserAndCheckIfNew(session);
      setIsNewUser(isNewUser);

      try {
        setLoadingRole(true);
        const roleRes = await fetch(`/api/discord-user-roles?userId=${session.id}`);
        const roleData = await roleRes.json();
        if (roleData.highestRole) {
          setHighestRole(roleData.highestRole);
        }
      } catch (error) {
        console.error("Could not fetch user role", error);
      } finally {
        setLoadingRole(false);
      }
      
      try {
        setLoadingStats(true);
        const userStats = await getUserStats(session.id);
        setStats(userStats);
      } catch(error) {
        console.error("Could not fetch user stats", error);
        setStats({ xpRank: null, betsWon: 0, achievements: 0, tournaments: 0 });
      } finally {
        setLoadingStats(false);
      }
    }
    
    fetchUserData();
  }, [session]);

  const statsCards = [
    { title: "Ranking (XP)", value: stats?.xpRank ? `#${stats.xpRank}` : "-", icon: BarChart, loading: loadingStats },
    { title: "Apostas ganhas", value: stats?.betsWon ?? "0", icon: Gem, loading: loadingStats },
    { title: "Conquistas", value: stats?.achievements ?? "0", icon: Award, loading: loadingStats },
    { title: "Torneios", value: stats?.tournaments ?? "0", icon: Trophy, loading: loadingStats },
  ];
  
  const WelcomeMessage = () => {
    if (isNewUser === null) {
      return <Skeleton className="h-12 w-96" />;
    }
    
    if (isNewUser) {
      return (
        <div className="flex items-start gap-3 text-lg text-gray-300 bg-primary/10 border border-primary/30 p-3 rounded-md">
          <PartyPopper className="h-7 w-7 text-primary flex-shrink-0" />
          <div>
            <p className="font-bold text-white">Seja bem-vindo ao TimãoCord!</p>
            <p className="text-sm">Como presente de boas-vindas, você ganhou <span className="font-bold text-primary">1.000 FielCoins</span> para começar!</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-lg text-gray-300">
        <Hand className="h-6 w-6 text-primary" />
        Que bom te ver de volta!
      </div>
    );
  }
  
  const HighestRoleDisplay = () => {
    if (loadingRole) {
      return <Skeleton className="mt-4 h-8 w-40" />;
    }
    if (!highestRole) {
      return null;
    }
    return (
       <div 
        className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold"
        style={{ backgroundColor: `${highestRole.color}20`, color: highestRole.color, border: `1px solid ${highestRole.color}80` }}
      >
        <Shield className="h-4 w-4" />
        {highestRole.name}
      </div>
    )
  }

  if (loading || !session) {
    return (
      <>
        <ParticleBackground />
        <div className="flex min-h-screen flex-col bg-transparent">
          <Header />
          <main className="flex-1 pt-20">
            <div className="container mx-auto px-4 py-12 md:py-20">
              <div className="text-center text-white">Carregando...</div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <ParticleBackground />
      <div className="flex min-h-screen flex-col bg-transparent">
        <Header />
        <main className="flex-1 pt-20">
          <div className="container mx-auto px-4 py-12 md:py-20">
             <Card className="bg-gray-900/50 border border-white/10 text-white max-w-4xl mx-auto mb-8">
              <CardContent className="p-6 md:p-10">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                  <Avatar 
                    className="h-24 w-24 md:h-32 md:w-32 border-4"
                    style={{ borderColor: highestRole?.color || 'hsl(var(--primary))' }}
                  >
                    <AvatarImage src={session.avatar} alt={session.username} />
                    <AvatarFallback>{session.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center md:text-left">
                    <h1 className="font-headline text-4xl md:text-5xl tracking-wider">
                      {session.username}
                    </h1>
                     <p className="text-gray-400 text-sm mt-1">ID Discord: {session.id}</p>
                     <HighestRoleDisplay />
                    <div className="mt-4">
                        <WelcomeMessage />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="md:col-span-2 space-y-8">
                    <Card className="bg-gray-900/50 border border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl tracking-wider">Central de Apostas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-400 mb-4">Tem um palpite para o próximo jogo do Timão? Acesse a central e mostre seu conhecimento!</p>
                            <Button asChild className="bg-primary hover:bg-primary/90">
                                <Link href="/aposta">
                                    <Gamepad2 className="mr-2 h-4 w-4" />
                                    Ir para Apostas
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                     <BetHistory />
                </div>
                <div className="space-y-8">
                     <Card className="bg-gray-900/50 border border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl tracking-wider">Suas Estatísticas</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4 text-center">
                             {statsCards.map((stat) => (
                                <div key={stat.title} className="bg-black/40 p-3 rounded-lg flex flex-col items-center justify-center">
                                    <stat.icon className="h-7 w-7 text-primary mb-1" />
                                    <p className="text-xs text-gray-400">{stat.title}</p>
                                    {stat.loading ? (
                                        <Skeleton className="h-7 w-12 mt-1" />
                                    ) : (
                                        <p className="text-xl font-bold">{stat.value}</p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                     <Card className="bg-gray-900/50 border border-white/10 text-white">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl tracking-wider">Navegação Rápida</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <Button asChild variant="outline" className="justify-start">
                                <Link href="/conquistas"><Award className="mr-2" /> Minhas Conquistas</Link>
                            </Button>
                            <Button asChild variant="outline" className="justify-start">
                                <Link href="/ranking"><BarChart className="mr-2" /> Ver Rankings</Link>
                            </Button>
                            <Button asChild variant="outline" className="justify-start">
                                <Link href="/socios"><Store className="mr-2" /> Loja de Sócios</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

    