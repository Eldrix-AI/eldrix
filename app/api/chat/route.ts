import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { helpSessions, messages } from "../../../db/index.mjs";

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

    // Parse form data (may include text message and/or image)
    const formData = await request.formData();
    const text = formData.get("message") as string;
    const file = formData.get("file") as File | null;
    const helpSessionId = formData.get("helpSessionId") as string | null;
    const priority = (formData.get("priority") as string) || "medium";
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

    // If no help session ID provided, create a new one
    if (!sessionId) {
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
