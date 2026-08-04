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
    <main className="profile-page">
      <div className="bgGrid" />
      <div className="overlay" />

      <section className="profile-shell">
        <header className="top-header">
          <div className="brand">
            <Image src="/images/logo.png" alt="Scorecast XI" width={443} height={319} className="logo" priority />
            <p className="tagline">Keep your Scorecast XI identity tidy.</p>
          </div>
        </header>

        <nav className="nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/predictions">Make predictions</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/profile">Profile</Link>
        </nav>

        <div className="card">
          <p className="eyebrow">Account</p>
          <h2>Profile</h2>

          <ProfileForm profile={profile} user={{ email: user.email || "" }} />
        </div>
      </section>

      <style>{`
        .profile-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background: linear-gradient(135deg, #020617 0%, #082f49 45%, #0f172a 100%);
          padding: 40px 20px;
        }

        .bgGrid {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 44px 44px;
          opacity: 0.25;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.35), transparent 30%),
            radial-gradient(circle at bottom right, rgba(250, 204, 21, 0.18), transparent 30%);
        }

        .profile-shell {
          position: relative;
          z-index: 2;
          max-width: 700px;
          margin: 0 auto;
          background: rgba(2, 6, 23, 0.78);
          border: 1px solid rgba(147, 197, 253, 0.35);
          border-radius: 24px;
          padding: 32px;
          box-shadow:
            0 25px 80px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 20px;
        }

        .brand .logo {
          height: 70px;
          width: auto;
        }

        .brand .tagline {
          margin: 0;
          color: #bfdbfe;
          font-size: 14px;
        }

        .nav {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .nav a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 130px;
          padding: 12px 18px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(147, 197, 253, 0.35);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
        }

        .nav a:hover {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.22);
        }

        .card {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(147, 197, 253, 0.35);
          border-radius: 16px;
          padding: 24px;
        }

        .eyebrow {
          margin: 0 0 6px;
          color: #93c5fd;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .card h2 {
          margin: 0 0 16px;
          font-size: 24px;
          color: #fff;
        }
      `}</style>
    </main>
  );
}
