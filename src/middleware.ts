import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("token")?.value;

  const isValid =
    token &&
    (await jwtVerify(token, secret)
      .then(() => true)
      .catch(() => false));
  const isAuth = ["/login", "/register"].includes(path);

  if (isValid && isAuth)
    return NextResponse.redirect(new URL("/dashboard", req.url));

  if (!isValid && !isAuth && !path.startsWith("/api/auth")) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("token");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
