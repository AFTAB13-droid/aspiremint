import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AiChatService } from "@/services/aiChat.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in to chat with Sana." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid chat payload. Messages array required." },
        { status: 400 }
      );
    }

    const user = {
      userId: session.user.id,
      name: session.user.name || "Shopper",
      email: session.user.email || "",
      role: (session.user as any).role || "USER",
      aspireMintId: (session.user as any).aspireMintId || "",
    };

    const result = await AiChatService.processConversation(messages, user);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Sana AI Chat Route Error:", error);
    
    // Check if error is OpenAI quota or key issue
    const errorMessage = error?.message || "Failed to process message";
    return NextResponse.json(
      {
        success: false,
        message: "Sana is temporarily unavailable. Please try again in a few moments.",
        error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
