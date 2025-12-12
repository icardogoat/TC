
'use server';

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ParticleBackground } from "@/components/particle-background";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Award } from "lucide-react";

export default async function ConquistasPage() {
  return (
    <>
      <ParticleBackground />
      <div className="flex min-h-screen flex-col bg-transparent">
        <Header />
        <main className="flex-1 pt-20">
          <div className="container mx-auto px-4 py-12 md:py-20">
             <Card className="bg-gray-900/50 border border-white/10 text-white max-w-4xl mx-auto mb-8">
                <CardHeader>
                    <CardTitle className="font-headline text-3xl md:text-4xl tracking-wider text-white flex items-center gap-3">
                        <Award className="h-8 w-8 text-primary" />
                        Minhas Conquistas
                    </CardTitle>
                </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border border-white/10 text-white max-w-4xl mx-auto">
                <CardContent className="p-10 text-center">
                    <p className="text-2xl font-headline text-gray-300">Em Breve...</p>
                    <p className="text-gray-400 mt-2">Estamos preparando uma galeria incrível para você exibir todas as suas conquistas na comunidade. Volte em breve!</p>
                </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
