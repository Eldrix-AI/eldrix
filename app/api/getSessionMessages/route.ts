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
    const helpSessionId = searchParams.get("helpSessionId");

    if (!helpSessionId) {
      return NextResponse.json(
        { error: "Help session ID is required" },
        { status: 400 }
      );
    }

    // Get the help session with its messages
    const sessionWithMessages = await helpSessions.getHelpSessionWithMessages(
      helpSessionId
    );

    if (!sessionWithMessages) {
      return NextResponse.json(
        { error: "Help session not found" },
        { status: 404 }
      );
    }

    // Check if user owns the session
    if (sessionWithMessages.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to help session" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: sessionWithMessages.id,
        title: sessionWithMessages.title,
        status: sessionWithMessages.status,
        completed: sessionWithMessages.completed,
        lastMessage: sessionWithMessages.lastMessage,
        sessionRecap: sessionWithMessages.sessionRecap,
        createdAt: sessionWithMessages.createdAt,
        updatedAt: sessionWithMessages.updatedAt,
      },
      messages: sessionWithMessages.messages,
    });
  } catch (error) {
    console.error("Error fetching session messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch session messages" },
      { status: 500 }
    );
  }
}
