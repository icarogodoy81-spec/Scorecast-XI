import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">
        Welcome, <span className="text-green-400">{user?.email}</span>! 🎉
      </h2>
      <p className="text-gray-400">
        Your score pool is ready. Predictions coming soon.
      </p>
    </div>
  );
}
