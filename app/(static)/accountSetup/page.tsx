"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

interface TechUsageItem {
  id: string;
  deviceType: string;
  deviceName: string;
  skillLevel: string;
  usageFrequency: string;
  notes: string;
}

function AccountSetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
  const [success, setSuccess] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const passwordParam = searchParams.get("password");

    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    if (passwordParam) {
      setCurrentPassword(decodeURIComponent(passwordParam));
    }
  }, [searchParams]);

  // Fetch existing user data when email is available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!email) {
        setInitialLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/getUserData", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          const data = await response.json();
          const { user, techUsageItems } = data;

          // Pre-populate form fields with existing user data
          if (user.name) setName(user.name);
          if (user.phone) setPhone(user.phone);
          if (user.description) setDescription(user.description);
          if (user.age) setAge(user.age.toString());
          if (user.accessibilityNeeds)
            setAccessibilityNeeds(user.accessibilityNeeds);
          if (user.preferredContactMethod)
            setPreferredContactMethod(user.preferredContactMethod);
          if (user.experienceLevel) setExperienceLevel(user.experienceLevel);
          if (user.emailList !== undefined)
            setEmailList(Boolean(user.emailList));

          // Pre-populate tech usage items
          if (techUsageItems && techUsageItems.length > 0) {
            setTechUsageItems(techUsageItems);
          }
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, [email]);

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
    setSuccess("");

    if (!newPassword || !confirmPassword) {
      setError("Please enter a new password and confirm it.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/accountSetup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword,
          name,
          phone,
          description,
          age: age ? parseInt(age) : null,
          accessibilityNeeds,
          preferredContactMethod,
          experienceLevel,
          emailList,
          techUsageItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to setup account");
      }

      setSuccess(
        "Account setup completed successfully! Redirecting to login..."
      );
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                Loading your account information...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Complete Your Account Setup
            </h1>
            <p className="mt-2 text-gray-600">
              Please update your password and optionally fill out your profile
              information
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            {/* Password Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-4">
                ⚠️ Password Reset Required
              </h3>
              <p className="text-yellow-700 mb-4">
                For security reasons, you must set a new password to complete
                your account setup.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>
            </div>

            {/* Basic Profile Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information (Optional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="1"
                    max="120"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Experience Level
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Accessibility Needs
                </label>
                <textarea
                  value={accessibilityNeeds}
                  onChange={(e) => setAccessibilityNeeds(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any accessibility needs or preferences"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Preferred Contact Method
                </label>
                <select
                  value={preferredContactMethod}
                  onChange={(e) => setPreferredContactMethod(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Subscribe to email updates and newsletters
                  </span>
                </label>
              </div>
            </div>

            {/* Tech Usage Section */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Technology Usage (Optional)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTechUsageForm(!showTechUsageForm)}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  {showTechUsageForm ? "Cancel" : "Add Device"}
                </button>
              </div>

              {showTechUsageForm && (
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Smartphone, Laptop, Tablet"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., iPhone 14, MacBook Pro"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="rarely">Rarely</option>
                        <option value="occasionally">Occasionally</option>
                        <option value="frequently">Frequently</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional notes about this device"
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={addTechUsageItem}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Submit Button */}
            <div className="border-t pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Setting up account..." : "Complete Account Setup"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AccountSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDF9F4] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D3E50]"></div>
        </div>
      }
    >
      <AccountSetupContent />
    </Suspense>
  );
}
