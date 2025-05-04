import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { v4 as uuidv4 } from "uuid";
import { helpSessions, messages } from "../../../db/index.mjs";

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Here you could add additional admin verification logic
    // For example check admin role in the database

    // Parse the request body
    const body = await request.json();
    const { helpSessionId, content, markAllAsRead = true } = body;

    if (!helpSessionId || !content) {
      return NextResponse.json(
        { error: "Session ID and content are required" },
        { status: 400 }
      );
    }

    // Check if help session exists
    const helpSession = await helpSessions.getHelpSessionById(helpSessionId);
    if (!helpSession) {
      return NextResponse.json(
        { error: "Help session not found" },
        { status: 404 }
      );
    }

    // Add admin message to the session
    const messageId = uuidv4();
    const adminMessage = await messages.createMessage({
      id: messageId,
      content,
      isAdmin: true, // Mark this as an admin message
      helpSessionId,
      read: false, // Initially unread by the user
    });

    // Update the last message in the help session
    await helpSessions.updateHelpSession(helpSessionId, {
      lastMessage: content,
      status: "active", // Change status to active when admin responds
    });

    // If requested, mark all previous messages as read by the admin
    if (markAllAsRead) {
      await messages.markAllSessionMessagesAsRead(helpSessionId);
    }

    // Get the updated session with all messages
    const updatedSession = await helpSessions.getHelpSessionWithMessages(
      helpSessionId
    );

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: adminMessage,
    });
  } catch (error) {
    console.error("Error processing admin reply:", error);
    return NextResponse.json(
      { error: "Failed to process admin reply" },
      { status: 500 }
    );
  }
}
