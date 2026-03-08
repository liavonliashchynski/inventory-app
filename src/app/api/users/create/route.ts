import { db } from "@/lib/db";

export async function POST() {
  const user = await db.user.create({
    data: {
      email: "liavonliashchynski@proton.me",
      name: "Liavon",
    },
  });

  return Response.json(user);
}
