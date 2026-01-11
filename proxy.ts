import { type NextRequest, NextResponse, type ProxyConfig } from "next/server";
import { clearSession, getSession } from "@/lib/session";

export const config: ProxyConfig = {
  matcher: ["/((?!_next/|favicon.ico|callback).*)"],
};

export async function proxy(request: NextRequest) {
  const session = await getSession();

  if (session && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!session && request.nextUrl.pathname !== "/login") {
    await clearSession();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
