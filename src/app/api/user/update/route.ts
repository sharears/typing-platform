import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Existing sessions might not have an ID, so we fall back to email or name
    const currentUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: session.user.email || undefined },
          { name: session.user.name || undefined }
        ]
      }
    });

    if (!currentUser) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const { name, email, password } = await req.json();

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: "No update data provided" }), { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData
    });

    return new Response(JSON.stringify({ success: true, user: { name: updatedUser.name, email: updatedUser.email } }), { status: 200 });
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
