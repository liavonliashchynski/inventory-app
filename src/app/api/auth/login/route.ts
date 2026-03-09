import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    return new Response("Invalid credentials", { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return new Response("Invalid credentials", { status: 401 });
  }

  return Response.json({
    id: user.id,
    companyId: user.companyId,
    role: user.role,
  });
}
