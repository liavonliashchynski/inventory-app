import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

export default async function HomePage() {
  const token = (await cookies()).get("token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    redirect("/login");
  }

  const isValid = await jwtVerify(token, new TextEncoder().encode(secret))
    .then(() => true)
    .catch(() => false);

  redirect(isValid ? "/dashboard" : "/login");
}
