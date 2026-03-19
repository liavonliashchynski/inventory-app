import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = new Set(["/", "/login", "/register"]);

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET;
  const isPublicRoute = PUBLIC_ROUTES.has(path);

  let isValid = false;

  if (token && secret) {
    isValid = await jwtVerify(token, new TextEncoder().encode(secret))
      .then(() => true)
      .catch(() => false);
  }

  if (isValid && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isValid && !isPublicRoute && !path.startsWith("/api/auth")) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("token");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
