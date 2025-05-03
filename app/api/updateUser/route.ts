import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { NextResponse } from "next/server";
import { getUserByEmail, updateUser } from "../../../lib/db";

export async function POST(request: Request) {
  // Check session for authentication
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Ensure user can only update their own account
    if (data.id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email is already taken (by another user)
    const existingUser = await getUserByEmail(data.email);

    if (existingUser && existingUser.id !== data.id) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Update user in database
    const updateData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      imageUrl: data.imageUrl,
      description: data.description,
      age: data.age ? parseInt(data.age) : null,
      techUsage: data.techUsage,
      accessibilityNeeds: data.accessibilityNeeds,
      preferredContactMethod: data.preferredContactMethod,
      experienceLevel: data.experienceLevel,
    };

    const updatedUser = await updateUser(data.id, updateData);

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user data" },
      { status: 500 }
    );
  }
}
