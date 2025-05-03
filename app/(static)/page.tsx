// app/page.tsx
// Next 15 front page for Eldrix.app (Tailwind only – no footer / navbar)

import Image from "next/image";
import Link from "next/link";
import { FaPhoneAlt, FaHandshake, FaShieldAlt } from "react-icons/fa"; // Font Awesome icons via react‑icons

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FDF9F4] flex flex-col items-center px-4 py-16">
      {/* Logo + Brand */}
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/logos/icon.png"
          alt="Eldrix.app logo"
          width={160}
          height={160}
          priority
        />
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2D3E50]">
          Eldrix<span className="text-[#2D3E50]">.</span>app
        </h1>
        <p className="text-lg md:text-xl text-[#5A7897] font-medium">
          Smart Support for Seniors
        </p>
      </div>

      {/* Hero CTA */}
      <section className="mt-12 w-full max-w-2xl text-center">
        <p className="text-[#2D3E50]/80 leading-relaxed text-base md:text-lg">
          Instant, patient tech help—whenever you need it. No jargon, no long
          waits—just friendly guidance to keep you confident and connected.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="rounded-lg bg-[#2D3E50] px-8 py-3 text-white font-semibold transition hover:bg-[#24466d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D3E50]"
          >
            Get Started Free
          </Link>
          <Link
            href="/learn-more"
            className="rounded-lg border border-[#2D3E50] px-8 py-3 text-[#2D3E50] font-semibold transition hover:bg-[#2D3E50]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D3E50]"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Simple Features */}
      <section className="mt-16 grid gap-10 md:grid-cols-3 w-full max-w-4xl">
        {[
          {
            title: "Always Available",
            desc: "24/7 chat & voice assistance—no appointments.",
            Icon: FaPhoneAlt,
          },
          {
            title: "Senior‑Friendly",
            desc: "Patient guidance in clear, simple language.",
            Icon: FaHandshake,
          },
          {
            title: "Safe & Secure",
            desc: "Built‑in scam alerts and privacy‑first design.",
            Icon: FaShieldAlt,
          },
        ].map(({ title, desc, Icon }) => (
          <div
            key={title}
            className="flex flex-col items-center text-center px-6 transform transition hover:-translate-y-1"
          >
            <Icon className="text-4xl text-[#2D3E50] mb-3" />
            <h3 className="text-xl font-semibold text-[#2D3E50] mb-2">
              {title}
            </h3>
            <p className="text-[#5A7897] text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Why Eldrix */}
      <section className="mt-24 w-full max-w-3xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-[#2D3E50]">
          Have You—or a Loved One—Struggled with Technology?
        </h2>
        <p className="mt-4 text-[#2D3E50]/80 leading-relaxed">
          Eldrix.app makes tech easy again. Whether it’s setting up a new phone,
          joining a video call, or spotting a scam, our friendly support is just
          a tap away—day or night.
        </p>
      </section>

      {/* Getting Started Strip */}
      <section className="mt-20 w-full max-w-5xl">
        <h2 className="text-center text-2xl md:text-3xl font-bold text-[#2D3E50] mb-10">
          Getting Started Is Easy
        </h2>
        <div className="grid gap-12 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Sign Up in Minutes",
              desc: "Create your account or let a family member register for you—no credit card required.",
            },
            {
              step: "2",
              title: "Free First Session",
              desc: "Chat with our helper to solve your first tech issue at no cost.",
            },
            {
              step: "3",
              title: "Human Backup on Demand",
              desc: "Need extra help? A friendly specialist is one click away.",
            },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              className="flex flex-col items-center text-center px-4"
            >
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-[#2D3E50] text-white text-lg font-bold mb-4 animate-pulse">
                {step}
              </div>
              <h3 className="text-lg font-semibold text-[#2D3E50] mb-1">
                {title}
              </h3>
              <p className="text-sm text-[#5A7897] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Panel */}
      <section className="mt-24 w-full bg-[#2D3E50] rounded-lg py-12 px-6 text-center max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Ready to Try Eldrix.app?
        </h2>
        <p className="text-white/90 mt-2 max-w-xl mx-auto">
          Your first session is on us. Experience hassle‑free tech help today.
        </p>
        <Link
          href="/signup"
          className="inline-block mt-6 rounded-lg bg-white text-[#2D3E50] font-semibold px-10 py-3 transition hover:bg-[#F0F4F8]"
        >
          Get Started Free
        </Link>
      </section>
    </main>
  );
}
