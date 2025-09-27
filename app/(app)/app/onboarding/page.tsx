"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaPhone, FaArrowRight, FaArrowLeft } from "react-icons/fa";

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not authenticated (but wait for session to load)
  useEffect(() => {
    if (session === null) {
      router.push("/login");
    }
  }, [session, router]);

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 10;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!smsConsent) {
      setError("You must agree to receive SMS & calls for support.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/onboarding/step1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ""), // Store clean number without formatting
          smsConsent: smsConsent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/app/dashboard");
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6,
        10
      )}`;
    } else if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  // Show loading while session is being fetched
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#FDF9F4] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D3E50]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F4]">
      {/* Header */}
      <header className="bg-[#2D3E50] p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-white text-2xl font-bold">Eldrix</h1>
          <div className="text-white text-sm">Step {step} of 2</div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center">
            <div
              className={`h-2 flex-1 rounded-full ${
                step >= 1 ? "bg-[#2D3E50]" : "bg-gray-200"
              }`}
            ></div>
            <div className="mx-2 w-2 h-2 rounded-full bg-gray-300"></div>
            <div
              className={`h-2 flex-1 rounded-full ${
                step >= 2 ? "bg-[#2D3E50]" : "bg-gray-200"
              }`}
            ></div>
          </div>
        </div>
      </div>

      <main className="flex justify-center items-center min-h-[calc(100vh-120px)] p-6">
        <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow">
          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaPhone className="text-2xl text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-[#2D3E50] mb-2">
                  Let's get to know you
                </h2>
                <p className="text-gray-600">
                  We need a few details to provide you with the best support
                  experience.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                  placeholder="(555) 123-4567"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  We'll use this for quick support calls when you need immediate
                  help.
                </p>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="smsConsent"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="h-4 w-4 text-[#2D3E50] border-gray-300 rounded mt-1"
                  required
                />
                <label
                  htmlFor="smsConsent"
                  className="ml-3 text-sm text-gray-700"
                >
                  I agree to receive SMS messages and phone calls from Eldrix
                  for technical support and account updates.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#2D3E50] text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Saving..." : "Continue"}
                <FaArrowRight />
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <FaArrowRight className="text-2xl text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#2D3E50]">
                Great! You're all set.
              </h2>
              <p className="text-gray-600">
                You can now access your dashboard and start getting help with
                your technology questions.
              </p>
              <p className="text-sm text-gray-500">
                You can always update your preferences and add more details
                about your tech skills in your settings.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleStep2Submit}
                  className="flex-1 py-3 border border-[#C9D2E0] text-[#2D3E50] rounded-lg hover:bg-gray-50"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => router.push("/app/onboarding/preferences")}
                  className="flex-1 py-3 bg-[#2D3E50] text-white rounded-lg flex items-center justify-center gap-2"
                >
                  Add Preferences (Optional)
                  <FaArrowRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
