'use server';

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ParticleBackground } from "@/components/particle-background";
import { GamesSection } from "@/components/games-section";

export default async function JogosPage() {
  return (
    <>
      <ParticleBackground />
      <div className="flex min-h-screen flex-col bg-transparent">
        <Header />
        <main className="flex-1 pt-20">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <GamesSection />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
