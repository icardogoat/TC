'use client';

import Link from "next/link";
import { Instagram, Twitter, Youtube } from "lucide-react";
import { TiktokIcon } from "@/components/icons/tiktok-icon";
import { DiscordIcon } from "../icons/discord-icon";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type HighestRole = {
  name: string;
  color: string;
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [user, setUser] = useState<User | null>(null);
  const [highestRole, setHighestRole] = useState<HighestRole | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.isLoggedIn) {
          setUser(data);
          const roleRes = await fetch(`/api/discord-user-roles?userId=${data.id}`);
          const roleData = await roleRes.json();
          if (roleData.highestRole) {
            setHighestRole(roleData.highestRole);
          }
        }
      } catch (error) {
        // Fail silently
      }
    }
    fetchUser();
  }, []);

  const AuthorDisplay = () => {
    if (user) {
      return (
        <div className="flex items-center gap-2">
            <Avatar 
                className="h-7 w-7 border-2"
                style={{ borderColor: highestRole?.color || 'hsl(var(--primary))' }}
            >
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>By {user.username}</span>
        </div>
      )
    }
    return <p>By Icardogoat</p>;
  }

  return (
    <footer className="w-full border-t border-white/10 bg-transparent py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center text-sm text-gray-400 md:text-left">
            <p>
              &copy; {currentYear} TimãoCord. Todos os direitos reservados.
            </p>
             <AuthorDisplay />
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-gray-400 hover:text-white">
              <TiktokIcon className="h-6 w-6" />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              <Instagram className="h-6 w-6" />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              <Twitter className="h-6 w-6" />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              <DiscordIcon className="h-6 w-6" />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white">
              <Youtube className="h-6 w-6" />
            </Link>
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-6">
           <div className="flex flex-col items-center justify-center gap-4 text-sm text-gray-400 md:flex-row md:gap-6">
            <Link href="#" className="hover:text-white">Termos de Serviço</Link>
            <span className="hidden md:inline">•</span>
            <Link href="#" className="hover:text-white">Política de Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
