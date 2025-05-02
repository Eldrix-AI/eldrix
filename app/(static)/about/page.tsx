// app/about/page.tsx
// Next 15 – Eldrix.app “About” page (Tailwind only – no footer / navbar)

import Image from "next/image";
import Link from "next/link";
import { FaHeart, FaLightbulb } from "react-icons/fa";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FDF9F4] flex flex-col items-center px-4 py-16">
      {/* Hero / Intro */}
      <header className="text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2D3E50]">
          Why Eldrix.app?
        </h1>
        <p className="mt-4 text-[#2D3E50]/80 leading-relaxed">
          Because no one should feel left behind when the world goes digital.
        </p>
      </header>

      {/* Founder story */}
      <section className="mt-16 w-full max-w-4xl grid gap-12 md:grid-cols-2 items-center">
        {/* Founder image + caption */}
        <figure className="rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden">
          <Image
            src="/photos/meGoogle.jpg"
            alt="Founder portrait"
            width={500}
            height={500}
            className="object-cover"
          />
          <figcaption className="text-center text-sm italic text-[#2D3E50]/70 mt-2">
            *Me when I was at Google*
          </figcaption>
        </figure>

        <div className="space-y-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#2D3E50]">
            <FaLightbulb className="text-[#F4C95D]" />A Personal Mission
          </h2>
          <p className="text-[#2D3E50]/90 leading-relaxed">
            Hi—I'm <strong>David</strong>. For years I was the go‑to tech helper
            for my parents, neighbors, and almost every senior I met. I loved
            solving their problems, but I kept hearing the same worries:
            <em> “I don’t want to bother my kids” </em> and{" "}
            <em>“Tech support never explains anything clearly.”</em>
          </p>
          <p className="text-[#2D3E50]/90 leading-relaxed">
            I founded <strong>Eldrix.app</strong> to give older adults a safe,
            patient place to get answers <em>without</em> long waits or
            confusing jargon. Our service blends friendly human care with smart
            technology so help is there the moment it’s needed.
          </p>
        </div>
      </section>

      {/* Angie testimonial */}
      <section className="mt-24 w-full max-w-4xl grid gap-12 md:grid-cols-2 items-center">
        <div className="space-y-6 order-2 md:order-1">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#2D3E50]">
            <FaHeart className="text-[#5AA897]" />
            Meet Angie
          </h2>
          <p className="italic text-[#2D3E50]/80">
            “I used to panic every time my phone popped up a weird message. I’d
            wait for David to visit and fix it. Now I just open Eldrix and get
            calm, step‑by‑step help in seconds. I feel independent again.”
          </p>
          <p className="text-[#2D3E50]/90">
            Angie was the inspiration for our very first prototype. Today, she
            chats with Eldrix whenever she needs a little tech confidence—and
            David still checks in, but now as a friend instead of a stressed‑out
            tech support line.
          </p>
        </div>

        {/* Angie image + caption */}
        <figure className="rounded-3xl shadow-md hover:shadow-xl transition overflow-hidden order-1 md:order-2">
          <Image
            src="/photos/me.jpg"
            alt="Photo of Angie and young David"
            width={500}
            height={500}
            className="object-cover"
          />
          <figcaption className="text-center text-sm italic text-[#2D3E50]/70 mt-2">
            *A young me and Grandma Angie together*
          </figcaption>
        </figure>
      </section>

      {/* CTA Panel */}
      <section className="mt-24 w-full bg-[#2D3E50] rounded-lg py-12 px-6 text-center max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Ready to Feel Confident with Technology?
        </h2>
        <p className="text-white/90 mt-2 max-w-xl mx-auto">
          Join Angie and thousands of others who trust Eldrix.app for clear,
          patient tech help—day or night.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="rounded-lg bg-white text-[#2D3E50] font-semibold px-10 py-3 transition hover:bg-[#F0F4F8]"
          >
            Get Started Free
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-white text-white font-semibold px-10 py-3 transition hover:bg-white/10"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
