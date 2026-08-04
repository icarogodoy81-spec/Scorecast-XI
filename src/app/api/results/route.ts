import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Verify webhook signature / secret
  const authHeader = request.headers.get("x-webhook-secret");
  if (authHeader !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fixture, teams, goals } = body;

    if (!fixture || !teams || goals === undefined) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Use service role to update matches
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const statusMap: Record<string, string> = {
      NS: "scheduled",
      "1H": "live",
      HT: "live",
      "2H": "live",
      FT: "finished",
      AET: "finished",
      PEN: "finished",
      PST: "postponed",
      CANC: "cancelled",
    };

    const { error } = await supabase
      .from("matches")
      .update({
        status: statusMap[fixture.status.short] || "scheduled",
        home_score: goals.home,
        away_score: goals.away,
      })
      .eq("api_fixture_id", fixture.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
