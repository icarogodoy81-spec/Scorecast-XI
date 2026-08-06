"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const THEME = {
  darkBlue: '#0f172a',
  darkBlue2: '#111c34',
  darkBlue3: '#172554',
  border: '#243b63',
  text: '#f8fafc',
  mutedText: '#cbd5e1',
};

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
      <div style={{ background: THEME.darkBlue, minHeight: '100vh' }} className="flex items-center justify-center">
        <div style={{ color: '#93c5fd' }} className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{ background: THEME.darkBlue, minHeight: '100vh', color: THEME.text }}
      className="flex items-center justify-center px-4 py-8 md:px-8"
    >
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

        <div
          style={{
            background: THEME.darkBlue2,
            border: `1px solid ${THEME.border}`,
          }}
          className="w-full max-w-sm md:w-80 flex-shrink-0 rounded-2xl p-6 md:p-8 flex flex-col gap-3"
        >
          <span style={{ color: THEME.mutedText }} className="text-sm break-all mb-2 text-center md:text-left">
            {user?.email}
          </span>

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                background: THEME.darkBlue3,
                border: `1px solid ${THEME.border}`,
                color: THEME.text,
              }}
              className="block w-full px-4 py-3 rounded-xl text-sm font-bold text-center hover:border-blue-400 hover:bg-blue-900/40 transition"
            >
              {link.label}
            </Link>
          ))}

          <button
            onClick={handleSignOut}
            style={{ background: 'rgba(30,64,175,0.3)', border: `1px solid ${THEME.border}`, color: THEME.text }}
            className="w-full mt-3 px-4 py-2.5 text-sm rounded-lg transition hover:bg-blue-800/40"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
