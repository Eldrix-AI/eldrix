"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

      <form
        onSubmit={handleSubmit}
        className="mt-12 w-full max-w-md bg-white p-8 rounded-lg shadow-lg space-y-4"
      >
        {error && <p className="text-red-500">{error}</p>}
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
    </main>
  );
}
