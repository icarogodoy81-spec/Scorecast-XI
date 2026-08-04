import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="Scorecast XI" width={32} height={32} />
          <h1 className="text-xl font-bold text-green-400">Scorecast XI</h1>
        </div>
        <span className="text-sm text-gray-400">{user.email}</span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
