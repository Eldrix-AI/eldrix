import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { helpSessions } from "../../../db/index.mjs";

// Define an interface for the help session structure
interface HelpSession {
  id: string;
  userId: string;
  title: string;
  sessionRecap: string | null;
  completed: number;
  lastMessage: string | null;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all sessions for this user
    const userSessions = await helpSessions.getHelpSessionsByUserId(userId);

    // Convert to array if needed and cast to HelpSession type
    const sessionsArray = (
      Array.isArray(userSessions) ? userSessions : []
    ) as HelpSession[];

    // Sort sessions by most recent first
    sessionsArray.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // Check if there's an active (not completed) session
    const hasActiveSession = sessionsArray.some(
      (session) => session.completed === 0
    );

    return NextResponse.json({
      success: true,
      sessions: sessionsArray,
      hasActiveSession,
    });
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
