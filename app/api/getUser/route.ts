import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { NextResponse } from "next/server";
import { getUserById } from "../../../lib/db";

export async function GET(request: Request) {
  // Check session for authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get userId from URL params
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Get user from database based on userId
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user data with all fields
    const userData = {
      id: user.id,
      name: user.name || "User",
      email: user.email,
      phone: user.phone || "",
      imageUrl: user.imageUrl || "/default-avatar.png",
      description: user.description || "",
      age: user.age || null,
      techUsage: user.techUsage || "[]",
      accessibilityNeeds: user.accessibilityNeeds || "",
      preferredContactMethod: user.preferredContactMethod || "",
      experienceLevel: user.experienceLevel || "",
    };

    console.log(userData);

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
