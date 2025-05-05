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

    // Get sessions grouped by time period
    const [
      lastDaySessions,
      lastWeekSessions,
      lastMonthSessions,
      olderSessions,
      weeklyCount,
      averageDuration,
    ] = await Promise.all([
      helpSessions.getLastDayHelpSessions(userId),
      helpSessions.getLastWeekHelpSessions(userId),
      helpSessions.getLastMonthHelpSessions(userId),
      helpSessions.getOlderHelpSessions(userId),
      helpSessions.getWeeklySessionCount(userId),
      helpSessions.getAverageSessionDuration(userId),
    ]);

    // Calculate sessions left this week
    const MAX_WEEKLY_SESSIONS = 3; // Maximum allowed sessions per week
    const sessionsLeftThisWeek = Math.max(0, MAX_WEEKLY_SESSIONS - weeklyCount);

    // Process and return the data
    return NextResponse.json({
      success: true,
      history: {
        lastDay: lastDaySessions,
        lastWeek: lastWeekSessions,
        lastMonth: lastMonthSessions,
        older: olderSessions,
      },
      stats: {
        weeklyUsage: weeklyCount,
        weeklyRemaining: sessionsLeftThisWeek,
        averageDurationMinutes: averageDuration,
      },
    });
  } catch (error) {
    console.error("Error fetching user history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
