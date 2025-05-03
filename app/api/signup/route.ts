// app/api/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "../../../lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      smsConsent,
      emailList,
    } = await req.json();

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword ||
      !smsConsent ||
      !emailList
    )
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );

    if (password !== confirmPassword)
      return NextResponse.json(
        { error: "Passwords must match." },
        { status: 400 }
      );

    if (!smsConsent)
      return NextResponse.json(
        { error: "SMS consent required." },
        { status: 400 }
      );

    const existing = await getUserByEmail(email);
    if (existing)
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );

    const hashed = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
      name
    )}&background=%23F4C95D&size=128`;

    const userId = uuidv4();

    // Prepare user data with fields matching the database schema
    const userData = {
      id: userId,
      name: name || "",
      email: email || "",
      phone: phone || "",
      password: hashed,
      imageUrl: avatarUrl || "",
      description: "",
      smsConsent: Boolean(smsConsent),
      emailList: Boolean(emailList),
      age: null,
      techUsage: "[]",
      accessibilityNeeds: "",
      preferredContactMethod: "",
      experienceLevel: "",
    };

    console.log("Creating user with data:", JSON.stringify(userData, null, 2));

    const user = await createUser(userData);

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("Signup error details:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
