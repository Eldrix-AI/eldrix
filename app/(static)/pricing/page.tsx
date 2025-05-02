// app/pricing/page.tsx
// Next 15 – Eldrix.app pricing page (Tailwind CSS, no footer / navbar)

import Link from "next/link";
import { FaCheckCircle, FaStar } from "react-icons/fa";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#FDF9F4] flex flex-col items-center px-4 py-16">
      {/* Heading */}
      <header className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2D3E50]">
          Pricing
        </h1>
        <p className="mt-4 text-[#2D3E50]/80 leading-relaxed">
          Choose the plan that’s right for you and stay stress‑free with tech.
        </p>
      </header>

      {/* Plans */}
      <section className="mt-16 grid gap-12 md:grid-cols-2 w-full max-w-4xl">
        {/* Free Plan */}
        <PlanCard
          tier="Free"
          price="$0"
          subtitle="Best for trying Eldrix"
          cta="Start Free"
          href="/signup?plan=free"
          features={[
            "All AI chat & voice features",
            "3 calls per week (20 min each)",
            "3 chats per week (20 min each)",
            "Scam alert protection",
            "Monthly tech‑tips newsletter",
            "Dashboard & notifications",
          ]}
        />

        {/* Plus Plan */}
        <PlanCard
          tier="Plus"
          price="$20"
          subtitle="Priority support, no limits"
          cta="Go Plus"
          href="/signup?plan=plus"
          featured
          features={[
            "Everything in Free",
            "Priority queue – skip the line",
            "10 calls per week (unlimited length)",
            "10 chats per week (unlimited length)",
            "Issue stays open until fixed",
            "Personalized device health checks",
            "Family dashboard integration",
          ]}
        />
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper component for a single plan                                         */
/* -------------------------------------------------------------------------- */

function PlanCard({
  tier,
  price,
  subtitle,
  features,
  cta,
  href,
  featured = false,
}: {
  tier: string;
  price: string;
  subtitle: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border border-[#C9D2E0] bg-white p-8 shadow-sm
        transform transition hover:shadow-xl hover:-translate-y-2 ${
          featured ? "ring-4 ring-[#2D3E50]/20" : ""
        }`}
    >
      {/* Tier header */}
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-[#2D3E50]">{tier}</h2>
        {featured && (
          <FaStar className="text-[#F4C95D] text-xl animate-bounce-slow" />
        )}
      </div>
      <p className="mt-1 text-[#2D3E50]/80">{subtitle}</p>

      {/* Price */}
      <p className="mt-6 text-4xl font-extrabold text-[#2D3E50]">{price}</p>
      {tier === "Plus" && (
        <p className="text-[#2D3E50]/70 text-sm mt-1">per month</p>
      )}

      {/* Feature list */}
      <ul className="mt-8 space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <FaCheckCircle className="text-[#5AA897] mt-1" />
            <span className="text-[#2D3E50]/90 text-sm leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={href}
        className={`mt-8 inline-block text-center rounded-lg px-6 py-3 font-semibold transition
          ${
            featured
              ? "bg-[#2D3E50] text-white hover:bg-[#24466d]"
              : "border border-[#2D3E50] text-[#2D3E50] hover:bg-[#2D3E50]/10"
          }`}
      >
        {cta}
      </Link>
    </div>
  );
}


