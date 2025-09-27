import { NextResponse } from "next/server";
import { getUserByEmail } from "../../../lib/db";
import { getTechUsagesByUserId } from "../../../db/techUsage.mjs";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    // Get the user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Get user's tech usage items
    const techUsageItems = await getTechUsagesByUserId(user.id);

    // Return user data (excluding password for security)
    const { password, ...userData } = user;

    return NextResponse.json(
      {
        user: userData,
        techUsageItems,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Get user data error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
