import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { helpSessions } from "../../../db/index.mjs";

type SessionWithMessages = {
  id: string;
  userId: string;
  title?: string;
  status?: string;
  completed?: boolean | number;
  lastMessage?: string | null;
  sessionRecap?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  messages: any[];
} | null;

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
    let sessionWithMessages: SessionWithMessages =
      (await helpSessions.getHelpSessionWithMessages(helpSessionId)) as any;
    if (Array.isArray(sessionWithMessages)) {
      sessionWithMessages = (sessionWithMessages[0] as any) ?? null;
    }

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
