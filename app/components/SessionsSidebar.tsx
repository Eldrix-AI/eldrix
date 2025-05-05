import React from "react";
import { formatDistanceToNow } from "date-fns";
import { FaCheckCircle, FaCircle, FaClock, FaImage } from "react-icons/fa";

interface HelpSession {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  createdAt: string;
  completed: number;
  status?: string;
}

interface SessionsSidebarProps {
  sessions: HelpSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  hasActiveSession: boolean;
}

const SessionsSidebar: React.FC<SessionsSidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  hasActiveSession,
}) => {
  // Sort sessions: pending first, then active, then completed (closed) last
  const sortedSessions = [...sessions].sort((a, b) => {
    // First compare completion status (completed last)
    if (a.completed !== b.completed) {
      return a.completed - b.completed;
    }

    // For non-completed sessions, prioritize pending status
    if (!a.completed && !b.completed) {
      const aPending = a.status === "pending";
      const bPending = b.status === "pending";
      if (aPending !== bPending) {
        return aPending ? -1 : 1; // Pending sessions first
      }
    }

    // Otherwise sort by update time (most recent first)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Function to check if a message is an image message
  const isImageMessage = (message: string | null): boolean => {
    if (!message) return false;

    return (
      message.includes("Image attachment") ||
      message.includes("deepskygallery.s3.us-east-2.amazonaws.com") ||
      message.includes("![Image]") ||
      message.startsWith("!") ||
      /!\[Image\]\(.*?\)/.test(message) ||
      message.includes("I've sent an image.")
    );
  };

  return (
    <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-[#2D3E50]">Your Sessions</h2>
        <button
          onClick={onNewChat}
          disabled={hasActiveSession}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            hasActiveSession
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-[#2D3E50] text-white hover:bg-[#24466d]"
          }`}
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No previous chat sessions found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {sortedSessions.map((session) => (
              <li
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`p-3 cursor-pointer hover:bg-gray-50 transition ${
                  currentSessionId === session.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1">
                    {session.completed ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : session.status === "pending" ? (
                      <FaClock className="text-yellow-500" />
                    ) : (
                      <FaCircle className="text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session.title || "Untitled Chat"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 truncate flex items-center">
                      {isImageMessage(session.lastMessage) ? (
                        <>
                          <FaImage className="mr-1" size={12} />
                          <span>Attached Image</span>
                        </>
                      ) : (
                        session.lastMessage || "No messages"
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(session.updatedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SessionsSidebar;
