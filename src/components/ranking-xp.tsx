
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star } from "lucide-react";
import type { RankedPlayer } from "@/lib/types";

function RankingList({ players }: { players: RankedPlayer[] }) {
   if (!players || players.length === 0) {
    return <p className="text-sm text-center text-gray-400 py-4">Nenhum jogador no ranking ainda.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {players.slice(0, 5).map((player, index) => (
        <div
          key={player.rank}
          className={`flex items-center gap-3 rounded-md p-2 transition-colors ${
            index === 0 ? "bg-primary/10" : ""
          }`}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-sm font-bold text-white">
            {player.rank}
          </div>
          <div className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white/10">
            <Image
              src={player.avatarUrl}
              alt={player.name}
              width={36}
              height={36}
              data-ai-hint={player.imageHint}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{player.name}</p>
            <p className="text-xs text-gray-400">{player.points.toLocaleString('pt-BR')} XP</p>
          </div>
        </div>
      ))}
    </div>
  );
}


export function RankingXp({ players }: { players?: RankedPlayer[] }) {
  return (
    <Card className="flex flex-col rounded-lg border border-white/10 bg-gray-900/50 p-2 shadow-lg">
       <CardHeader className="p-4">
        <CardTitle className="font-headline text-xl tracking-wider text-white flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" />
          Ranking de Experiência (XP)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
         <RankingList players={players || []} />
      </CardContent>
    </Card>
  );
}
