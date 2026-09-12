import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen text-slate-100 p-6 md:p-10 flex flex-col items-center">
      <section className="w-full max-w-3xl bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl mt-4 md:mt-10">
        <header className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8">
          <div className="shrink-0">
            <Image 
              src="/images/logo.png" 
              alt="Scorecast XI" 
              width={443} 
              height={319} 
              className="w-48 h-auto" 
              priority 
            />
          </div>
          <p className="text-blue-200 text-sm font-medium text-center md:text-left">
            Keep your Scorecast XI identity tidy.
          </p>
        </header>

        <nav className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center justify-center min-w-[130px] px-5 py-3 rounded-xl bg-slate-900/60 border border-blue-300/30 text-white text-sm font-bold hover:border-blue-400 hover:ring-2 hover:ring-blue-400/20 transition-all shadow-sm"
          >
            Dashboard
          </Link>
          <Link 
            href="/predictions" 
            className="inline-flex items-center justify-center min-w-[130px] px-5 py-3 rounded-xl bg-slate-900/60 border border-blue-300/30 text-white text-sm font-bold hover:border-blue-400 hover:ring-2 hover:ring-blue-400/20 transition-all shadow-sm"
          >
            Make predictions
          </Link>
          <Link 
            href="/leaderboard" 
            className="inline-flex items-center justify-center min-w-[130px] px-5 py-3 rounded-xl bg-slate-900/60 border border-blue-300/30 text-white text-sm font-bold hover:border-blue-400 hover:ring-2 hover:ring-blue-400/20 transition-all shadow-sm"
          >
            Leaderboard
          </Link>
          <Link 
            href="/profile" 
            className="inline-flex items-center justify-center min-w-[130px] px-5 py-3 rounded-xl bg-slate-900/60 border border-blue-300/30 text-white text-sm font-bold hover:border-blue-400 hover:ring-2 hover:ring-blue-400/20 transition-all shadow-sm"
          >
            Profile
          </Link>
        </nav>

        <div className="bg-slate-900/60 border border-blue-300/30 rounded-2xl p-6 md:p-8 shadow-inner">
          <p className="text-blue-300 text-xs font-extrabold tracking-widest uppercase mb-1">
            Account
          </p>
          <h2 className="text-2xl font-bold text-white mb-6">Profile</h2>

          <ProfileForm profile={profile} user={{ email: user.email || "" }} />
        </div>
      </section>
    </main>
  );
}
