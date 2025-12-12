
'use client';

import Link from "next/link";
import Image from "next/image";
import { Newspaper, Gamepad2, Award, Gem, BarChart, Settings, Menu, LogIn, LogOut, Bell, Trophy, HandCoins, Shield, Store, User as UserIcon, ChevronDown } from "lucide-react";
import type { NavLink, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import { Separator } from "../ui/separator";

type HighestRole = {
  name: string;
  color: string;
};

const mainNavLinks: NavLink[] = [
  { name: "Notícias", href: "/noticias", icon: Newspaper },
  { name: "Jogos", href: "/jogos", icon: Gamepad2 },
  { name: "Apostas", href: "/aposta", icon: Gem },
  { name: "Rank", href: "/ranking", icon: BarChart },
];

const otherNavLinks: NavLink[] = [
    { name: "Equipe", href: "/equipe", icon: Shield },
    { name: "Conquistas", href: "/conquistas", icon: Award },
    { name: "Sócios", href: "/socios", icon: Store },
];

const allNavLinks: NavLink[] = [...mainNavLinks, ...otherNavLinks];


export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [highestRole, setHighestRole] = useState<HighestRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserAndRole() {
      try {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        
        if (userData.isLoggedIn) {
          setUser(userData);
          const roleRes = await fetch(`/api/discord-user-roles?userId=${userData.id}`);
          const roleData = await roleRes.json();
          if (roleData.highestRole) {
            setHighestRole(roleData.highestRole);
          }
        }
      } catch (error) {
        // Fail silently
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserAndRole();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setHighestRole(null);
    router.push('/');
    router.refresh();
  };
  
  const FielcoinsDisplay = ({ mobile }: { mobile?: boolean }) => {
    if (!user || user.fielcoins === undefined) return null;
    
    return (
       <div className={`flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 border border-white/10 text-sm ${mobile ? 'w-fit' : ''}`}>
        <Gem className="h-4 w-4 text-primary" />
        <span className="font-bold text-white whitespace-nowrap">
            FC$ {user.fielcoins.toLocaleString('pt-BR')}
        </span>
       </div>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Left Side: Mobile Menu & Desktop Logo */}
        <div className="flex flex-1 items-center justify-start">
          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-8 w-8" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-black border-r-white/10 flex flex-col">
               <SheetHeader className="sr-only">
                <SheetTitle>Menu de Navegação</SheetTitle>
                <SheetDescription>
                  Navegue pelas diferentes seções do site TimãoCord.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/" className="mb-4 flex items-center gap-3">
                  <Image src="https://i.imgur.com/AiSVUj8.png" alt="TimãoCord Icon" width={40} height={40} />
                  <Image src="https://i.imgur.com/PTgmxHS.png" alt="TimãoCord Logo" width={150} height={40} />
                </Link>
                <nav className="flex flex-col gap-4">
                  {allNavLinks.map((link) => (
                    <SheetClose asChild key={link.name}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-3 py-2 text-lg font-medium text-gray-300 transition-colors hover:text-white"
                      >
                        {link.icon && <link.icon className="h-5 w-5" />}
                        {link.name}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </div>

               <div className="mt-auto pt-6 pb-2">
                <Separator className="mb-6 bg-white/10" />
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ) : user && user.isLoggedIn ? (
                  <div className="space-y-4">
                    <FielcoinsDisplay mobile />
                    <Link href="/dashboard" className="flex items-center gap-3">
                       <Avatar 
                          className="h-10 w-10 border-2"
                          style={{ borderColor: highestRole?.color || 'hsl(var(--primary))' }}
                      >
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-white">{user.username}</p>
                        <p className="text-xs text-gray-400">Ver Perfil</p>
                      </div>
                    </Link>
                    <SheetClose asChild>
                      <Button variant="outline" className="w-full" onClick={handleLogout}>
                        <LogOut className="mr-2" /> Sair
                      </Button>
                    </SheetClose>
                  </div>
                ) : (
                  <SheetClose asChild>
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href="/api/auth/login">
                        <LogIn className="mr-2 h-5 w-5" />
                        Entrar com Discord
                      </Link>
                    </Button>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Desktop Logo */}
          <Link href="/" className="hidden lg:flex items-center gap-2">
            <Image src="https://i.imgur.com/AiSVUj8.png" alt="TimãoCord Icon" width={40} height={40} />
            <Image src="https://i.imgur.com/PTgmxHS.png" alt="TimãoCord Logo" width={150} height={40} className="object-contain" />
          </Link>
        </div>

        {/* Center: Desktop Navigation or Mobile Logo */}
        <div className="flex flex-1 items-center justify-center">
            <nav className="hidden items-center justify-center gap-6 lg:flex lg:gap-8">
                {mainNavLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gray-300 transition-colors hover:text-white"
                    >
                        {link.icon && <link.icon className="h-4 w-4" />}
                        {link.name}
                    </Link>
                ))}
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gray-300 transition-colors hover:text-white focus:outline-none">
                        Outros
                        <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {otherNavLinks.map((link) => (
                             <DropdownMenuItem key={link.name} asChild>
                                <Link href={link.href} className="flex items-center gap-2">
                                    {link.icon && <link.icon className="h-4 w-4" />}
                                    {link.name}
                                </Link>
                             </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </nav>
             <Link href="/" className="flex items-center gap-2 lg:hidden">
                <Image src="https://i.imgur.com/AiSVUj8.png" alt="TimãoCord Icon" width={32} height={32} />
                <Image src="https://i.imgur.com/PTgmxHS.png" alt="TimãoCord Logo" width={120} height={32} className="object-contain" />
            </Link>
        </div>


        {/* Right Side: User Actions */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {isLoading ? (
            <Skeleton className="h-10 w-48 rounded-md" />
          ) : user && user.isLoggedIn ? (
            <>
                <div className="hidden lg:flex">
                    <FielcoinsDisplay />
                </div>

                <Button variant="ghost" size="icon" className="hidden lg:inline-flex text-white/80 hover:text-white hover:bg-white/10">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notificações</span>
                </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full md:h-10 md:w-auto md:justify-start md:gap-2 md:px-2 hover:bg-white/10">
                    <Avatar 
                        className="h-9 w-9 border-2"
                        style={{ borderColor: highestRole?.color || 'hsl(var(--primary))' }}
                    >
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-white lg:inline">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.id}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Minhas Apostas</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </>
          ) : (
            <Button asChild className="hidden bg-primary hover:bg-primary/90 md:inline-flex">
              <Link href="/api/auth/login">
                <LogIn className="mr-2 h-5 w-5" />
                Entrar com Discord
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
