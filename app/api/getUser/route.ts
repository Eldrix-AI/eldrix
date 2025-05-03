import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { NextResponse } from "next/server";
import { getUserById } from "../../../lib/db";
import { techUsage as techUsageLib } from "../../../db/index.mjs";

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

    // Try to get tech usage details from TechUsage table
    let techUsageData = [];
    try {
      const techUsageItems = await techUsageLib.getTechUsagesByUserId(userId);
      if (
        techUsageItems &&
        Array.isArray(techUsageItems) &&
        techUsageItems.length > 0
      ) {
        // Extract device names for the simple list view
        techUsageData = techUsageItems.map((item: any) => item.deviceName);
      }
    } catch (techError) {
      console.error("Error fetching tech usage data:", techError);
      // Fall back to the user.techUsage field
      try {
        techUsageData = JSON.parse(user.techUsage || "[]");
      } catch {
        techUsageData = [];
      }
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
      techUsage: JSON.stringify(techUsageData),
      accessibilityNeeds: user.accessibilityNeeds || "",
      preferredContactMethod: user.preferredContactMethod || "",
      experienceLevel: user.experienceLevel || "",
      // Include the new fields
      notification: !!user.notification,
      darkMode: !!user.darkMode,
      emailList: !!user.emailList,
      smsConsent: !!user.smsConsent,
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
