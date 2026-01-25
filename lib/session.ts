import { cookies } from "next/headers";
import z from "zod";
import type { TokenResponse } from "./spotify/types";

export const SESSION_COOKIE = "penster_session";
export const Session = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiry: z.number(),
});
export type Session = z.infer<typeof Session>;

export function createSession(tokenData: TokenResponse): Session {
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiry: Date.now() + tokenData.expires_in * 1000,
  };
}

export async function setSession(session: Session) {
  "use server";
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session));
}

export async function getSession(): Promise<Session | null> {
  "use server";
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  try {
    const sessionData = JSON.parse(sessionCookie?.value ?? "");
    const session = Session.parse(sessionData);
    return session;
  } catch (_error) {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
