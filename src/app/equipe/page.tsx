'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ParticleBackground } from "@/components/particle-background";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type TeamMember = {
    id: string;
    username: string;
    avatarUrl: string;
    highestRole: {
        name: string;
        color: string;
    }
};

function MemberCard({ member }: { member: TeamMember }) {
    return (
        <Card 
            className="bg-gray-900/50 border-white/10 text-white flex flex-col items-center p-6 text-center transform transition-all duration-300 hover:scale-105"
            style={{ borderColor: `${member.highestRole.color}40`, boxShadow: `0 0 15px ${member.highestRole.color}20` }}
        >
            <Avatar className="w-24 h-24 mb-4 border-4" style={{ borderColor: member.highestRole.color }}>
                <AvatarImage src={member.avatarUrl} alt={member.username} />
                <AvatarFallback>{member.username.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold text-white truncate w-full">{member.username}</h3>
            <div 
                className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold"
                style={{ backgroundColor: `${member.highestRole.color}20`, color: member.highestRole.color, border: `1px solid ${member.highestRole.color}80` }}
            >
                <Shield className="h-4 w-4" />
                {member.highestRole.name}
            </div>
        </Card>
    );
}

function MemberCardSkeleton() {
    return (
        <div className="bg-gray-900/50 border-white/10 p-6 rounded-lg flex flex-col items-center">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-7 w-1/2" />
        </div>
    )
}

export default function EquipePage() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchTeam() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/equipe');
                const data = await res.json();
                if (res.ok) {
                    setTeam(data.team);
                } else {
                    throw new Error(data.error || 'Falha ao buscar a equipe.');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchTeam();
    }, []);

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
                                    <User className="h-8 w-8 text-primary" />
                                    Nossa Equipe
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <div className="max-w-6xl mx-auto">
                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {[...Array(8)].map((_, i) => <MemberCardSkeleton key={i} />)}
                                </div>
                            ) : error ? (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Erro ao Carregar Equipe</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            ) : team.length === 0 ? (
                                <p className="text-center text-gray-400">Nenhum membro da equipe encontrado.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {team.map(member => <MemberCard key={member.id} member={member} />)}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}
