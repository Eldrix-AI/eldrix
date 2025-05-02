/* -------------------------------------------------------------------------- */
/* app/terms/page.tsx  –  Eldrix.app “Terms of Service”                       */
/* -------------------------------------------------------------------------- */

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FDF9F4] flex flex-col items-center px-4 py-16">
      {/* Heading */}
      <header className="text-center max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2D3E50]">
          Terms of Service
        </h1>
        <p className="mt-4 text-[#2D3E50]/80 leading-relaxed">
          Please read these simple terms before using Eldrix.app.
        </p>
      </header>

      {/* Content */}
      <article className="mt-16 w-full max-w-3xl space-y-12 text-[#2D3E50]/90 text-sm leading-6">
        {/* 1 */}
        <section>
          <h2 className="text-xl font-semibold text-[#2D3E50] mb-2">1. Use</h2>
          <p>
            By accessing Eldrix.app you agree to act lawfully, treat support
            staff respectfully, and refrain from misusing the service.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-semibold text-[#2D3E50] mb-2">
            2. Subscriptions
          </h2>
          <p>
            Free and Plus plans renew monthly until cancelled. Plus is{" "}
            <strong>$20 USD / month</strong>. Cancel anytime from your account
            settings.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-semibold text-[#2D3E50] mb-2">
            3. Cancellation & Refunds
          </h2>
          <p>
            If Eldrix.app is unavailable for 24 hours or longer, contact support
            for a pro‑rated credit or refund.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-semibold text-[#2D3E50] mb-2">
            4. Liability
          </h2>
          <p>
            We work hard to keep Eldrix.app reliable, but we are not liable for
            indirect or consequential damages arising from use of the service.
          </p>
        </section>

        <p className="text-xs text-[#2D3E50]/60">
          Last updated May 2025.  For full legal language, email 
          <a
            href="mailto:legal@eldrix.app"
            className="underline text-[#2D3E50]"
          >
            legal@eldrix.app
          </a>
          .
        </p>
      </article>
    </main>
  );
}
