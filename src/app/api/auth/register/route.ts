import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().min(2),
});

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return Response.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    let slug = generateSlug(data.companyName);

    // check if slug already exists
    let existingSlug = await db.company.findUnique({
      where: { slug },
    });

    let counter = 1;

    while (existingSlug) {
      slug = `${generateSlug(data.companyName)}-${counter}`;
      existingSlug = await db.company.findUnique({
        where: { slug },
      });
      counter++;
    }

    const company = await db.company.create({
      data: {
        name: data.companyName,
        slug: slug,
      },
    });

    const user = await db.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        companyId: company.id,
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
      },
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
