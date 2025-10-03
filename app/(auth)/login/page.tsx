"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaGoogle, FaApple } from "react-icons/fa";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (res?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/app/dashboard");
    }
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    try {
      await signIn(provider, { callbackUrl: "/app/onboarding" });
    } catch (error) {
      setError(`Failed to sign in with ${provider}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDF9F4] flex flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/logos/icon.png"
          alt="Eldrix.app logo"
          width={160}
          height={160}
          priority
        />
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2D3E50]">
          Login to Eldrix.app
        </h1>
        <p className="text-lg md:text-xl text-[#5A7897] font-medium">
          Enter your email and password to continue.
        </p>
      </div>

      <div className="mt-12 w-full max-w-md bg-white p-8 rounded-lg shadow-lg space-y-6">
        {error && <p className="text-red-500 text-center">{error}</p>}

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin("google")}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold transition hover:bg-gray-50 hover:border-gray-400"
          >
            <FaGoogle className="text-red-500" size={20} />
            Continue with Google
          </button>

          {/* <button
            onClick={() => handleSocialLogin("apple")}
            className="w-full flex items-center justify-center gap-3 bg-black text-white py-3 px-4 rounded-lg font-semibold transition hover:bg-gray-800"
          >
            <FaApple size={20} />
            Continue with Apple
          </button> */}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2D3E50]"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2D3E50]"
            required
          />
          <button
            type="submit"
            className="w-full bg-[#2D3E50] text-white py-3 text-lg rounded-lg font-semibold transition hover:bg-[#24466d]"
          >
            Log In
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-[#2D3E50] font-semibold hover:underline"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
