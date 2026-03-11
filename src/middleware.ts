import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type JwtPayload = {
  exp?: number;
  [key: string]: unknown;
};

function base64UrlDecode(str: string) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function base64UrlEncode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function safeCompare(a: string, b: string) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

async function verifyJwt(token: string, secret: string) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;

  const decodedHeader = JSON.parse(base64UrlDecode(header));
  const decodedPayload = JSON.parse(base64UrlDecode(payload)) as JwtPayload;

  if (decodedHeader.alg !== "HS256") return null;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);

  const expected = base64UrlEncode(new Uint8Array(sig));

  if (!safeCompare(expected, signature)) return null;

  if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
    return null;
  }

  return decodedPayload;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const secret = process.env.JWT_SECRET;

  const publicRoutes = ["/login", "/register", "/api/auth"];

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token || !secret) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await verifyJwt(token, secret);

  if (!payload) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("token");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
