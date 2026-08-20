import { Resend } from "resend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Email service is not configured. Please add RESEND_API_KEY to your .env file." }), { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    const { content, topic } = await req.json();

    const { data, error } = await resend.emails.send({
      from: "Type & Learn <onboarding@resend.dev>",
      to: [session.user.email],
      subject: `Your Typing Summary: ${topic}`,
      text: content,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (error) {
    console.error("Email sending failed:", error);
    return new Response(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
  }
}
