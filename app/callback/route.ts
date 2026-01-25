import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { setSession } from "@/lib/session";
import { SpotifyApiClient } from "@/lib/spotify/api";
import { SPOTIFY_STATE_COOKIE } from "@/lib/spotify/auth";

export const GET = async (request: NextRequest) => {
  const cookieStore = await cookies();

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = cookieStore.get(SPOTIFY_STATE_COOKIE)?.value;
  cookieStore.delete(SPOTIFY_STATE_COOKIE);

  if (!code) {
    return redirect("/login?error=no_code");
  }
  if (state === null || state !== storedState) {
    return redirect("/login?error=state_mismatch");
  }

  const session = await SpotifyApiClient.authorizationCode(code);

  if (!session.success) {
    return redirect("/login?error=no_token");
  }

  await setSession(session.data);

  return redirect("/");
};
