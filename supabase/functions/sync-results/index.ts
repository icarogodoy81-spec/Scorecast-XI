import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const res = await fetch("https://your-domain.vercel.app/api/sync-results", {
    method: "GET",
    headers: { Authorization: `Bearer ${Deno.env.get("CRON_SECRET")}` },
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
