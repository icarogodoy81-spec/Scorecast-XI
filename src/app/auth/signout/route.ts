import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function signOutAndRedirect(request: NextRequest) {
  const supabase = await createClient();

  await supabase.auth.signOut();

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl);
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request);
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request);
}
