'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { useEffect, useState } from "react";
import type { NewsArticle } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";

type NewsFeedProps = {
  initialLimit?: number;
  showViewAll?: boolean;
  showTitle?: boolean;
};

const LOAD_MORE_COUNT = 4;

export function NewsFeed({ initialLimit = 5, showViewAll = false, showTitle = true }: NewsFeedProps) {
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);
  const [displayedCount, setDisplayedCount] = useState(initialLimit);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/discord-news');
        const data = await res.json();
        if (data.articles) {
          setAllArticles(data.articles);
        }
      } catch (error) {
        console.error("Failed to fetch news", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const handleLoadMore = () => {
    setDisplayedCount(prevCount => prevCount + LOAD_MORE_COUNT);
  };
  
  const displayedArticles = allArticles.slice(0, displayedCount);
  const featuredArticle = displayedArticles[0];
  const otherArticles = displayedArticles.slice(1);
  const hasMoreArticles = displayedCount < allArticles.length;

  if (loading) {
    return <NewsFeedSkeleton showTitle={showTitle} />;
  }

  if (allArticles.length === 0) {
    return (
        <div className="space-y-8">
        {showTitle && (
            <div>
                <h2 className="font-headline text-4xl tracking-wider text-white">
                ÚLTIMAS NOTÍCIAS
                </h2>
            </div>
        )}
        <p className="text-gray-300">Nenhuma notícia encontrada no momento.</p>
        </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-4xl tracking-wider text-white">
            ÚLTIMAS NOTÍCIAS
          </h2>
          {showViewAll && (
              <Button asChild size="sm" variant="link" className="hidden md:inline-flex text-primary hover:text-primary/80">
                  <Link href="/noticias">
                      Ver todas
                      <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
              </Button>
          )}
        </div>
      )}
      
      <div className="space-y-8">
        {featuredArticle && (
            <Card className="flex flex-col md:flex-row overflow-hidden rounded-lg border-white/10 bg-gray-900/50 shadow-lg transition-transform hover:scale-[1.02]">
                <Link href={featuredArticle.link} className="group/link flex flex-col md:flex-row w-full">
                    <div className="relative w-full md:w-1/2 aspect-video">
                        <Image
                        src={featuredArticle.imageUrl}
                        alt={featuredArticle.title}
                        fill
                        className="object-cover"
                        data-ai-hint={featuredArticle.imageHint}
                        priority
                        />
                    </div>
                    <div className="flex flex-1 flex-col p-6 w-full md:w-1/2">
                        <Badge variant="outline" className="mb-3 w-fit border-primary text-primary">
                            {featuredArticle.category}
                        </Badge>
                        <h3 className="font-headline text-2xl md:text-3xl leading-tight text-white group-hover/link:text-primary transition-colors">
                            {featuredArticle.title}
                        </h3>
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{featuredArticle.publishedAt}</span>
                        </div>
                        <p className="mt-4 flex-1 text-sm text-gray-400">
                            {featuredArticle.snippet}
                        </p>
                        <div className="mt-4 self-start text-sm font-semibold text-primary group-hover/link:underline flex items-center">
                            Leia mais <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                    </div>
                </Link>
            </Card>
        )}

        {otherArticles.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {otherArticles.map((article) => (
                    <Card key={article.id} className="flex h-full flex-col overflow-hidden rounded-lg border-white/10 bg-gray-900/50 shadow-lg transition-transform hover:scale-105">
                        <Link href={article.link} className="flex flex-1 flex-col group/link">
                        <div className="relative aspect-video w-full">
                            <Image
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-cover"
                            data-ai-hint={article.imageHint}
                            />
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                            <Badge variant="outline" className="mb-2 w-fit border-primary/80 text-primary/80 text-xs">
                                {article.category}
                            </Badge>
                            <h3 className="font-headline text-xl leading-tight text-white group-hover/link:text-primary transition-colors">
                            {article.title}
                            </h3>
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{article.publishedAt}</span>
                        </div>
                            <p className="mt-3 flex-1 text-sm text-gray-400 line-clamp-2">
                            {article.snippet}
                            </p>
                            <div className="mt-3 self-start text-sm font-semibold text-primary/90 group-hover/link:text-primary flex items-center">
                                Leia mais <ArrowRight className="ml-1 h-4 w-4" />
                            </div>
                        </div>
                        </Link>
                    </Card>
                ))}
            </div>
        )}
      </div>

      {hasMoreArticles && (
        <div className="text-center mt-8">
            <Button onClick={handleLoadMore} size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                Ver mais notícias
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      )}
      
       {showViewAll && (
        <div className="text-center mt-4 md:hidden">
            <Button asChild size="lg" variant="link" className="text-primary">
                <Link href="/noticias">
                    Ver todas as notícias
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      )}
    </div>
  );
}


function NewsFeedSkeleton({ showTitle = true }: { showTitle?: boolean }) {
    return (
      <div className="space-y-8">
        {showTitle && <Skeleton className="h-10 w-80" />}
        <div className="space-y-8">
            {/* Featured Skeleton */}
            <Card className="flex flex-col md:flex-row overflow-hidden rounded-lg border-white/10 bg-gray-900/50">
                <Skeleton className="w-full md:w-1/2 aspect-video" />
                <div className="flex flex-1 flex-col p-6 w-full md:w-1/2 space-y-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-7 w-4/5" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-5 w-36" />
                </div>
            </Card>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="flex h-full flex-col overflow-hidden rounded-lg border-white/10 bg-gray-900/50">
                <Skeleton className="aspect-video w-full" />
                <div className="flex flex-1 flex-col p-4 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-5 w-28" />
                </div>
                </Card>
            ))}
            </div>
        </div>
      </div>
    )
}
