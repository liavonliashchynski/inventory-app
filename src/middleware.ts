import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/login", "/register", "/api/auth"];

export async function middleware(req: NextRequest) {
  if (PUBLIC_ROUTES.some((route) => req.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET;

  try {
    if (!token || !secret) throw new Error("Missing credentials");

    // Verifies signature and expiration (exp) automatically
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("token");
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
