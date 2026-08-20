import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const { wpm, errorRate, content, topic, detailedMistakes } = await req.json();

    const typingSession = await prisma.typingSession.create({
      data: {
        userId: user.id,
        wpm,
        errorRate,
        content,
        topic,
      },
    });

    if (detailedMistakes && detailedMistakes.length > 0) {
      const mistakesData = detailedMistakes.map((m: any) => ({
        userId: user.id,
        expectedChar: m.expected,
        typedChar: m.typed,
      }));
      
      await prisma.keystrokeMistake.createMany({
        data: mistakesData,
      });
    }

    return new Response(JSON.stringify({ success: true, sessionId: typingSession.id }), { status: 200 });
  } catch (error) {
    console.error("Save session error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
