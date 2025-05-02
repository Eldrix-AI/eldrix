/* -------------------------------------------------------------------------- */
/* app/privacy/page.tsx  –  Eldrix.app “Privacy Policy”                       */
/* -------------------------------------------------------------------------- */

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FDF9F4] flex flex-col items-center px-4 py-16">
      {/* Heading */}
      <header className="text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2D3E50]">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[#2D3E50]/80 leading-relaxed">
          How we collect, use, and protect your information at Eldrix.app.
        </p>
      </header>

      {/* Content */}
      <article className="mt-16 w-full max-w-3xl space-y-12 text-[#2D3E50]/90 text-sm leading-6">
        {/* 1 */}
        <section>
          <h2 className="text-xl font-semibold text-[#2D3E50] mb-2">
            1. Data We Collect
          </h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>Name and email for account setup</li>
            <li>Device details to diagnose issues</li>
            <li>Chat and call transcripts to improve support</li>
          </ul>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-semibold text-[#2D3E50] mb-2">
            2. How We Use Data
          </h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>Provide real‑time tech assistance</li>
            <li>Send scam alerts and service updates</li>
            <li>Improve Eldrix’s AI guidance over time</li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-semibold text-[#2D3E50] mb-2">
            3. Your Choices
          </h2>
          <p>
            You may request a copy or deletion of your data at any time. Email 
            <a
              href="mailto:privacy@eldrix.app"
              className="underline text-[#2D3E50]"
            >
              privacy@eldrix.app
            </a>{" "}
            and we’ll respond within 30 days.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-semibold text-[#2D3E50] mb-2">
            4. Security
          </h2>
          <p>
            All traffic is encrypted (HTTPS). We never sell or rent personal
            data to third parties.
          </p>
        </section>

        <p className="text-xs text-[#2D3E50]/60">
          Last updated May 2025.  Questions? Email 
          <a
            href="mailto:privacy@eldrix.app"
            className="underline text-[#2D3E50]"
          >
            privacy@eldrix.app
          </a>
          .
        </p>
      </article>
    </main>
  );
}
