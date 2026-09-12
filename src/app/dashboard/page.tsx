"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/predictions', label: 'Make predictions' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/profile', label: 'Profile' },
  { href: '/leagues', label: 'Leagues' },
  { href: '/how-it-works', label: 'How to Play' },
];

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };
    getUser();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-blue-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 md:px-8 text-slate-100">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 w-full max-w-5xl">
        <div className="flex-1 flex justify-center w-full">
          <Image
            src="/images/logo.png"
            alt="Scorecast XI"
            width={443}
            height={319}
            style={{ width: '100%', maxWidth: '360px', height: 'auto' }}
            className="md:!max-w-[480px]"
            priority
          />
        </div>

        <div className="w-full max-w-sm md:w-80 flex-shrink-0 rounded-2xl p-6 md:p-8 flex flex-col gap-3 bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-2xl">
          <span className="text-sm text-slate-300 break-all mb-2 text-center md:text-left">
            {user?.email}
          </span>

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block w-full px-4 py-3 rounded-xl text-sm font-bold text-center border border-white/10 bg-white/5 text-slate-100 hover:border-blue-400/50 hover:bg-white/10 transition-all shadow-sm"
            >
              {link.label}
            </Link>
          ))}

          <button
            onClick={handleSignOut}
            className="w-full mt-3 px-4 py-2.5 text-sm rounded-lg transition-all border border-white/5 bg-slate-800/50 text-slate-300 hover:bg-slate-700/60 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
