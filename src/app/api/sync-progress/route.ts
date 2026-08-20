import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { wordsTyped } = await req.json();

    if (!wordsTyped || wordsTyped <= 0) {
      return new Response(JSON.stringify({ error: "Invalid word count" }), { status: 400 });
    }

    const dateStr = new Date().toISOString().split('T')[0];

    // Find if a record already exists for today
    const existing = await prisma.dailyProgress.findFirst({
      where: {
        userId: session.user.id,
        dateStr: dateStr
      }
    });

    if (existing) {
      await prisma.dailyProgress.update({
        where: { id: existing.id },
        data: { words: { increment: wordsTyped } }
      });
    } else {
      await prisma.dailyProgress.create({
        data: {
          userId: session.user.id,
          dateStr: dateStr,
          words: wordsTyped
        }
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Sync Progress Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
