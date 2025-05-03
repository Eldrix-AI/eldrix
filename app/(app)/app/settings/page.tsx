"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "../../../components/Sidebar";
import { toast } from "react-hot-toast";

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
}

const Settings = () => {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [techItems, setTechItems] = useState<string[]>([]);
  const [newTechItem, setNewTechItem] = useState("");

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/getUser?userId=${session?.user?.id}`);
      const data = await res.json();
      setUserData(data);

      // Parse techUsage JSON string to array
      if (data.techUsage) {
        try {
          setTechItems(JSON.parse(data.techUsage));
        } catch (e) {
          setTechItems([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      setIsLoading(true);
      // Update techUsage with JSON string from techItems array
      const updatedUserData = {
        ...userData,
        techUsage: JSON.stringify(techItems),
      };

      const response = await fetch("/api/updateUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUserData),
      });

      if (response.ok) {
        toast.success("Settings updated successfully");
        fetchUserData();
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
        profilePictureUrl={userData.imageUrl || "/default-avatar.png"}
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
                    htmlFor="imageUrl"
                    className="block text-sm font-medium text-[#5A7897] mb-1"
                  >
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={userData.imageUrl || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/50"
                    placeholder="https://example.com/your-image.jpg"
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
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
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
