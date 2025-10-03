import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import { helpSessions, messages } from "../../../db/index.mjs";
import Stripe from "stripe";
import twilio from "twilio";

export const dynamic = "force-dynamic";

// Vercel Blob token
const BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN || process.env.blob_READ_WRITE_TOKEN || "";

// Twilio client for SMS notifications
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Helper function to send SMS notification
async function sendSMSNotification(
  userData: any,
  userPlan: any,
  messageContent: string,
  isNewSession: boolean,
  sessionId: string
) {
  try {
    const planType = userPlan.type;
    const planDisplayName =
      planType === "FREE"
        ? "Free Trial"
        : planType === "CUSTOMER"
        ? "Customer"
        : planType === "MONTHLY_OR_YEARLY"
        ? "Paid Customer"
        : planType === "PAYGO"
        ? "Pay-As-You-Go Customer"
        : "Unknown";

    const sessionType = isNewSession
      ? "New chat session"
      : "Message in existing session";
    const messagePreview =
      messageContent.length > 50
        ? messageContent.substring(0, 47) + "..."
        : messageContent;

    // Check if userData exists and has required fields
    if (!userData) {
      console.log("⚠️ No user data available for SMS notification");
      return;
    }

    const userName = userData.name || "Unknown User";
    const userEmail = userData.email || "No email";

    // Create response URL
    const responseUrl = `https://admin.eldrix.app/chat?id=${sessionId}`;

    const smsBody = `📱 Eldrix ${sessionType}
👤 ${userName} (${planDisplayName})
💬 "${messagePreview}"
📧 ${userEmail}

🔗 Click here to respond: ${responseUrl}`;

    await twilioClient.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: "+17206122979", // Your phone number
    });

    console.log("✅ SMS notification sent successfully");
  } catch (error) {
    console.error("❌ Error sending SMS notification:", error);
    // Don't fail the request if SMS fails
  }
}

// Plan types and limits
const PLAN_LIMITS = {
  FREE: { freeChats: 3, unlimited: false },
  CUSTOMER: { freeChats: 3, unlimited: false },
  MONTHLY_OR_YEARLY: { freeChats: 0, unlimited: true },
  PAYGO: { freeChats: 3, unlimited: false },
  PRIORITY_PAYGO: { freeChats: 3, unlimited: false },
};

// Helper function to determine user plan type
function determineUserPlan(userData: any) {
  if (!userData) {
    console.log("No user data provided, defaulting to FREE plan");
    return { type: "FREE", hasSubscription: false, hasUsageId: false };
  }

  const hasSubscription = !!userData.stripeSubscriptionId;
  const hasUsageId = !!userData.stripeUsageId;

  console.log("User plan determination:", {
    hasSubscription,
    hasUsageId,
    stripeSubscriptionId: userData.stripeSubscriptionId,
    stripeUsageId: userData.stripeUsageId,
  });

  // If they have a subscription ID, they're on a monthly/yearly plan
  if (hasSubscription && !hasUsageId) {
    return {
      type: "MONTHLY_OR_YEARLY",
      hasSubscription: true,
      hasUsageId: false,
    };
  }

  // If they have both subscription ID and usage ID, they're on pay-as-you-go
  if (hasSubscription && hasUsageId) {
    return { type: "PAYGO", hasSubscription: true, hasUsageId: true };
  }

  // If they only have usage ID, they might be on pay-as-you-go without subscription
  if (hasUsageId && !hasSubscription) {
    return { type: "PAYGO", hasSubscription: false, hasUsageId: true };
  }

  // If user has completed onboarding (has real phone number and SMS consent), they're a customer
  // Only show "Free Trial" for users who haven't completed onboarding
  if (
    userData.phone &&
    userData.phone !== "000-000-0000" &&
    userData.smsConsent
  ) {
    return { type: "CUSTOMER", hasSubscription: false, hasUsageId: false };
  }

  // Default to free plan for incomplete onboarding
  return { type: "FREE", hasSubscription: false, hasUsageId: false };
}

