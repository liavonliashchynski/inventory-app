import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string(),
});

export async function POST(req: Request) {
  const body = await req.json();

  const data = schema.parse(body);

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const company = await db.company.create({
    data: {
      name: data.companyName,
    },
  });

  const user = await db.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      companyId: company.id,
      role: "ADMIN",
    },
  });

  return Response.json(user);
}
