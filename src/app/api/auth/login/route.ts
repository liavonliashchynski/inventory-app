import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

  const token = jwt.sign(
    {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" },
  );

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=604800`,
    },
  });
}
