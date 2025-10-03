"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import Link from "next/link";
import {
  FaComments,
  FaHistory,
  FaCog,
  FaQuestionCircle,
  FaChartLine,
  FaCalendarCheck,
  FaBell,
  FaUserCog,
  FaArrowRight,
  FaPhone,
  FaLaptop,
  FaStar,
} from "react-icons/fa";
import { format } from "date-fns";

interface UserData {
  name: string;
  email?: string;
  id?: string;
  imageUrl: string;
  phone: string;
  description?: string;
  experienceLevel?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeUsageId?: string;
}

interface Stats {
  weeklyUsage: number;
  weeklyRemaining: number;
  averageDurationMinutes: number;
  totalSessions: number;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  sessionRecap: string | null;
  status: string;
  completed: number;
  createdAt: string;
  updatedAt: string;
}

const Dashboard = () => {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFreeUser, setIsFreeUser] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      if (session?.user?.id) {
        setLoading(true);
        try {
          // Fetch user data
          const userRes = await fetch(`/api/getUser?userId=${session.user.id}`);
          const userData = await userRes.json();
          setUserData(userData);

          // Check if user needs onboarding completion
          if (
            userData &&
            (userData.phone === "000-000-0000" || !userData.smsConsent)
          ) {
            router.push("/app/onboarding");
            return;
          }

          // Check if user has any subscription
          const hasSubscription =
            userData.stripeSubscriptionId || userData.stripeUsageId;
          setIsFreeUser(!hasSubscription);

          // If they have a subscription, fetch subscription details
          if (userData.stripeSubscriptionId) {
            const subRes = await fetch(
              `/api/getSubscription?subscriptionId=${userData.stripeSubscriptionId}`
            );
            if (subRes.ok) {
              const subData = await subRes.json();
              setSubscriptionData(subData);
            }
          } else if (userData.stripeUsageId) {
            // For Pay As You Go users who might only have usageId
            setSubscriptionData({ planType: "paygo" });
          }

          // Fetch history/stats data
          const historyRes = await fetch("/api/getUserHistory");
          const historyData = await historyRes.json();

          if (historyData.success) {
            // Calculate total sessions
            const allSessions = [
              ...historyData.history.lastDay,
              ...historyData.history.lastWeek,
              ...historyData.history.lastMonth,
              ...historyData.history.older,
            ];

            console.log("History data:", historyData);

            // Create stats object
            setStats({
              weeklyUsage: historyData.stats.weeklyUsage,
              weeklyRemaining: historyData.stats.weeklyRemaining,
              averageDurationMinutes: historyData.stats.averageDurationMinutes,
              totalSessions: allSessions.length,
            });

            // Get recent 3 chats
            const sorted = allSessions.sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            );
            setRecentChats(sorted.slice(0, 3));
          }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchData();
  }, [session]);

  // Helper function to determine experience level label and icon
  const getExperienceInfo = (level?: string) => {
    switch (level) {
      case "beginner":
        return { label: "Beginner", color: "bg-green-100 text-green-800" };
      case "intermediate":
        return { label: "Intermediate", color: "bg-blue-100 text-blue-800" };
      case "advanced":
        return { label: "Advanced", color: "bg-purple-100 text-purple-800" };
      default:
        return { label: "Not specified", color: "bg-gray-100 text-gray-800" };
    }
  };

  // Helper function to get usage display based on subscription plan
  const getUsageDisplay = () => {
    console.log("getUsageDisplay called:", {
      isFreeUser,
      planType: subscriptionData?.planType,
      weeklyUsage: stats?.weeklyUsage,
      subscriptionData,
    });

    if (isFreeUser) {
      return {
        text: `${stats?.weeklyRemaining || 0} chats left this week`,
        color: "bg-blue-50 text-blue-700",
      };
    }

    const planType = subscriptionData?.planType;

    // If we have both subscriptionId and usageId, it's likely Pay As You Go
    const isPayAsYouGo =
      (userData?.stripeSubscriptionId && userData?.stripeUsageId) ||
      planType === "paygo" ||
      planType === "priority-paygo";

    if (planType === "plus-monthly" || planType === "plus-yearly") {
      return {
        text: "Unlimited chats",
        color: "bg-green-50 text-green-700",
      };
    }

    if (isPayAsYouGo) {
      const usedSessions = stats?.weeklyUsage || 0;
      const freeSessionsUsed = Math.min(usedSessions, 3);
      const paidSessionsUsed = Math.max(0, usedSessions - 3);

      if (usedSessions < 3) {
        return {
          text: `${3 - usedSessions} free sessions left`,
          color: "bg-blue-50 text-blue-700",
        };
      } else if (usedSessions === 3) {
        return {
          text: "Free sessions used - $9 per session",
          color: "bg-yellow-50 text-yellow-700",
        };
      } else {
        return {
          text: `Used ${paidSessionsUsed} paid sessions (${freeSessionsUsed}/3 free)`,
          color: "bg-orange-50 text-orange-700",
        };
      }
    }

    // Fallback for unknown plans
    return {
      text: "Unlimited chats",
      color: "bg-green-50 text-green-700",
    };
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        {userData && (
          <Sidebar
            name={userData.name || "User"}
            profilePictureUrl={userData.imageUrl || "/default-avatar.png"}
            phoneNumber={userData.phone || ""}
          />
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2D3E50]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {userData && (
        <Sidebar
          name={userData.name || "User"}
          profilePictureUrl={userData.imageUrl || "/default-avatar.png"}
          phoneNumber={userData.phone || ""}
        />
      )}

      <div className="flex-1 overflow-y-auto bg-[#FDF9F4] p-4 md:p-6">
        {/* Simplified Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2D3E50] mb-2">
            Welcome back, {userData?.name?.split(" ")[0] || "User"}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span>•</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                getUsageDisplay().color
              }`}
            >
              {getUsageDisplay().text}
            </span>
          </div>
        </div>

        {/* Compact Start Chat Section */}
        <div className="mb-6">
          <Link href="/app/chat" className="block group">
            <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full mr-3 group-hover:bg-white/30 transition-all duration-300">
                    <FaComments className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Start a New Chat
                    </h2>
                    <p className="text-blue-100 text-sm">
                      Get instant help with your tech questions
                    </p>
                  </div>
                </div>
                <div className="flex items-center bg-white hover:bg-gray-50 px-4 py-2 rounded-full text-blue-600 font-semibold text-sm transition-all duration-300 shadow-md group-hover:shadow-lg group-hover:scale-105">
                  <span>Start Now</span>
                  <FaArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Simplified Plan Status */}
        {isFreeUser && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[#2D3E50]">Free Plan</h3>
                <p className="text-sm text-gray-600">
                  Upgrade for unlimited chats
                </p>
              </div>
              <Link
                href="/app/plans"
                className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
              >
                <FaStar className="mr-1 h-3 w-3" />
                Upgrade
              </Link>
            </div>
          </div>
        )}

        {/* Stats with Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-blue-50 p-3 rounded-full">
                <FaComments className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 mb-1">Chats This Week</p>
                <p className="text-2xl font-bold text-[#2D3E50]">
                  {isFreeUser
                    ? `${stats?.weeklyUsage || 0}/3`
                    : stats?.weeklyUsage || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-green-50 p-3 rounded-full">
                <FaChartLine className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
                <p className="text-2xl font-bold text-[#2D3E50]">
                  {stats?.totalSessions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-purple-50 p-3 rounded-full">
                <FaUserCog className="h-5 w-5 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 mb-1">Experience Level</p>
                <div
                  className={`text-sm font-medium mt-1 px-3 py-1 rounded-full inline-flex ${
                    getExperienceInfo(userData?.experienceLevel).color
                  }`}
                >
                  {getExperienceInfo(userData?.experienceLevel).label}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Chats */}
        {recentChats.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="bg-blue-50 p-2 rounded-full mr-3">
                  <FaComments className="h-4 w-4 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold text-[#2D3E50]">
                  Recent Chats
                </h2>
              </div>
              <Link
                href="/app/history"
                className="text-sm text-[#2D3E50] hover:underline flex items-center"
              >
                View all <FaArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentChats.slice(0, 3).map((chat) => (
                <Link
                  key={chat.id}
                  href={`/app/chat?sessionId=${chat.id}`}
                  className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-[#2D3E50] mb-1">
                        {chat.title || "Untitled Chat"}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-1">
                        {chat.lastMessage ||
                          chat.sessionRecap ||
                          "No content available"}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          chat.completed === 1
                            ? "bg-green-100 text-green-800"
                            : chat.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {chat.completed === 1
                          ? "Completed"
                          : chat.status === "pending"
                          ? "Pending"
                          : "Active"}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(chat.createdAt), "MMM d")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-50 p-2 rounded-full mr-3">
              <FaCog className="h-4 w-4 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-[#2D3E50]">
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/app/history" className="block">
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                <div className="flex items-center">
                  <div className="bg-green-50 p-3 rounded-full">
                    <FaHistory className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-[#2D3E50]">Chat History</h3>
                    <p className="text-sm text-gray-600">
                      View past conversations
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/app/settings" className="block">
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                <div className="flex items-center">
                  <div className="bg-purple-50 p-3 rounded-full">
                    <FaCog className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-[#2D3E50]">Settings</h3>
                    <p className="text-sm text-gray-600">Manage your account</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center mb-3">
            <div className="bg-yellow-50 p-2 rounded-full mr-3">
              <FaQuestionCircle className="h-4 w-4 text-yellow-500" />
            </div>
            <h3 className="font-medium text-[#2D3E50]">Need More Help?</h3>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="tel:8886702766"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <FaPhone className="mr-2 h-4 w-4" />
              Call 888-670-2766
            </a>
            <a
              href="tel:8886702766"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <FaLaptop className="mr-2 h-4 w-4" />
              Text Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
