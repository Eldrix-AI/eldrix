// app/contact/page.tsx
// Next 15 – Eldrix.app contact page
// Tailwind CSS ‑ same palette, subtle animations

"use client";

import { useState } from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <main className="min-h-screen bg-[#FDF9F4] flex flex-col items-center px-4 py-16">
      {/* Heading */}
      <header className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2D3E50]">
          Get in Touch
        </h1>
        <p className="mt-4 text-[#2D3E50]/80 leading-relaxed">
          Questions or feedback? We’d love to hear from you.
        </p>
      </header>

      {/* Grid */}
      <section className="mt-12 w-full max-w-4xl grid gap-16 md:grid-cols-2">
        {/* Static contact info */}
        <div className="space-y-6 text-[#2D3E50]">
          <ContactLine
            Icon={FaEnvelope}
            label="Email"
            value="info@eldrix.app"
          />
          <ContactLine Icon={FaPhoneAlt} label="Phone" value="720‑612‑969" />
          <ContactLine
            Icon={FaMapMarkerAlt}
            label="Location"
            value="Tempe, Arizona"
          />
        </div>

        {/* Form */}
        {sent ? (
          <div className="flex flex-col justify-center items-center text-center">
            <h2 className="text-2xl font-semibold text-[#2D3E50]">
              Thank you!
            </h2>
            <p className="text-[#2D3E50]/80 mt-2">
              We’ll reply as soon as we can.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="space-y-6"
          >
            <FormField label="Name" name="name" type="text" />
            <FormField label="Email" name="email" type="email" />
            <FormField label="Phone" name="phone" type="tel" />
            <FormField label="Message" name="message" as="textarea" rows={4} />

            <button
              type="submit"
              className="w-full rounded-lg bg-[#2D3E50] px-6 py-3 text-white font-semibold transition
                         hover:bg-[#24466d] active:scale-95 focus-visible:outline focus-visible:outline-2
                         focus-visible:outline-offset-2 focus-visible:outline-[#2D3E50]"
            >
              Send Message
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable helpers                                                           */
/* -------------------------------------------------------------------------- */

function ContactLine({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 group">
      <Icon className="text-2xl mt-1 text-[#2D3E50] group-hover:animate-bounce" />
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-[#2D3E50]/80">{value}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  as,
  rows,
}: {
  label: string;
  name: string;
  type?: string;
  as?: "textarea";
  rows?: number;
}) {
  const base =
    "w-full mt-2 rounded-lg border border-[#C9D2E0] bg-white px-4 py-2 text-[#2D3E50] focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40 transition";

  return (
    <div>
      <label htmlFor={name} className="font-medium text-[#2D3E50]">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea id={name} name={name} rows={rows} className={base} required />
      ) : (
        <input id={name} name={name} type={type} className={base} required />
      )}
    </div>
  );
}