// Helper function to check chat limits
async function checkChatLimits(userId: string, userPlan: any) {
  const { helpSessions } = await import("../../../db/index.mjs");

  // Get total sessions for this user (not just completed ones)
  const allSessions = await helpSessions.getHelpSessionsByUserId(userId);
  const totalChats = allSessions.length;

  const planType = userPlan.type;
  const limits =
    PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;

  console.log("Chat limits check:", {
    userId,
    planType,
    totalChats,
    freeChats: limits.freeChats,
    unlimited: limits.unlimited,
    canChat: totalChats < limits.freeChats || limits.unlimited,
  });

  // If unlimited plan, always allow
  if (limits.unlimited) {
    return {
      canChat: true,
      remainingChats: -1, // -1 indicates unlimited
      errorMessage: "",
      upgradeRequired: false,
    };
  }

  // Check if user has exceeded free chat limit
  const remainingChats = Math.max(0, limits.freeChats - totalChats);
  const canChat = totalChats < limits.freeChats;

  if (!canChat) {
    let errorMessage = "";
    let upgradeRequired = false;

    if (planType === "FREE") {
      errorMessage = `You've used all ${limits.freeChats} free chats. Upgrade to a paid plan for unlimited access!`;
      upgradeRequired = true;
      return {
        canChat: false,
        remainingChats: 0,
        errorMessage,
        upgradeRequired,
      };
    } else if (planType === "CUSTOMER") {
      errorMessage = `You've used all ${limits.freeChats} free chats. Upgrade to a paid plan for unlimited access!`;
      upgradeRequired = true;
      return {
        canChat: false,
        remainingChats: 0,
        errorMessage,
        upgradeRequired,
      };
    } else if (planType === "PAYGO") {
      // PAYG users can continue chatting but will be charged
      return {
        canChat: true,
        remainingChats: 0,
        errorMessage: `You've used your ${limits.freeChats} free chats. This session will be charged.`,
        upgradeRequired: false,
        isPaygWarning: true,
      };
    }
  }

  return {
    canChat: true,
    remainingChats,
    errorMessage: "",
    upgradeRequired: false,
  };
}

// Function to upload image to Vercel Blob
async function uploadImageToS3(file: File) {
  // Convert file to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Generate a unique filename
  const fileExtension = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 15)}.${fileExtension}`;
  const blobPath = `eldrix/chat-images/${fileName}`;
  if (!BLOB_TOKEN) throw new Error("Missing BLOB_READ_WRITE_TOKEN");
  const { url } = await put(blobPath, buffer, {
    access: "public",
    token: BLOB_TOKEN,
    contentType: file.type,
  });
  return url;
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
    const userDataResult = (await query(
      'SELECT "stripeSubscriptionId", "stripeUsageId", "stripeCustomerId", name, email, phone, "smsConsent" FROM "User" WHERE id = $1',
      [userId]
    )) as any;

    const userData =
      userDataResult && userDataResult.length > 0 ? userDataResult[0] : null;
    console.log("User data from database:", userData);

    // Determine user plan type and check chat limits
    const userPlan = determineUserPlan(userData);
    const chatLimits = await checkChatLimits(userId, userPlan);

    // If user has exceeded their free chat limit, block the request
    if (!chatLimits.canChat) {
      return NextResponse.json(
        {
          error: chatLimits.errorMessage,
          planType: userPlan.type,
          remainingChats: chatLimits.remainingChats,
          upgradeRequired: chatLimits.upgradeRequired,
        },
        { status: 403 }
      );
    }

    // Store PAYG warning info for later use
    const paygWarning = chatLimits.isPaygWarning
      ? chatLimits.errorMessage
      : null;

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

    // Send SMS notification to admin
    await sendSMSNotification(
      userData,
      userPlan,
      messageContent,
      isNewHelpSession,
      sessionId
    );

    // For pay-as-you-go users, report usage to Stripe, but only for new help sessions
    console.log("User data:", userData);
    console.log("Checking pay-as-you-go eligibility:", {
      hasUsageId: !!userData?.stripeUsageId,
      hasSubscriptionId: !!userData?.stripeSubscriptionId,
      isPayAsYouGo: userData?.stripeUsageId && !userData?.stripeSubscriptionId,
      isNewHelpSession,
    });

    // Check for pay-as-you-go users - they have a usage ID
    // Only charge if this is a new help session AND they've exceeded their free chats
    const shouldChargePAYG =
      userData &&
      userData.stripeUsageId &&
      isNewHelpSession &&
      userPlan.type === "PAYGO" &&
      chatLimits.remainingChats === 0;
    if (shouldChargePAYG) {
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
    } else if (
      userData &&
      userData.stripeUsageId &&
      isNewHelpSession &&
      userPlan.type === "PAYGO" &&
      chatLimits.remainingChats > 0
    ) {
      console.log(
        "PAYG user within free chat limit - not charging for this session"
      );
    } else {
      console.log(
        "User has no usage ID or is not on pay-as-you-go plan, skipping usage reporting"
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: newMessage,
      paygWarning: paygWarning,
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
