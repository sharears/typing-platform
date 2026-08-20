import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    // Fetch the last 10 typing sessions
    const sessions = await prisma.typingSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Fetch the last 200 mistakes to find specific finger placement issues
    const mistakes = await prisma.keystrokeMistake.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    if (sessions.length === 0) {
      return new Response(JSON.stringify({ insight: "Complete your first typing session to see your stats here!" }), { status: 200 });
    }

    const avgWpm = Math.round(sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length);
    const avgErr = (sessions.reduce((sum, s) => sum + s.errorRate, 0) / sessions.length).toFixed(1);
    
    let insight = `You've averaged ${avgWpm} WPM with a ${avgErr}% error rate over your last ${sessions.length} sessions. `;

    if (mistakes.length > 0) {
      const frequencies: Record<string, number> = {};
      mistakes.forEach(m => {
        frequencies[m.expectedChar] = (frequencies[m.expectedChar] || 0) + 1;
      });
      
      const topMistakes = Object.entries(frequencies)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([char]) => `'${char === ' ' ? 'Space' : char}'`);

      if (topMistakes.length > 0) {
        insight += `You seem to struggle most with typing ${topMistakes.join(" and ")}. Focus on accuracy with those keys!`;
      }
    } else {
      insight += `You're doing great with accuracy—keep it up!`;
    }

    return new Response(JSON.stringify({ insight }), { status: 200 });
  } catch (error) {
    console.error("Analytics Error:", error);
    return new Response(JSON.stringify({ error: "Failed to analyze trends" }), { status: 500 });
  }
}
