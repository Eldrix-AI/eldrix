import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { helpSessions, messages } from "../../../db/index.mjs";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Configure AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Function to upload image to S3
async function uploadImageToS3(file: File) {
  // Convert file to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Generate a unique filename
  const fileExtension = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 15)}.${fileExtension}`;

  // Path in S3 bucket
  const s3Key = `eldrix/chat-images/${fileName}`;

  // Upload to S3
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME || "",
    Key: s3Key,
    Body: buffer,
    ContentType: file.type,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  // Create and return the S3 URL
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user data to check subscription status
    const { query } = await import("../../../lib/db");
    const [userData] = (await query(
      "SELECT stripeSubscriptionId, stripeUsageId, stripeCustomerId FROM User WHERE id = ?",
      [userId]
    )) as any;

    // Parse form data (may include text message and/or image)
    const formData = await request.formData();
    const text = formData.get("message") as string;
    const file = formData.get("file") as File | null;
    const helpSessionId = formData.get("helpSessionId") as string | null;

    // Set priority based on subscription status
    // If user has a subscription, they get high priority
    // Default to medium for free users
    let priority = "medium";
    if (userData && userData.stripeSubscriptionId) {
      priority = "high";
    }

    const type = (formData.get("type") as string) || "general";

    let imageUrl = null;

    // If there's a file, upload it
    if (file && file.type.startsWith("image/")) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size exceeds 5MB limit" },
          { status: 400 }
        );
      }

      imageUrl = await uploadImageToS3(file);
    }

    // Create message content combining text and image if present
    let messageContent = text || "";
    if (imageUrl) {
      if (messageContent) {
        messageContent += `\n\n[Image: ${imageUrl}]`;
      } else {
        messageContent = `[Image: ${imageUrl}]`;
      }
    }

    if (!messageContent) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    let sessionId = helpSessionId;
    let currentSession = null;

    // If no help session ID provided, check for existing incomplete sessions
    if (!sessionId) {
      // Get all existing help sessions for this user
      const existingSessions = (await helpSessions.getHelpSessionsByUserId(
        userId
      )) as any[];

      // Check if user has any incomplete sessions (pending, active, or open)
      const incompleteSessions = existingSessions.filter(
        (session) =>
          session.status === "pending" ||
          session.status === "active" ||
          session.status === "ongoing" ||
          session.status === "open"
      );

      if (incompleteSessions.length > 0) {
        // User already has an active session, return error
        return NextResponse.json(
          {
            error:
              "You already have an active help session. Please complete or close your current session before starting a new one.",
            existingSession: incompleteSessions[0], // Return the first incomplete session
          },
          { status: 409 } // Conflict status code
        );
      }

      sessionId = uuidv4();

      // Create a title from the message (truncated if necessary)
      const title = text
        ? text.length > 50
          ? text.substring(0, 47) + "..."
          : text
        : imageUrl
        ? "Image upload"
        : "New help request";

      // Create a new help session
      currentSession = await helpSessions.createHelpSession({
        id: sessionId,
        userId,
        title,
        type,
        priority,
        lastMessage: messageContent,
        status: "pending",
      });
    } else {
      // Get the existing help session
      currentSession = await helpSessions.getHelpSessionById(sessionId);

      if (!currentSession) {
        return NextResponse.json(
          { error: "Help session not found" },
          { status: 404 }
        );
      }

      // Update the last message but maintain the current status
      await helpSessions.updateHelpSession(sessionId, {
        lastMessage: messageContent,
        // Don't change the status when a user sends a message
        // Status should only change to "open" when an admin responds
      });
    }

    // Add the message to the session
    const messageId = uuidv4();
    const newMessage = await messages.createMessage({
      id: messageId,
      content: messageContent,
      isAdmin: false, // User message, not admin
      helpSessionId: sessionId,
      read: false, // New message is unread
    });

    // Get the updated session with all messages
    const updatedSession = await helpSessions.getHelpSessionWithMessages(
      sessionId
    );

    // Only charge for new help sessions, not for additional messages in the same session
    const isNewHelpSession = !helpSessionId;

    // For pay-as-you-go users, report usage to Stripe, but only for new help sessions
    console.log("User data:", userData);
    console.log("Checking pay-as-you-go eligibility:", {
      hasUsageId: !!userData?.stripeUsageId,
      hasSubscriptionId: !!userData?.stripeSubscriptionId,
      isPayAsYouGo: userData?.stripeUsageId && !userData?.stripeSubscriptionId,
      isNewHelpSession,
    });

    // Check for pay-as-you-go users - they have a usage ID
    // Only charge if this is a new help session
    if (userData && userData.stripeUsageId && isNewHelpSession) {
      console.log(
        "Processing usage-based billing for new help session, user:",
        userId
      );
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: "2025-08-27.basil",
        });

        // Report usage of 1 unit for this new help session
        console.log(
          "Reporting usage with customer ID:",
          userData.stripeCustomerId
        );

        // Using the correct 2025 API endpoint for meter events
        const response = await fetch(
          `https://api.stripe.com/v1/billing/meter_events`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              event_name: "api_requests", // The meter name configured in Stripe
              "payload[value]": "1", // The value to increment by
              "payload[stripe_customer_id]": userData.stripeCustomerId, // Customer ID is required
            }).toString(),
          }
        );

        const result = await response.json();
        console.log("Direct API call result:", result);

        console.log(`✅ Recorded usage for new help session, user ${userId}`);
      } catch (stripeError) {
        console.error("❌ Error reporting usage to Stripe:", stripeError);
        // Don't fail the request if Stripe reporting fails
      }
    } else if (userData && userData.stripeUsageId && !isNewHelpSession) {
      console.log("Existing help session - not charging additional usage");
    } else {
      console.log(
        "User has no usage ID or is not on pay-as-you-go plan, skipping usage reporting"
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: newMessage,
    });
  } catch (error) {
    console.error("Error processing chat message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

// Increase the body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
