import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { helpSessions, messages } from "../../../db/index.mjs";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { helpSessionId } = body;

    if (!helpSessionId) {
      return NextResponse.json(
        { error: "Help session ID is required" },
        { status: 400 }
      );
    }

    // Get the help session
    const helpSession = await helpSessions.getHelpSessionById(helpSessionId);

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

    // Get all messages in the session
    const sessionData = await helpSessions.getHelpSessionWithMessages(
      helpSessionId
    );
    const allMessages = sessionData.messages;

    // Format messages for GPT prompt
    const formattedMessages = allMessages
      .map(
        (msg: { isAdmin: any; content: any }) =>
          `${msg.isAdmin ? "Support Agent" : "User"}: ${msg.content}`
      )
      .join("\n\n");

    // Generate session recap using GPT-4o
    const recapPrompt = `
      Please create a concise summary (maximum 3-4 sentences) of the following tech support conversation.
      Focus on:
      1. The main problem or question the user had
      2. The key solutions or advice provided
      3. Any next steps or unresolved issues
      
      CONVERSATION:
      ${formattedMessages}
      
      SUMMARY:
    `;

    const titlePrompt = `
      Based on the following tech support conversation, create a short, descriptive title (5-7 words max) 
      that clearly identifies the main topic or issue discussed.
      
      CONVERSATION:
      ${formattedMessages}
      
      TITLE:
    `;

    // Get both recap and title in parallel
    const [recapResponse, titleResponse] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: recapPrompt }],
        max_tokens: 150,
        temperature: 0.7,
      }),
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: titlePrompt }],
        max_tokens: 25,
        temperature: 0.7,
      }),
    ]);

    const sessionRecap = recapResponse.choices[0].message.content?.trim();
    const newTitle = titleResponse.choices[0].message.content?.trim();

    // Update the help session
    const updatedSession = await helpSessions.updateHelpSession(helpSessionId, {
      completed: true,
      status: "completed",
      sessionRecap,
      title: newTitle || helpSession.title,
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
      recap: sessionRecap,
      title: newTitle,
    });
  } catch (error) {
    console.error("Error closing session:", error);
    return NextResponse.json(
      { error: "Failed to close session" },
      { status: 500 }
    );
  }
}
