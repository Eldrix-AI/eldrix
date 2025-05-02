// app/faq/page.tsx
// Next 15 – Eldrix.app FAQ page (Tailwind only – no footer / navbar)
// Uses native <details> / <summary> for expand‑collapse (no JS needed)

import { FaQuestionCircle } from "react-icons/fa";

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#FDF9F4] flex flex-col items-center px-4 py-16">
      {/* Heading */}
      <header className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2D3E50]">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-[#2D3E50]/80 leading-relaxed">
          Answers to the most common questions about Eldrix.app.
        </p>
      </header>

      {/* FAQ List */}
      <section className="mt-16 w-full max-w-3xl space-y-6">
        {FAQ_ITEMS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-xl bg-white shadow-sm transition hover:shadow-md"
          >
            <summary className="flex items-center justify-between cursor-pointer list-none px-6 py-4">
              <span className="flex items-center gap-3 text-[#2D3E50] font-semibold">
                <FaQuestionCircle className="text-[#2D3E50]/80" />
                {q}
              </span>
              {/* chevron */}
              <svg
                className="w-4 h-4 text-[#2D3E50] transition-group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="px-6 pb-4 text-[#2D3E50]/90 leading-relaxed">
              {a}
            </div>
          </details>
        ))}
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

const FAQ_ITEMS = [
  {
    q: "What makes Eldrix different from other tech support?",
    a: "We focus exclusively on older adults. Our helpers speak in clear, jargon‑free language, and our AI is trained to be endlessly patient—no long hold times, no upselling.",
  },
  {
    q: "Is the Free plan really free?",
    a: "Yes. You can try Eldrix at no cost. The Free plan includes AI chat and voice plus three 20‑minute calls and three 20‑minute chats each week.",
  },
  {
    q: "Do I need to install anything?",
    a: "No downloads required. Eldrix runs right in your web browser or phone—just visit Eldrix.app and sign in.",
  },
  {
    q: "Can my family monitor my requests?",
    a: "With the Plus plan your loved ones can access a private dashboard that shows recent requests and resolutions, giving everyone peace of mind.",
  },
  {
    q: "Is my information secure?",
    a: "Absolutely. All sessions are encrypted, and we never share or sell your personal data. Scam alerts are processed securely to keep you protected.",
  },
];
