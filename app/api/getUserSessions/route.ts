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

    // Normalize and defensively map to expected shape
    const rawArray: any[] = Array.isArray(userSessions) ? userSessions : [];
    const sessionsArray: HelpSession[] = rawArray.map((s: any) => ({
      id: String(s.id),
      userId: String(s.userId),
      title: String(s.title ?? ""),
      sessionRecap: s.sessionRecap ?? null,
      completed:
        typeof s.completed === "number" ? s.completed : s.completed ? 1 : 0,
      lastMessage: s.lastMessage ?? null,
      type: String(s.type ?? ""),
      status: String(s.status ?? "pending"),
      priority: String(s.priority ?? ""),
      createdAt: String(s.createdAt ?? new Date().toISOString()),
      updatedAt: String(s.updatedAt ?? new Date().toISOString()),
    }));

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
