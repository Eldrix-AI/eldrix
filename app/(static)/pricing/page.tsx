"use client";
// app/pricing/page.tsx
// Next 15 – Eldrix.app pricing page (Tailwind CSS, no footer / navbar)

import Link from "next/link";
import { FaCheckCircle, FaStar } from "react-icons/fa";
import { useState } from "react";

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly" | "paygo">(
    "monthly"
  );

  const renderPlans = () => {
    switch (activeTab) {
      case "monthly":
        return (
          <>
            <PlanCard
              tier="Free"
              price="$0"
              subtitle="Perfect for getting started"
              cta="Start Free"
              href="/signup?plan=free"
              features={[
                "3 sessions per month (unlimited length)",
                "Phone, text, or in-app support",
                "Monthly tech newsletter",
                "Dashboard to view past sessions",
                "Access to all support channels",
              ]}
            />
            <PlanCard
              tier="Plus Monthly"
              price="$20"
              subtitle="Priority support and unlimited chats"
              cta="Go Plus"
              href="/signup?plan=plus-monthly"
              featured
              features={[
                "Everything in Free",
                "Priority queue – skip the line",
                "Unlimited chats per month",
                "Priority support response",
              ]}
            />
          </>
        );
      case "yearly":
        return (
          <>
            <PlanCard
              tier="Free"
              price="$0"
              subtitle="Perfect for getting started"
              cta="Start Free"
              href="/signup?plan=free"
              features={[
                "3 sessions per month (unlimited length)",
                "Phone, text, or in-app support",
                "Monthly tech newsletter",
                "Dashboard to view past sessions",
                "Access to all support channels",
              ]}
            />
            <PlanCard
              tier="Plus Yearly"
              price="$17"
              subtitle="Save $36/year with annual billing"
              cta="Go Plus Yearly"
              href="/signup?plan=plus-yearly"
              featured
              features={[
                "Everything in Plus Monthly",
                "Priority queue – skip the line",
                "Unlimited chats per month",
                "Priority support response",
                "Billed annually ($204/year)",
              ]}
            />
          </>
        );
      case "paygo":
        return (
          <>
            <PlanCard
              tier="Pay As You Go"
              price="$9"
              subtitle="Perfect for occasional use"
              cta="Get Started"
              href="/signup?plan=paygo"
              features={[
                "After your 3 free sessions",
                "$9 per additional question",
                "Phone, text, or in-app support",
                "Monthly tech newsletter",
                "Dashboard to view past sessions",
              ]}
            />
            <PlanCard
              tier="Priority Pay As You Go"
              price="$11"
              subtitle="Skip the line, pay per use"
              cta="Get Started"
              href="/signup?plan=priority-paygo"
              featured
              features={[
                "After your 3 free sessions",
                "$11 per additional question",
                "Priority queue – skip the line",
                "Phone, text, or in-app support",
                "Priority support response",
              ]}
            />
          </>
        );
    }
  };

  return (
    <main className="min-h-screen bg-[#FDF9F4] flex flex-col items-center px-4 py-16">
      {/* Heading */}
      <header className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2D3E50]">
          Pricing
        </h1>
        <p className="mt-4 text-[#2D3E50]/80 leading-relaxed">
          Choose the plan that's right for you and get the tech support you
          need.
        </p>
      </header>

      {/* Pricing Tabs */}
      <div className="mt-12 flex gap-2 bg-white rounded-lg p-1 border border-[#C9D2E0]">
        <button
          onClick={() => setActiveTab("monthly")}
          className={`px-6 py-3 rounded-md font-semibold transition ${
            activeTab === "monthly"
              ? "bg-[#2D3E50] text-white"
              : "text-[#2D3E50] hover:bg-[#2D3E50]/10"
          }`}
        >
          Monthly Plans
        </button>
        <button
          onClick={() => setActiveTab("yearly")}
          className={`px-6 py-3 rounded-md font-semibold transition ${
            activeTab === "yearly"
              ? "bg-[#2D3E50] text-white"
              : "text-[#2D3E50] hover:bg-[#2D3E50]/10"
          }`}
        >
          Yearly Plans
        </button>
        <button
          onClick={() => setActiveTab("paygo")}
          className={`px-6 py-3 rounded-md font-semibold transition ${
            activeTab === "paygo"
              ? "bg-[#2D3E50] text-white"
              : "text-[#2D3E50] hover:bg-[#2D3E50]/10"
          }`}
        >
          Pay As You Go
        </button>
      </div>

      {/* Plans */}
      <section className="mt-16 grid gap-12 md:grid-cols-2 w-full max-w-4xl">
        {renderPlans()}
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
      {tier === "Plus Monthly" && (
        <p className="text-[#2D3E50]/70 text-sm mt-1">per month</p>
      )}
      {tier === "Plus Yearly" && (
        <p className="text-[#2D3E50]/70 text-sm mt-1">per month</p>
      )}
      {(tier === "Pay As You Go" || tier === "Priority Pay As You Go") && (
        <p className="text-[#2D3E50]/70 text-sm mt-1">per question</p>
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
