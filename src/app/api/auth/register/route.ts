import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().min(2),
});

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());

    if (await db.user.findUnique({ where: { email: data.email } })) {
      return Response.json({ error: "User already exists" }, { status: 400 });
    }

    const baseSlug = generateSlug(data.companyName);
    let slug = baseSlug;
    let counter = 1;

    // Condense the slug uniqueness check
    while (await db.company.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Combine Company and User creation using Prisma nested writes
    const user = await db.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: "ADMIN",
        company: {
          create: { name: data.companyName, slug },
        },
      },
      select: { id: true, email: true, role: true, companyId: true },
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return Response.json({ error: error.issues }, { status: 400 });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
