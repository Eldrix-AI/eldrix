import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { put } from "@vercel/blob";

// Expect BLOB_READ_WRITE_TOKEN in env
const BLOB_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN || process.env.blob_READ_WRITE_TOKEN || "";

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    if (!BLOB_TOKEN) {
      return NextResponse.json(
        { error: "Missing BLOB_READ_WRITE_TOKEN" },
        { status: 500 }
      );
    }

    // Generate a unique filename and path
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 12)}.${ext}`;
    const blobPath = `eldrix/${fileName}`;

    // Upload to Vercel Blob
    const { url } = await put(blobPath, file, {
      access: "public",
      token: BLOB_TOKEN,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
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
