import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    // Get count of due items
    const dueCount = await prisma.reviewItem.count({
      where: {
        userId: session.user.id,
        nextReviewDate: {
          lte: now
        }
      }
    });

    // Get the actual items
    const dueItems = await prisma.reviewItem.findMany({
      where: {
        userId: session.user.id,
        nextReviewDate: {
          lte: now
        }
      },
      orderBy: {
        nextReviewDate: "asc"
      },
      take: 10
    });

    return NextResponse.json({ count: dueCount, items: dueItems });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId, quality } = await req.json(); 
    // quality: 0 (failed), 1 (hard), 2 (good), 3 (easy)

    const item = await prisma.reviewItem.findUnique({ where: { id: itemId } });
    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // SuperMemo-2 Algorithm simplified
    let easeFactor = item.easeFactor;
    let interval = item.interval;
    let repetitions = item.repetitions;

    if (quality >= 1) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions++;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    await prisma.reviewItem.update({
      where: { id: itemId },
      data: {
        interval,
        easeFactor,
        repetitions,
        nextReviewDate
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
