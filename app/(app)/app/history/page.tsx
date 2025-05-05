"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format, formatDistanceToNow } from "date-fns";
import {
  FaHistory,
  FaClock,
  FaCalendarAlt,
  FaCheckCircle,
} from "react-icons/fa";
import Sidebar from "../../../components/Sidebar";
import ChatHistoryModal from "../../../components/ChatHistoryModal";

interface UserData {
  name: string;
  imageUrl: string;
  phone: string;
  email?: string;
  id?: string;
}

interface ChatSession {
  id: string;
  title: string;
  status: string;
  completed: number;
  sessionRecap: string | null;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: any[];
  duration?: number | null;
}

interface HistoryData {
  lastDay: ChatSession[];
  lastWeek: ChatSession[];
  lastMonth: ChatSession[];
  older: ChatSession[];
}

interface Stats {
  weeklyUsage: number;
  weeklyRemaining: number;
  averageDurationMinutes: number;
}

const History = () => {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null
  );
  const [modalSession, setModalSession] = useState<any | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(false);

  useEffect(() => {
    if (session?.user?.id) {
      // Fetch user data
      fetch(`/api/getUser?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setUserData(data);
        })
        .catch((err) => console.error(err));

      // Fetch history data
      fetchHistory();
    }
  }, [session]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/getUserHistory");
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
        setStats(data.stats);
      } else {
        console.error("Error fetching history:", data.error);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSession = async (chatSession: ChatSession) => {
    try {
      setSelectedSession(chatSession);
      setLoadingSession(true);

      const response = await fetch(
        `/api/getChatHistory?sessionId=${chatSession.id}`
      );
      const data = await response.json();

      if (data.success) {
        setModalSession(data.session);
      } else {
        console.error("Error fetching session details:", data.error);
      }
    } catch (error) {
      console.error("Error fetching session details:", error);
    } finally {
      setLoadingSession(false);
    }
  };

  const closeModal = () => {
    setModalSession(null);
    setSelectedSession(null);
  };

  // Function to render a session card
  const renderSessionCard = (session: ChatSession) => (
    <div
      key={session.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
      onClick={() => handleViewSession(session)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-[#2D3E50] truncate pr-2">
          {session.title || "Untitled Chat"}
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            session.completed === 1
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {session.completed === 1 ? "Completed" : "In Progress"}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
        {session.lastMessage || session.sessionRecap || "No content available"}
      </p>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{format(new Date(session.createdAt), "MMM d, yyyy")}</span>
        <span>
          {formatDistanceToNow(new Date(session.updatedAt), {
            addSuffix: true,
          })}
        </span>
      </div>
    </div>
  );

  // Function to render a session group
  const renderSessionGroup = (
    title: string,
    icon: React.ReactNode,
    sessions: ChatSession[]
  ) => {
    if (!sessions || sessions.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="text-[#2D3E50] mr-2">{icon}</div>
          <h2 className="text-xl font-semibold text-[#2D3E50]">{title}</h2>
          <span className="ml-2 text-sm text-gray-500">
            ({sessions.length})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(renderSessionCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      {userData && (
        <Sidebar
          name={userData.name}
          profilePictureUrl={userData.imageUrl || "/default-avatar.png"}
          phoneNumber={userData.phone}
        />
      )}

      <div className="flex-1 overflow-y-auto bg-[#FDF9F4] p-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Sessions Left This Week
              </h3>
              <div className="flex items-end">
                <span className="text-3xl font-bold text-[#2D3E50]">
                  {stats.weeklyRemaining}
                </span>
                <span className="text-sm text-gray-500 ml-1 mb-1">/ 3</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.weeklyUsage > 0
                  ? `You've used ${stats.weeklyUsage} of your 3 weekly sessions`
                  : "You haven't used any sessions this week"}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Average Chat Duration
              </h3>
              <div className="text-3xl font-bold text-[#2D3E50]">
                {stats.averageDurationMinutes > 0
                  ? `${stats.averageDurationMinutes} min`
                  : "N/A"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.averageDurationMinutes > 0
                  ? "Based on your completed chats"
                  : "Complete more chats to see average"}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Total Chat Sessions
              </h3>
              <div className="text-3xl font-bold text-[#2D3E50]">
                {history
                  ? history.lastDay.length +
                    history.lastWeek.length +
                    history.lastMonth.length +
                    history.older.length
                  : 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All time chat sessions
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2D3E50]"></div>
          </div>
        ) : history ? (
          <div>
            {renderSessionGroup(
              "Today",
              <FaClock className="h-5 w-5" />,
              history.lastDay
            )}
            {renderSessionGroup(
              "Last 7 Days",
              <FaHistory className="h-5 w-5" />,
              history.lastWeek
            )}
            {renderSessionGroup(
              "Last 30 Days",
              <FaCalendarAlt className="h-5 w-5" />,
              history.lastMonth
            )}
            {renderSessionGroup(
              "Older",
              <FaCheckCircle className="h-5 w-5" />,
              history.older
            )}

            {!history.lastDay.length &&
              !history.lastWeek.length &&
              !history.lastMonth.length &&
              !history.older.length && (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <FaHistory className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No chat history yet
                  </h3>
                  <p className="text-gray-500">
                    When you chat with our tech support team, your conversations
                    will appear here.
                  </p>
                </div>
              )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Failed to load history data. Please try again later.
          </div>
        )}
      </div>

      {/* Chat History Modal */}
      {(modalSession || loadingSession) &&
        (loadingSession ? (
          <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2D3E50] mx-auto"></div>
              <p className="text-center mt-4">Loading conversation...</p>
            </div>
          </div>
        ) : (
          <ChatHistoryModal session={modalSession} onClose={closeModal} />
        ))}
    </div>
  );
};

export default History;
