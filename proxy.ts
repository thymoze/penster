import { type NextRequest, NextResponse, type ProxyConfig } from "next/server";
import { clearSession, getSession, updateSession } from "@/lib/session";
import { spotifyClient } from "@/lib/spotify/api";

export const config: ProxyConfig = {
  matcher: ["/((?!_next/|favicon.ico|callback).*)"],
};

export async function proxy(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    await clearSession();
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const client = await spotifyClient();
    if (client.isTokenExpired()) {
      const refreshResult = await client.refreshTokens();
      if (!refreshResult.success) {
        throw new Error("Session expired");
      }
      await updateSession(request, refreshResult.data);
    }
    return NextResponse.next({ request });
  } catch {
    await clearSession();
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
