import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { helpSessions } from "../../../db/index.mjs";

export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get the full session with messages
    const chatSession = await helpSessions.getHelpSessionWithMessages(
      sessionId
    );

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify that this session belongs to the current user
    if (chatSession.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to session" },
        { status: 403 }
      );
    }

    // Calculate session duration if it's completed
    let duration = null;
    if (chatSession.completed === 1 && chatSession.messages.length > 1) {
      const firstMessage = new Date(
        chatSession.messages[0].createdAt
      ).getTime();
      const lastMessage = new Date(
        chatSession.messages[chatSession.messages.length - 1].createdAt
      ).getTime();

      // Duration in minutes
      duration = Math.floor((lastMessage - firstMessage) / 60000);
    }

    return NextResponse.json({
      success: true,
      session: {
        ...chatSession,
        duration, // Include calculated duration
      },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}
