"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "../../../components/Sidebar";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { FaStar, FaCog, FaCrown } from "react-icons/fa";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  imageUrl: string;
  description?: string;
  age?: number;
  techUsage?: string;
  accessibilityNeeds?: string;
  preferredContactMethod?: string;
  experienceLevel?: string;
  notification?: boolean;
  darkMode?: boolean;
  emailList?: boolean;
  smsConsent?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeUsageId?: string;
}

interface UpcomingInvoice {
  amountDue: number;
  currency: string;
  nextPaymentAttempt: string | null;
  lineItems: Array<{
    description: string;
    amount: number;
    quantity: number;
    period: {
      start: string;
      end: string;
    };
  }>;
  invoiceId: string | null;
}

const Settings = () => {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [techItems, setTechItems] = useState<string[]>([]);
  const [newTechItem, setNewTechItem] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isFreeUser, setIsFreeUser] = useState(true);
  const [upcomingInvoice, setUpcomingInvoice] =
    useState<UpcomingInvoice | null>(null);
  const [isPayAsYouGo, setIsPayAsYouGo] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/getUser?userId=${session?.user?.id}`);
      const data = await res.json();
      setUserData(data);

      // Check if user has any subscription
      const hasSubscription = data.stripeSubscriptionId || data.stripeUsageId;
      setIsFreeUser(!hasSubscription);

      // Check if user is on Pay As You Go (has BOTH stripeUsageId AND stripeSubscriptionId)
      const isPayGo = data.stripeUsageId && data.stripeSubscriptionId;
      setIsPayAsYouGo(isPayGo);

      // If user is on Pay As You Go, fetch upcoming invoice
      if (isPayGo && data.stripeCustomerId && data.stripeSubscriptionId) {
        try {
          const invoiceRes = await fetch(
            `/api/getUpcomingInvoice?customerId=${data.stripeCustomerId}&subscriptionId=${data.stripeSubscriptionId}`
          );
          if (invoiceRes.ok) {
            const invoiceData = await invoiceRes.json();
            setUpcomingInvoice(invoiceData);
          }
        } catch (error) {
          console.error("Error fetching upcoming invoice:", error);
        }
      }

      // Parse techUsage JSON string to array
      if (data.techUsage) {
        try {
          setTechItems(JSON.parse(data.techUsage));
        } catch (_) {
          console.error("Error parsing techUsage:", data.techUsage);
          setTechItems([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, setUserData, setTechItems, setIsLoading]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
    }
  }, [session, fetchUserData]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!userData) return;

    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value,
    });
  };

  const handleTechItemAdd = () => {
    if (newTechItem.trim() && techItems.length < 5) {
      setTechItems([...techItems, newTechItem.trim()]);
      setNewTechItem("");
    }
  };

  const handleTechItemRemove = (index: number) => {
    setTechItems(techItems.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);

      // Create a form data object
      const formData = new FormData();
      formData.append("file", imageFile);

      // Upload to a service like Cloudinary (you'll need to create this API route)
      const uploadResponse = await fetch("/api/uploadImage", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await uploadResponse.json();
      return data.url; // Return the URL of the uploaded image
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleChange = (name: keyof UserData) => {
    if (!userData) return;

    setUserData({
      ...userData,
      [name]: !userData[name],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      setIsLoading(true);

      // Upload image if there's a new one
      let updatedImageUrl = userData.imageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          updatedImageUrl = uploadedUrl;
        }
      }

      // Update techUsage with JSON string from techItems array
      const updatedUserData = {
        ...userData,
        imageUrl: updatedImageUrl,
        techUsage: JSON.stringify(techItems),
        notification: !!userData.notification,
        darkMode: !!userData.darkMode,
        emailList: !!userData.emailList,
      };

      const response = await fetch("/api/updateUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUserData),
      });

      if (response.ok) {
        toast.success("Settings updated successfully");
        // Apply dark mode immediately if changed
        if (userData.darkMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        fetchUserData();
        // Clear image upload state
        setImageFile(null);
        setImagePreview(null);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2D3E50]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        name={userData.name}
        profilePictureUrl={userData.imageUrl}
        phoneNumber={userData.phone}
      />
      <div className="flex-1 p-6 bg-[#FDF9F4] overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#2D3E50] mb-8">
            Your Settings
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Section */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-[#2D3E50] mb-4">
                Profile Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Image */}
                <div className="col-span-2 flex flex-col items-center mb-4">
                  <div className="relative w-32 h-32 mb-4">
                    <img
                      src={
                        imagePreview ||
                        userData.imageUrl ||
                        "/default-avatar.png"
                      }
                      alt={userData.name}
                      className="w-full h-full rounded-full object-cover border-4 border-[#2D3E50]/20"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full rounded-full bg-[#2D3E50] text-white font-semibold flex items-center justify-center text-2xl">
                              ${
                                userData.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2) || "U"
                              }
                            </div>
                          `;
                        }
                      }}
                    />
                    <label
                      htmlFor="profile-image-upload"
                      className="absolute bottom-0 right-0 bg-[#2D3E50] text-white p-2 rounded-full cursor-pointer hover:bg-[#24466d]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <input
                        id="profile-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  {uploadingImage && (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#2D3E50]"></div>
                  )}
                  <p className="text-sm text-gray-500">
                    Click the pencil icon to upload a new profile picture
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-[#5A7897] mb-1"
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[#5A7897] mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-[#5A7897] mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={userData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="age"
                    className="block text-sm font-medium text-[#5A7897] mb-1"
                  >
                    Age
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={userData.age || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-[#5A7897] mb-1"
                  >
                    About You
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={userData.description || ""}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50"
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>
              </div>
            </section>

            {/* Tech Preferences Section */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-[#2D3E50] mb-4">
                Tech Preferences
              </h2>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="techUsage"
                    className="block text-sm font-medium text-[#5A7897] mb-1"
                  >
                    Technology You Use Regularly (max 5)
                  </label>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {techItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-[#2D3E50]/10 px-3 py-1 rounded-full"
                      >
                        <span className="text-sm text-[#2D3E50]">{item}</span>
                        <button
                          type="button"
                          onClick={() => handleTechItemRemove(index)}
                          className="ml-2 text-[#2D3E50]/70 hover:text-[#2D3E50]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex">
                    <input
                      type="text"
                      value={newTechItem}
                      onChange={(e) => setNewTechItem(e.target.value)}
                      disabled={techItems.length >= 5}
                      placeholder={
                        techItems.length >= 5
                          ? "Maximum 5 items reached"
                          : "e.g., iPhone, Computer, Smart TV"
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50"
                    />
                    <button
                      type="button"
                      onClick={handleTechItemAdd}
                      disabled={techItems.length >= 5 || !newTechItem.trim()}
                      className="bg-[#2D3E50] text-white px-4 py-2 rounded-r-md disabled:bg-[#2D3E50]/50"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="experienceLevel"
                    className="block text-sm font-medium text-[#5A7897] mb-1"
                  >
                    Tech Experience Level
                  </label>
                  <select
                    id="experienceLevel"
                    name="experienceLevel"
                    value={userData.experienceLevel || "beginner"}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50"
                  >
                    <option value="beginner">
                      Beginner - I need step-by-step help
                    </option>
                    <option value="intermediate">
                      Intermediate - I can follow guidance
                    </option>
                    <option value="advanced">
                      Advanced - I'm comfortable with technology
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="accessibilityNeeds"
                    className="block text-sm font-medium text-[#5A7897] mb-1"
                  >
                    Accessibility Needs
                  </label>
                  <input
                    type="text"
                    id="accessibilityNeeds"
                    name="accessibilityNeeds"
                    value={userData.accessibilityNeeds || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50"
                    placeholder="e.g., Large text, Audio assistance"
                  />
                </div>

                <div>
                  <label
                    htmlFor="preferredContactMethod"
                    className="block text-sm font-medium text-[#5A7897] mb-1"
                  >
                    Preferred Contact Method
                  </label>
                  <select
                    id="preferredContactMethod"
                    name="preferredContactMethod"
                    value={userData.preferredContactMethod || "phone"}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50"
                  >
                    <option value="phone">Phone Call</option>
                    <option value="text">Text Message</option>
                    <option value="inapp">In-App Chat</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Preferences Section with Toggle Switches */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-[#2D3E50] mb-4">
                Preferences
              </h2>

              <div className="space-y-4">
                {/* Toggle for Dark Mode */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-md font-medium text-[#2D3E50]">
                      Dark Mode
                    </h3>
                    <p className="text-sm text-gray-500">
                      Enable dark theme for the app
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange("darkMode")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      userData.darkMode ? "bg-[#2D3E50]" : "bg-gray-200"
                    } transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50`}
                    role="switch"
                    aria-checked={userData.darkMode || false}
                  >
                    <span
                      className={`${
                        userData.darkMode ? "translate-x-5" : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
                    />
                  </button>
                </div>

                {/* Toggle for Notifications */}
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <div>
                    <h3 className="text-md font-medium text-[#2D3E50]">
                      Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive push notifications
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange("notification")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      userData.notification ? "bg-[#2D3E50]" : "bg-gray-200"
                    } transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50`}
                    role="switch"
                    aria-checked={userData.notification || false}
                  >
                    <span
                      className={`${
                        userData.notification
                          ? "translate-x-5"
                          : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
                    />
                  </button>
                </div>

                {/* Toggle for Email List */}
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <div>
                    <h3 className="text-md font-medium text-[#2D3E50]">
                      Email Updates
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive email newsletters and updates
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange("emailList")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      userData.emailList ? "bg-[#2D3E50]" : "bg-gray-200"
                    } transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50`}
                    role="switch"
                    aria-checked={userData.emailList || false}
                  >
                    <span
                      className={`${
                        userData.emailList ? "translate-x-5" : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
                    />
                  </button>
                </div>

                {/* Toggle for SMS Consent */}
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <div>
                    <h3 className="text-md font-medium text-[#2D3E50]">
                      SMS Notifications
                    </h3>
                    <p className="text-sm text-gray-500">
                      Receive text messages for important updates
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange("smsConsent")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      userData.smsConsent ? "bg-[#2D3E50]" : "bg-gray-200"
                    } transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50`}
                    role="switch"
                    aria-checked={userData.smsConsent || false}
                  >
                    <span
                      className={`${
                        userData.smsConsent ? "translate-x-5" : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Subscription Management Section */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-[#2D3E50] mb-4">
                Subscription & Billing
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-[#2D3E50] mb-1">
                      {isFreeUser
                        ? "Free Plan"
                        : isPayAsYouGo
                        ? "Pay As You Go"
                        : "Active Subscription"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isFreeUser
                        ? "You're currently on our free plan with 3 sessions per month"
                        : isPayAsYouGo
                        ? "You're on Pay As You Go - pay only for sessions you use"
                        : "Manage your subscription and billing preferences"}
                    </p>
                  </div>
                  <Link
                    href="/app/plans"
                    className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      isFreeUser
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                        : "bg-gradient-to-r from-[#2D3E50] to-[#24466d] text-white hover:from-[#24466d] hover:to-[#1a2f47]"
                    }`}
                  >
                    {isFreeUser ? (
                      <>
                        <FaStar className="mr-2 h-4 w-4" />
                        Upgrade Plan
                      </>
                    ) : (
                      <>
                        <FaCog className="mr-2 h-4 w-4" />
                        Manage Plan
                      </>
                    )}
                  </Link>
                </div>

                {/* Pay As You Go Billing Information */}
                {isPayAsYouGo && upcomingInvoice && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <FaCog className="text-blue-500 text-xl mt-1 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-[#2D3E50] mb-2">
                          Current Usage & Upcoming Bill
                        </h4>

                        {upcomingInvoice.amountDue > 0 ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                Amount due this billing period:
                              </span>
                              <span className="font-semibold text-lg text-[#2D3E50]">
                                ${upcomingInvoice.amountDue.toFixed(2)}{" "}
                                {upcomingInvoice.currency}
                              </span>
                            </div>

                            {upcomingInvoice.nextPaymentAttempt && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  Next billing date:
                                </span>
                                <span className="text-sm text-gray-800">
                                  {new Date(
                                    upcomingInvoice.nextPaymentAttempt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}

                            {upcomingInvoice.lineItems.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Usage breakdown:
                                </p>
                                <div className="space-y-1">
                                  {upcomingInvoice.lineItems.map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        className="flex justify-between text-sm"
                                      >
                                        <span className="text-gray-600">
                                          {item.description} (×{item.quantity})
                                        </span>
                                        <span className="text-gray-800">
                                          ${item.amount.toFixed(2)}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">
                            No charges for this billing period. You'll only be
                            charged when you use additional sessions beyond your
                            free allowance.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isFreeUser && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <FaCrown className="text-green-500 text-xl mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-[#2D3E50] mb-1">
                          Unlock Premium Features
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Get unlimited chats, priority support, and skip the
                          queue with our paid plans.
                        </p>
                        <Link
                          href="/app/plans"
                          className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
                        >
                          <FaStar className="mr-2 h-4 w-4" />
                          View All Plans
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || uploadingImage}
                className="bg-[#2D3E50] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#24466d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2D3E50] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
