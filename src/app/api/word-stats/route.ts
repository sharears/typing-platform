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

    // Fetch DailyProgress from the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // SQLite dates are strings, but we can just query all and filter, or generate the last 14 date strings
    const dateStrings: string[] = [];
    const dailyStats: Record<string, number> = {};

    for (let i = 0; i < 14; i++) {
      const d = new Date(fourteenDaysAgo);
      d.setDate(d.getDate() + i);
      const isoStr = d.toISOString().split('T')[0];
      const displayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateStrings.push(isoStr);
      dailyStats[displayStr] = 0;
    }

    const progresses = await prisma.dailyProgress.findMany({
      where: { 
        userId: user.id,
        dateStr: { in: dateStrings }
      },
    });

    // Populate actual counts from new DailyProgress table
    progresses.forEach(p => {
      // Convert dateStr back to displayStr
      const d = new Date(p.dateStr + "T00:00:00");
      const displayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyStats[displayStr] !== undefined) {
        dailyStats[displayStr] += p.words;
      }
    });

    // Also fetch legacy TypingSession data to preserve historical chart data
    const legacySessions = await prisma.typingSession.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: fourteenDaysAgo }
      }
    });

    legacySessions.forEach(s => {
      const d = new Date(s.createdAt);
      const displayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyStats[displayStr] !== undefined && s.content) {
        const words = s.content.trim().split(/\s+/).length;
        dailyStats[displayStr] += words;
      }
    });

    // Format for recharts
    const chartData = Object.keys(dailyStats).map((displayStr) => ({
      date: displayStr,
      words: dailyStats[displayStr]
    }));

    return new Response(JSON.stringify(chartData), { status: 200 });
  } catch (error) {
    console.error("Word Stats Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch word stats" }), { status: 500 });
  }
}
