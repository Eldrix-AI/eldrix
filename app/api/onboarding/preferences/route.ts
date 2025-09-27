import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { updateUser } from "../../../../lib/db";
import {
  createTechUsage,
  deleteAllUserTechUsages,
} from "../../../../db/techUsage.mjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      description,
      age,
      accessibilityNeeds,
      preferredContactMethod,
      experienceLevel,
      emailList,
      techUsageItems = [],
    } = await req.json();

    // Prepare user data for update
    const updateData: any = {};

    // Add fields if provided
    if (description) updateData.description = description;
    if (age) updateData.age = age;
    if (accessibilityNeeds) updateData.accessibilityNeeds = accessibilityNeeds;
    if (preferredContactMethod)
      updateData.preferredContactMethod = preferredContactMethod;
    if (experienceLevel) updateData.experienceLevel = experienceLevel;
    if (emailList !== undefined) updateData.emailList = emailList ? 1 : 0;

    // Update the user if there's data to update
    if (Object.keys(updateData).length > 0) {
      await updateUser(session.user.id, updateData);
    }

    // Handle tech usage items
    if (techUsageItems && techUsageItems.length > 0) {
      // Delete existing tech usage items for this user
      await deleteAllUserTechUsages(session.user.id);

      // Create new tech usage items
      for (const item of techUsageItems) {
        await createTechUsage({
          userId: session.user.id,
          deviceType: item.deviceType,
          deviceName: item.deviceName,
          skillLevel: item.skillLevel,
          usageFrequency: item.usageFrequency,
          notes: item.notes || null,
        });
      }
    }

    return NextResponse.json(
      { message: "Preferences updated successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Onboarding preferences error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
