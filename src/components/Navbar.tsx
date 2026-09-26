"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/predictions", label: "Make predictions" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile" },
  { href: "/leagues", label: "Leagues" },
  { href: "/how-it-works", label: "How to Play" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((res: any) => {
      if (res?.data?.user) setUser(res.data.user);
    });
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (
    !pathname ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/dashboard") ||
    pathname === "/leagues" ||
    pathname === "/leagues/"
  ) {
    return null;
  }



  return (
    <nav
      style={{
        background: "#0f172a",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: "10px 16px",
        margin: 0,
        zIndex: 50,
      }}
    >
      <div
        ref={menuRef}
        style={{
          position: "absolute",
          left: "16px",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
          className="!p-2.5 !bg-slate-900/80 !border !border-white/10 !rounded-xl !shadow-lg backdrop-blur-md flex flex-col justify-center items-center gap-1.5 w-11 h-11 hover:!border-blue-400/50 hover:!bg-slate-800/80 transition-all cursor-pointer"
        >
          <span
            className={`block h-0.5 w-6 bg-slate-100 rounded-full transition-transform duration-200 ${
              isOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-slate-100 rounded-full transition-opacity duration-200 ${
              isOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-slate-100 rounded-full transition-transform duration-200 ${
              isOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-14 left-0 w-72 sm:w-80 rounded-2xl p-6 flex flex-col gap-3 bg-slate-900/95 backdrop-blur-md border border-white/10 shadow-2xl">
            {user?.email && (
              <span className="text-sm text-slate-300 break-all mb-2 text-center">
                {user.email}
              </span>
            )}

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block w-full px-4 py-3 rounded-xl text-sm font-bold text-center border border-white/10 transition-all shadow-sm ${
                  pathname === link.href
                    ? "bg-blue-600/30 border-blue-500 text-white"
                    : "bg-white/5 text-slate-100 hover:border-blue-400/50 hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={handleSignOut}
              className="!w-full !mt-3 !px-4 !py-2.5 !text-sm !rounded-lg !border !border-white/5 !bg-slate-800/50 !text-slate-300 hover:!bg-slate-700/60 hover:!text-white !shadow-none !transform-none"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      <Link href="/dashboard" className="logo-link">
        <Image
          src="/images/logo.png"
          alt="Scorecast XI"
          width={443}
          height={319}
          priority
          style={{ width: "140px", height: "auto" }}
        />
      </Link>
    </nav>
  );
}
