import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Bolão" width={443} height={319} priority />
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <Link href="/matches" className="text-sm text-gray-600 hover:text-gray-900">
              Matches
            </Link>
            <Link href="/leagues" className="text-sm text-gray-600 hover:text-gray-900">
              Leagues
            </Link>
            <Link href="/leaderboard" className="text-sm text-gray-600 hover:text-gray-900">
              Leaderboard
            </Link>
            <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
              Profile
            </Link>
            <form action={signOut}>
              <button className="text-sm text-red-500 hover:text-red-700">
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
