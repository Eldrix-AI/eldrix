// app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail } from "../../../../lib/db"; // your db client import
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // Use JWT sessions
  session: { strategy: "jwt" },
  // Add a fallback secret if environment variable is not set
  secret: process.env.NEXTAUTH_SECRET || "",

  // Add JWT configuration
  jwt: {
    // Use the same secret for JWT
    secret: process.env.NEXTAUTH_SECRET || "",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },

  // Configure one Credentials provider
  providers: [
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
        try {
          if (!credentials?.email || !credentials.password) {
            console.error("Missing email or password");
            return null;
          }

          // 1. Lookup user by email
          const normalizedEmail = credentials.email.trim().toLowerCase();
          console.log("Looking up user:", normalizedEmail);

          const user = await getUserByEmail(normalizedEmail);

          if (!user) {
            console.error("No user found with email:", normalizedEmail);
            return null;
          }

          // 2. Compare passwords
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            console.error("Invalid password for user:", user.email);
            return null;
          }

          console.log("Authentication successful for:", user.email);

          // 3. Return the minimal user object
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],

  // Optional: custom pages
  pages: {
    signIn: "/login", // your LoginPage route
  },

  // Debug mode in development
  debug: process.env.NODE_ENV !== "production",

  // Optional: callbacks to include user.id in the JWT
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
