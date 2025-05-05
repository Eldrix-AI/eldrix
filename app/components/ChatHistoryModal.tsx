import React from "react";
import { format } from "date-fns";
import { FaTimes } from "react-icons/fa";

interface Message {
  id: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
  read: boolean;
  imageUrl?: string;
}

interface ChatSession {
  id: string;
  title: string;
  userId: string;
  sessionRecap: string | null;
  completed: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  duration: number | null;
  messages: Message[];
}

interface ChatHistoryModalProps {
  session: ChatSession | null;
  onClose: () => void;
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  session,
  onClose,
}) => {
  if (!session) return null;

  // Check if a message contains an image URL
  const isImageMessage = (
    content: string
  ): { isImage: boolean; url: string | null } => {
    if (!content) return { isImage: false, url: null };

    const imageMatch = content.match(/\[Image: (.*?)\]/);
    if (imageMatch && imageMatch[1]) {
      return { isImage: true, url: imageMatch[1] };
    }

    if (
      content.includes(
        "deepskygallery.s3.us-east-2.amazonaws.com/eldrix/chat-images"
      )
    ) {
      // Try to extract the URL if it's in the text
      const urlMatch = content.match(
        /(https:\/\/.*?\.(?:jpg|jpeg|png|gif|webp))/i
      );
      return urlMatch
        ? { isImage: true, url: urlMatch[1] }
        : { isImage: false, url: null };
    }

    return { isImage: false, url: null };
  };

  // Format a message for display
  const formatMessage = (message: Message) => {
    const { isImage, url } = isImageMessage(message.content);
    const displayText = isImage ? "Image attachment" : message.content;
    const imageUrl = message.imageUrl || url;

    return { displayText, imageUrl };
  };

  // Format duration for display
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "Unknown duration";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ${mins} minute${
        mins !== 1 ? "s" : ""
      }`;
    }
    return `${mins} minute${mins !== 1 ? "s" : ""}`;
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black bg-opacity-30 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-[#2D3E50]">
              {session.title}
            </h2>
            <div className="flex space-x-4 text-sm text-gray-500 mt-1">
              <p>{format(new Date(session.createdAt), "MMM d, yyyy h:mm a")}</p>
              {session.duration && (
                <p>Duration: {formatDuration(session.duration)}</p>
              )}
              <p
                className={`px-2 py-0.5 rounded ${
                  session.completed === 1
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {session.completed === 1 ? "Completed" : "In Progress"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <FaTimes />
          </button>
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {session.messages.map((msg, index) => {
            const { displayText, imageUrl } = formatMessage(msg);

            return (
              <div
                key={`${msg.id}-${index}`}
                className={`flex ${
                  msg.isAdmin ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.isAdmin
                      ? "bg-white text-[#2D3E50] border border-gray-200"
                      : "bg-[#2D3E50] text-white"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{displayText}</p>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Image attachment"
                      className="mt-2 rounded-lg max-h-60 w-auto"
                    />
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {format(new Date(msg.createdAt), "h:mm a")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Session recap section */}
        {session.sessionRecap && (
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-medium text-[#2D3E50] mb-2">
              Session Summary
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {session.sessionRecap}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryModal;
