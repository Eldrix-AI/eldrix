"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaCog, FaArrowRight } from "react-icons/fa";

interface TechUsageItem {
  id: string;
  deviceType: string;
  deviceName: string;
  skillLevel: string;
  usageFrequency: string;
  notes: string;
}

export default function OnboardingPreferencesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("phone");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [emailList, setEmailList] = useState(true);

  // Tech usage state
  const [techUsageItems, setTechUsageItems] = useState<TechUsageItem[]>([]);
  const [showTechUsageForm, setShowTechUsageForm] = useState(false);
  const [newTechUsage, setNewTechUsage] = useState({
    deviceType: "",
    deviceName: "",
    skillLevel: "beginner",
    usageFrequency: "rarely",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!session) {
      router.push("/login");
    }
  }, [session, router]);

  const addTechUsageItem = () => {
    if (newTechUsage.deviceType && newTechUsage.deviceName) {
      const item: TechUsageItem = {
        id: Date.now().toString(),
        ...newTechUsage,
      };
      setTechUsageItems([...techUsageItems, item]);
      setNewTechUsage({
        deviceType: "",
        deviceName: "",
        skillLevel: "beginner",
        usageFrequency: "rarely",
        notes: "",
      });
      setShowTechUsageForm(false);
    }
  };

  const removeTechUsageItem = (id: string) => {
    setTechUsageItems(techUsageItems.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/onboarding/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          age: age ? parseInt(age) : null,
          accessibilityNeeds,
          preferredContactMethod,
          experienceLevel,
          emailList,
          techUsageItems,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update preferences");
      }

      router.push("/app/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/app/dashboard");
  };

  if (!session) {
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
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-white text-2xl font-bold">Eldrix</h1>
          <div className="text-white text-sm">Optional Setup</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow p-8">
          <div className="text-center mb-8">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCog className="text-2xl text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#2D3E50] mb-2">
              Tell us more about yourself
            </h2>
            <p className="text-gray-600">
              This helps us provide better, personalized support. All fields are
              optional.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-[#2D3E50] mb-4">
                Basic Information
              </h3>

              <div className="mt-4">
                <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                  About You
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                  placeholder="Tell us a bit about yourself and your tech needs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="1"
                    max="120"
                    className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                    placeholder="Your age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                  Accessibility Needs
                </label>
                <textarea
                  value={accessibilityNeeds}
                  onChange={(e) => setAccessibilityNeeds(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                  placeholder="Any accessibility needs or preferences"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                  Preferred Contact Method
                </label>
                <select
                  value={preferredContactMethod}
                  onChange={(e) => setPreferredContactMethod(e.target.value)}
                  className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                >
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={emailList}
                    onChange={(e) => setEmailList(e.target.checked)}
                    className="rounded border-gray-300 text-[#2D3E50] focus:ring-[#2D3E50]"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Subscribe to email updates and newsletters
                  </span>
                </label>
              </div>
            </div>

            {/* Tech Usage Section */}
            <div className="border-t pt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-[#2D3E50]">
                  Your Technology
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTechUsageForm(!showTechUsageForm)}
                  className="text-[#2D3E50] hover:text-[#2D3E50]/80 text-sm font-medium"
                >
                  {showTechUsageForm ? "Cancel" : "Add Device"}
                </button>
              </div>

              {showTechUsageForm && (
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                        Device Type
                      </label>
                      <input
                        type="text"
                        value={newTechUsage.deviceType}
                        onChange={(e) =>
                          setNewTechUsage({
                            ...newTechUsage,
                            deviceType: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                        placeholder="e.g., Smartphone, Laptop, Tablet"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                        Device Name
                      </label>
                      <input
                        type="text"
                        value={newTechUsage.deviceName}
                        onChange={(e) =>
                          setNewTechUsage({
                            ...newTechUsage,
                            deviceName: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                        placeholder="e.g., iPhone 14, MacBook Pro"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                        Skill Level
                      </label>
                      <select
                        value={newTechUsage.skillLevel}
                        onChange={(e) =>
                          setNewTechUsage({
                            ...newTechUsage,
                            skillLevel: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                        Usage Frequency
                      </label>
                      <select
                        value={newTechUsage.usageFrequency}
                        onChange={(e) =>
                          setNewTechUsage({
                            ...newTechUsage,
                            usageFrequency: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                      >
                        <option value="rarely">Rarely</option>
                        <option value="occasionally">Occasionally</option>
                        <option value="frequently">Frequently</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[#2D3E50] mb-2">
                      Notes
                    </label>
                    <textarea
                      value={newTechUsage.notes}
                      onChange={(e) =>
                        setNewTechUsage({
                          ...newTechUsage,
                          notes: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full rounded-lg border border-[#C9D2E0] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                      placeholder="Any additional notes about this device"
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={addTechUsageItem}
                      className="bg-[#2D3E50] text-white px-4 py-2 rounded-md hover:bg-[#2D3E50]/90 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40"
                    >
                      Add Device
                    </button>
                  </div>
                </div>
              )}

              {techUsageItems.length > 0 && (
                <div className="space-y-2">
                  {techUsageItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 p-3 rounded-md flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium">{item.deviceType}</span> -{" "}
                        {item.deviceName}
                        <span className="text-sm text-gray-500 ml-2">
                          ({item.skillLevel}, {item.usageFrequency})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTechUsageItem(item.id)}
                        className="text-red-600 hover:text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-3 border border-[#C9D2E0] text-[#2D3E50] rounded-lg hover:bg-gray-50"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-[#2D3E50] text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Saving..." : "Save & Continue"}
                <FaArrowRight />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
