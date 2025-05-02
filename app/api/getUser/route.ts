import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Here you would typically fetch more user data from your database
  // using the session.user.id as reference
  const userData = {
    id: session.user.id,
    name: session.user.name || "User",
    email: session.user.email,
    profilePictureUrl: session.user.image || "/default-avatar.png",
    phoneNumber: "Add your phone number", // Default since phone isn't in the session
  };

  return NextResponse.json(userData);
}
