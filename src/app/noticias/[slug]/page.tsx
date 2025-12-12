'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ParticleBackground } from "@/components/particle-background";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, User as UserIcon } from "lucide-react";
import type { NewsArticle } from "@/lib/types";
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string; // Agora usamos 'slug' em vez de 'id'
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [otherArticles, setOtherArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    
    async function fetchArticle() {
      setLoading(true);
      setError(null);
      try {
        // A API agora é chamada com o slug
        const res = await fetch(`/api/discord-news/${slug}`);
        const data = await res.json();
        if (data.article) {
          setArticle(data.article);
          setOtherArticles(data.otherArticles || []);
        } else {
          setError(data.error || "Artigo não encontrado.");
        }
      } catch (error) {
        console.error("Failed to fetch article", error);
        setError("Falha ao carregar o artigo.");
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [slug]);

  if (loading) {
    return <ArticleSkeleton />;
  }

  if (error || !article) {
    return (
      <>
        <ParticleBackground />
        <div className="flex min-h-screen flex-col bg-transparent">
          <Header />
          <main className="flex-1 pt-20">
            <div className="container mx-auto px-4 py-12 md:py-20 text-center">
              <h1 className="font-headline text-4xl text-white">{error || 'Notícia não encontrada'}</h1>
              <p className="text-gray-300 mt-4">O artigo que você está procurando não existe ou foi removido.</p>
               <Button asChild variant="link" className="mt-8 text-primary">
                    <Link href="/noticias"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para notícias</Link>
                </Button>
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
          <div className="container mx-auto max-w-7xl px-4 py-12 md:py-20">
            <div className="mb-8">
              <Button asChild variant="link" className="p-0 text-primary">
                  <Link href="/noticias"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para todas as notícias</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12">
              <div className="lg:col-span-2">
                 <Card className="overflow-hidden rounded-lg border-white/10 bg-gray-900/50 shadow-lg">
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    width={1200}
                    height={600}
                    className="w-full h-auto max-h-[500px] object-cover"
                    data-ai-hint={article.imageHint}
                    priority
                  />
                  <CardContent className="p-6 md:p-8">
                    <Badge variant="outline" className="mb-4 w-fit border-primary text-primary">
                      {article.category}
                    </Badge>
                    <h1 className="font-headline text-4xl md:text-5xl leading-tight text-white">
                      {article.title}
                    </h1>
                    
                    <div className="my-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={article.authorAvatarUrl} alt={article.authorName} />
                            <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-300">{article.authorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{article.publishedAt}</span>
                      </div>
                    </div>

                    <div 
                      className="prose prose-invert prose-lg mt-8 max-w-none text-gray-300 prose-p:text-gray-300 prose-strong:text-white"
                      dangerouslySetInnerHTML={{ __html: article.content ? article.content.replace(/\n/g, '<br />') : '' }}
                    />
                  </CardContent>
                </Card>
              </div>

              <aside className="mt-12 lg:mt-0">
                <Card className="rounded-lg border-white/10 bg-gray-900/50 p-6 shadow-lg">
                   <CardHeader className="p-0 mb-4">
                     <CardTitle className="font-headline text-2xl tracking-wider text-white">
                        Outras Notícias
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="p-0">
                    <div className="flex flex-col gap-6">
                      {otherArticles.length > 0 ? (
                        otherArticles.map((other) => (
                           <Link key={other.id} href={`/noticias/${other.slug}`} className="group flex items-start gap-4">
                              <Image 
                                src={other.imageUrl}
                                alt={other.title}
                                width={100}
                                height={75}
                                className="h-auto w-24 rounded-md object-cover aspect-[4/3] transition-transform group-hover:scale-105"
                                data-ai-hint={other.imageHint}
                              />
                              <div className="flex-1">
                                <h3 className="text-base font-semibold leading-tight text-white group-hover:text-primary transition-colors">
                                  {other.title}
                                </h3>
                                <p className="mt-1 text-xs text-gray-400">{other.publishedAt}</p>
                              </div>
                           </Link>
                        ))
                      ) : (
                         <p className="text-sm text-gray-400">Nenhuma outra notícia disponível.</p>
                      )}
                    </div>
                   </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}


function ArticleSkeleton() {
    return (
     <>
      <ParticleBackground />
      <div className="flex min-h-screen flex-col bg-transparent">
        <Header />
        <main className="flex-1 pt-20">
          <div className="container mx-auto max-w-7xl px-4 py-12 md:py-20">
             <div className="mb-8">
                <Skeleton className="h-6 w-56" />
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-12">
                 <div className="lg:col-span-2">
                    <Card className="overflow-hidden rounded-lg border-white/10 bg-gray-900/50 shadow-lg">
                      <Skeleton className="h-[500px] w-full" />
                      <CardContent className="p-6 md:p-8">
                        <Skeleton className="h-6 w-24 mb-4" />
                        <Skeleton className="h-12 w-full mb-2" />
                        <Skeleton className="h-10 w-4/5 mb-6" />
                         <div className="flex items-center gap-6 mb-8">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-8 w-40" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-[80%]" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-[90%]" />
                        </div>
                      </CardContent>
                    </Card>
                 </div>
                 <aside className="mt-12 lg:mt-0">
                     <Card className="rounded-lg border-white/10 bg-gray-900/50 p-6 shadow-lg">
                        <Skeleton className="h-8 w-48 mb-6" />
                        <div className="flex flex-col gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <Skeleton className="h-[75px] w-[100px] rounded-md" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                     </Card>
                 </aside>
             </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
    )
}
