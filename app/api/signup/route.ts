import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password, confirmPassword } = await req.json();

    if (!name || !email || !phone || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 409 }
      );
    }

    // 1. Hash their password
    const hashed = await bcrypt.hash(password, 10);

    // 2. Generate fallback avatar URL via DiceBear initials
    const avatarUrl = `https://avatars.dicebear.com/api/initials/${encodeURIComponent(
      name
    )}.svg?background=%23F4C95D&size=80`;

    // 3. Create the user, saving imageUrl
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashed,
        imageUrl: avatarUrl, // <-- fallback avatar stored here
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("signup error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
