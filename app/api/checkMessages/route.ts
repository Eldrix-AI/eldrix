import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { helpSessions, messages } from "../../../db/index.mjs";

type BasicHelpSession = { id: string; userId: string; status?: string } | null;

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

    // Get the help session (some helpers may return an array; normalize to object)
    let helpSession: BasicHelpSession = (await helpSessions.getHelpSessionById(
      helpSessionId
    )) as any;
    if (Array.isArray(helpSession)) {
      helpSession = (helpSession[0] as any) ?? null;
    }

    if (!helpSession) {
      return NextResponse.json(
        { error: "Help session not found" },
        { status: 404 }
      );
    }

    // Check if user owns the session
    if (helpSession.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to help session" },
        { status: 403 }
      );
    }

    // Get unread messages
    const unreadMessages = await messages.getUnreadMessagesByHelpSessionId(
      helpSessionId
    );

    return NextResponse.json({
      success: true,
      sessionStatus: helpSession.status,
      unreadMessages,
    });
  } catch (error) {
    console.error("Error checking messages:", error);
    return NextResponse.json(
      { error: "Failed to check messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse the request body
    const body = await request.json();
    const { helpSessionId, messageIds } = body;

    if (!helpSessionId || !messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { error: "Help session ID and message IDs array are required" },
        { status: 400 }
      );
    }

    // Get the help session (normalize possible array return)
    let helpSession: BasicHelpSession = (await helpSessions.getHelpSessionById(
      helpSessionId
    )) as any;
    if (Array.isArray(helpSession)) {
      helpSession = (helpSession[0] as any) ?? null;
    }

    if (!helpSession) {
      return NextResponse.json(
        { error: "Help session not found" },
        { status: 404 }
      );
    }

    // Check if user owns the session
    if (helpSession.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to help session" },
        { status: 403 }
      );
    }

    // Mark the specified messages as read
    const results = await Promise.all(
      messageIds.map((id) => messages.markMessageAsRead(id))
    );

    return NextResponse.json({
      success: true,
      markedAsRead: results.filter(Boolean).length,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
