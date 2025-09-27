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

  interface QuickActionCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    link: string;
    color: string;
  }

  const QuickActionCard = ({
    icon,
    title,
    description,
    link,
    color,
  }: QuickActionCardProps) => (
    <Link href={link} className="block">
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 h-full hover:shadow-md transition">
        <div
          className={`${color} w-10 h-10 rounded-full flex items-center justify-center mb-3`}
        >
          {icon}
        </div>
        <h3 className="font-medium text-[#2D3E50] mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        <div className="flex items-center text-sm text-[#2D3E50] font-medium">
          <span>Go to {title}</span>
          <FaArrowRight className="ml-1 h-3 w-3" />
        </div>
      </div>
    </Link>
  );

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
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#2D3E50] mb-1">
                Welcome back, {userData?.name?.split(" ")[0] || "User"}
              </h1>
              <p className="text-gray-600">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                <FaBell className="mr-2 h-4 w-4" />
                <span className="text-sm font-medium">
                  {stats?.weeklyRemaining} chats left this week
                </span>
              </div>
            </div>
          </div>

          {userData?.description && (
            <p className="mt-4 text-gray-600 border-t border-gray-100 pt-4">
              {userData.description}
            </p>
          )}
        </div>

        {/* Start Chat Button */}
        <div className="mb-6">
          <Link href="/app/chat" className="block">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-lg p-6 text-center transition-all duration-200 hover:shadow-xl">
              <div className="flex items-center justify-center mb-3">
                <FaComments className="h-8 w-8 text-white mr-3" />
                <h2 className="text-2xl font-bold text-white">
                  Start a New Chat
                </h2>
              </div>
              <p className="text-blue-100 text-lg mb-4">
                Get instant help with your technology questions
              </p>
              <div className="inline-flex items-center bg-white bg-opacity-90 hover:bg-opacity-100 px-6 py-3 rounded-full text-blue-600 font-semibold transition-all duration-200 shadow-lg">
                <span>Start Chatting Now</span>
                <FaArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-50 p-3 rounded-full">
                <FaComments className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Weekly Chats Used
                </p>
                <p className="text-xl font-bold text-[#2D3E50]">
                  {stats?.weeklyUsage || 0} / 3
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-50 p-3 rounded-full">
                <FaChartLine className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Chat Sessions
                </p>
                <p className="text-xl font-bold text-[#2D3E50]">
                  {stats?.totalSessions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-50 p-3 rounded-full">
                <FaCalendarCheck className="h-5 w-5 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Average Duration
                </p>
                <p className="text-xl font-bold text-[#2D3E50]">
                  {stats && stats.averageDurationMinutes > 0
                    ? `${stats.averageDurationMinutes} min`
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="bg-yellow-50 p-3 rounded-full">
                <FaUserCog className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Tech Level
                </p>
                <div
                  className={`text-sm font-medium mt-1 px-2.5 py-0.5 rounded-full inline-flex ${
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
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#2D3E50]">
              Recent Support Chats
            </h2>
            <Link
              href="/app/history"
              className="text-sm text-[#2D3E50] hover:underline flex items-center"
            >
              View all <FaArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentChats.length > 0 ? (
              recentChats.map((chat) => (
                <div
                  key={chat.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-[#2D3E50] truncate pr-2">
                      {chat.title || "Untitled Chat"}
                    </h3>
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
                  </div>

                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {chat.lastMessage ||
                      chat.sessionRecap ||
                      "No content available"}
                  </p>

                  <div className="flex justify-between text-xs text-gray-500 mt-auto">
                    <span>
                      {format(new Date(chat.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p className="text-gray-500">
                  No recent chat sessions. Start one from the chat page!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#2D3E50] mb-4">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              icon={<FaComments className="h-5 w-5 text-blue-500" />}
              title="New Chat"
              description="Start a new technical support conversation"
              link="/app/chat"
              color="bg-blue-50"
            />

            <QuickActionCard
              icon={<FaHistory className="h-5 w-5 text-green-500" />}
              title="History"
              description="View your past support conversations"
              link="/app/history"
              color="bg-green-50"
            />

            <QuickActionCard
              icon={<FaCog className="h-5 w-5 text-purple-500" />}
              title="Settings"
              description="Manage your account preferences"
              link="/app/settings"
              color="bg-purple-50"
            />

            <QuickActionCard
              icon={<FaQuestionCircle className="h-5 w-5 text-yellow-500" />}
              title="Help Center"
              description="Find answers to common questions"
              link="#"
              color="bg-yellow-50"
            />
          </div>
        </div>

        {/* Contact Methods */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-[#2D3E50] mb-4">
            Other Ways to Get Help
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="bg-blue-50 p-3 rounded-full">
                <FaPhone className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-[#2D3E50]">Phone Support</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Call us directly for immediate assistance
                </p>
                <a
                  href="tel:8886702766"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  888-670-2766
                </a>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-purple-50 p-3 rounded-full">
                <FaLaptop className="h-5 w-5 text-purple-500" />
              </div>
              <div className="ml-4">
                <h3 className="font-medium text-[#2D3E50]">Text Support</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Text us for immediate assistance
                </p>
                <a
                  href="tel:8886702766"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Text Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
