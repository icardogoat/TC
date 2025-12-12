import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart2, Star, Shield, Palette, Bell, Calendar, Film } from "lucide-react";

const features = [
    {
        icon: Star,
        title: "Sistema de Níveis e Recompensas",
        description: "Ganhe XP por atividade no chat, suba de nível e desbloqueie cargos personalizados e recompensas exclusivas."
    },
    {
        icon: Shield,
        title: "Painel VIP",
        description: "Acesse canais secretos e benefícios exclusivos como multiplicador de XP, apostas maiores e emojis personalizados."
    },
    {
        icon: BarChart2,
        title: "Ranking e Conquistas",
        description: "Compita no ranking de jogadores, ganhe conquistas por participação em eventos e mostre quem é o mais Fiel."
    },
    {
        icon: Palette,
        title: "Personalização",
        description: "Crie seu próprio time dentro do servidor, escolha cores, brasões e emblemas com o estilo do Corinthians."
    },
    {
        icon: Bell,
        title: "Alertas Automáticos",
        description: "Receba notificações de gols do Corinthians em tempo real, além de alertas sobre jogos, mercado da bola e treinos."
    },
    {
        icon: Calendar,
        title: "Calendário de Eventos",
        description: "Participe de torneios agendados, dias de sorteio e rodadas temáticas para se divertir com a comunidade."
    },
    {
        icon: Film,
        title: "Conteúdo Exclusivo",
        description: "Acesse vídeos, podcasts e entrevistas sobre o Timão, além de clipes de jogos, bastidores e memes."
    }
];


export function DiscordFeatures() {
  return (
    <section className="bg-black/20 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-headline text-4xl md:text-5xl tracking-wider text-white">
            O que você encontra em nosso Discord?
          </h2>
          <p className="text-lg text-gray-300 mt-4 max-w-3xl mx-auto">
            No servidor do Discord TimãoCord você encontra jogos, dados, estatísticas, eventos (inclusive valendo Pix), interações, suporte super rápido e notícias atualizadas!
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gray-900/50 border-white/10 text-white flex flex-col items-center text-center p-6 transform transition-all duration-300 hover:scale-105 hover:bg-primary/20 hover:border-primary/50">
              <CardHeader className="p-0">
                <div className="bg-black/50 rounded-full p-4 mb-4 inline-block">
                    <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl tracking-wide">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-4">
                <p className="text-gray-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
