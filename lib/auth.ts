// lib/auth.ts
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { getUserByEmail, createUser } from "./db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export const authOptions: NextAuthOptions = {
  // ---- everything you already had ----
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "",
  jwt: {
    secret: process.env.NEXTAUTH_SECRET || "",
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutes
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutes
      },
    },
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "you@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const user = await getUserByEmail(email);
        if (!user) return null;

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

        return { id: user.id.toString(), name: user.name, email: user.email };
      },
    }),
  ],
  debug: process.env.NODE_ENV !== "production",
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle social login users
      if (account?.provider === "google" || account?.provider === "apple") {
        if (!user.email) return false;

        // Check if user exists
        const existingUser = await getUserByEmail(user.email);

        if (!existingUser) {
          // Create new user for social login
          const userId = uuidv4();
          const avatarUrl =
            user.image ||
            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
              user.email
            )}&background=%23F4C95D&size=128`;

          const userData = {
            id: userId,
            name: user.name || "User",
            email: user.email,
            phone: "000-000-0000", // Default phone until collected in onboarding
            password: "", // No password for social login users
            imageUrl: avatarUrl,
            description: "",
            smsConsent: false,
            emailList: true,
            age: null,
            techUsage: "[]",
            accessibilityNeeds: "",
            preferredContactMethod: "phone",
            experienceLevel: "beginner",
          };

          try {
            await createUser(userData);
          } catch (error) {
            console.error("Error creating social login user:", error);
            return false;
          }
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // For social login users, we need to get the user ID from the database
        if (account?.provider === "google" || account?.provider === "apple") {
          const dbUser = await getUserByEmail(user.email!);
          if (dbUser) {
            token.id = dbUser.id;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user = session.user || {};
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
