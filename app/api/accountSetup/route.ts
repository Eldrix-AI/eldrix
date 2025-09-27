import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, updateUser } from "../../../lib/db";
import {
  createTechUsage,
  deleteAllUserTechUsages,
} from "../../../db/techUsage.mjs";

export async function POST(req: Request) {
  try {
    const {
      email,
      currentPassword,
      newPassword,
      name,
      phone,
      description,
      age,
      accessibilityNeeds,
      preferredContactMethod,
      experienceLevel,
      emailList,
      techUsageItems = [],
    } = await req.json();

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Email, current password, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Get the user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Verify the current password matches (for security)
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    // Hash the new password using the same method as signup
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Prepare user data for update
    const updateData: any = {
      password: hashedNewPassword,
    };

    // Add optional fields if provided
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (description) updateData.description = description;
    if (age) updateData.age = age;
    if (accessibilityNeeds) updateData.accessibilityNeeds = accessibilityNeeds;
    if (preferredContactMethod)
      updateData.preferredContactMethod = preferredContactMethod;
    if (experienceLevel) updateData.experienceLevel = experienceLevel;
    if (emailList !== undefined) updateData.emailList = emailList ? 1 : 0;

    // Update the user
    await updateUser(user.id, updateData);

    // Handle tech usage items
    if (techUsageItems && techUsageItems.length > 0) {
      // Delete existing tech usage items for this user
      await deleteAllUserTechUsages(user.id);

      // Create new tech usage items
      for (const item of techUsageItems) {
        await createTechUsage({
          userId: user.id,
          deviceType: item.deviceType,
          deviceName: item.deviceName,
          skillLevel: item.skillLevel,
          usageFrequency: item.usageFrequency,
          notes: item.notes || null,
        });
      }
    }

    console.log("Account setup completed for user:", user.id);

    return NextResponse.json(
      {
        message: "Account setup completed successfully",
        userId: user.id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Account setup error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
