"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "../../../components/Sidebar";
import { FaPaperPlane, FaImage, FaPhoneAlt, FaSms } from "react-icons/fa";
import SessionsSidebar from "../../../components/SessionsSidebar";

interface UserData {
  name: string;
  imageUrl: string;
  phone: string;
  email?: string;
  id?: string;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  imageUrl?: string;
  status?: "sending" | "sent" | "delivered" | "read" | "error";
}

// Define an interface for the message data returned from the API
interface ApiMessage {
  id: string;
  content: string;
  isAdmin: boolean;
  helpSessionId: string;
  read: boolean;
  createdAt: string;
  imageUrl?: string;
}

const Chat = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      text: "Hello! How can I help you with your tech needs today?",
      sender: "assistant",
      timestamp: new Date(),
      status: "delivered",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [helpSessionId, setHelpSessionId] = useState<string | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [sessionRecap, setSessionRecap] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const processedMessageIds = useRef(new Set<string>());

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/getUser?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setUserData(data);
        })
        .catch((err) => console.error(err));
    }
  }, [session]);

  // Add useEffect to scroll to bottom on initial render
  useEffect(() => {
    // Initial scroll to bottom when component mounts
    scrollToBottom();
  }, []);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set up message checking interval if we have a help session ID
    // But ONLY check for admin messages, never add user messages from polling
    if (helpSessionId && session && !isClosed) {
      // Clear any existing interval
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }

      // Do an initial check when the session changes
      checkForAdminMessages();

      // Set up periodic checking for new admin messages only
      checkInterval.current = setInterval(() => {
        checkForAdminMessages();
      }, 5000); // Check every 5 seconds
    }

    // Cleanup interval on unmount or when help session changes
    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
        checkInterval.current = null;
      }
    };
  }, [helpSessionId, session, isClosed]);

  // This function is used when we need to check for ALL messages (including user messages)
  // Used when first loading a session or after sending a message
  const checkForNewMessages = async () => {
    if (!helpSessionId || isClosed) return;

    try {
      const response = await fetch(
        `/api/checkMessages?helpSessionId=${helpSessionId}`
      );
      if (!response.ok) return;

      const data = await response.json();

      // Update session status if different
      if (data.sessionStatus && sessionStatus !== data.sessionStatus) {
        setSessionStatus(data.sessionStatus);
      }

      // If there are unread messages, add them to our messages array
      if (data.unreadMessages && data.unreadMessages.length > 0) {
        // Convert unread messages to our format
        const newMessages = data.unreadMessages.map((msg: ApiMessage) => {
          // Check if this is an image message
          const isImageMessage =
            (msg.content.includes("Image attachment") && msg.imageUrl) ||
            msg.content.includes(
              "deepskygallery.s3.us-east-2.amazonaws.com/eldrix"
            ) ||
            (msg.content.includes("api.twilio.com") &&
              (msg.content.includes("[Image") ||
                msg.content.includes("![Image]"))) ||
            msg.content.includes("[Image 1:") ||
            /\[Image \d+:/.test(msg.content) ||
            msg.content.includes("![Image]") ||
            msg.content.startsWith("!") ||
            /!\[Image\]\(.*?\)/.test(msg.content) ||
            msg.content.includes("vercel-storage.com") ||
            msg.content.includes("blob.vercel-storage.com") ||
            /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)/i.test(msg.content);

          return {
            id: msg.id,
            text: isImageMessage ? "Attached Image" : msg.content,
            sender: msg.isAdmin ? "assistant" : "user",
            timestamp: new Date(msg.createdAt),
            status: msg.read ? "read" : "delivered",
            imageUrl:
              msg.imageUrl ||
              (isImageMessage ? extractImageUrl(msg.content) : undefined),
          };
        });

        console.log("Received unread messages:", data.unreadMessages.length);

        // Get all current message IDs for deduplication
        const currentMessageIds = new Set(messages.map((msg) => msg.id));

        // Filter out messages we already have in our UI
        const uniqueMessages = newMessages.filter(
          (msg: Message) => !currentMessageIds.has(msg.id)
        );

        console.log("Messages after UI deduplication:", uniqueMessages.length);

        // Filter out messages that are in our processed set
        const notProcessedMessages = uniqueMessages.filter(
          (msg: Message) => !processedMessageIds.current.has(msg.id)
        );

        console.log(
          "Messages after processed set check:",
          notProcessedMessages.length
        );

        // Filter out user messages that were sent in the last 30 seconds
        const messagesToAdd = notProcessedMessages.filter(
          (msg: Message) =>
            msg.sender !== "user" ||
            Date.now() - msg.timestamp.getTime() > 30000
        );

        console.log("Messages after time filter:", messagesToAdd.length);

        // Add all these messages to our processed set
        messagesToAdd.forEach((msg: Message) => {
          processedMessageIds.current.add(msg.id);
        });

        // Only update state if we have new messages
        if (messagesToAdd.length > 0) {
          setMessages((prev) => [...prev, ...messagesToAdd]);
        }

        processAdminMessages(data);
      }
    } catch (error) {
      console.error("Error checking for new messages:", error);
    }
  };

  // This function is ONLY used for polling and ONLY looks for admin messages
  const checkForAdminMessages = async () => {
    if (!helpSessionId || isClosed) return;

    try {
      const response = await fetch(
        `/api/checkMessages?helpSessionId=${helpSessionId}`
      );
      if (!response.ok) return;

      const data = await response.json();

      // Update session status if different
      if (data.sessionStatus && sessionStatus !== data.sessionStatus) {
        setSessionStatus(data.sessionStatus);
      }

      processAdminMessages(data);
    } catch (error) {
      console.error("Error checking for admin messages:", error);
    }
  };

  // Helper function to process admin messages
  const processAdminMessages = async (data: any) => {
    // If there are unread messages, look for admin messages only
    if (data.unreadMessages && data.unreadMessages.length > 0) {
      // Filter to only include admin messages
      const adminMessages = data.unreadMessages.filter(
        (msg: ApiMessage) => msg.isAdmin
      );

      if (adminMessages.length > 0) {
        console.log("Found admin messages:", adminMessages.length);

        // Convert admin messages to our format
        const formattedAdminMessages = adminMessages.map((msg: ApiMessage) => {
          // Check if this is an image message
          const isImageMessage =
            (msg.content.includes("Image attachment") && msg.imageUrl) ||
            msg.content.includes(
              "deepskygallery.s3.us-east-2.amazonaws.com/eldrix"
            ) ||
            (msg.content.includes("api.twilio.com") &&
              (msg.content.includes("[Image") ||
                msg.content.includes("![Image]"))) ||
            msg.content.includes("[Image 1:") ||
            /\[Image \d+:/.test(msg.content) ||
            msg.content.includes("![Image]") ||
            msg.content.startsWith("!") ||
            /!\[Image\]\(.*?\)/.test(msg.content) ||
            msg.content.includes("vercel-storage.com") ||
            msg.content.includes("blob.vercel-storage.com") ||
            /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)/i.test(msg.content);

          return {
            id: msg.id,
            text: isImageMessage ? "Attached Image" : msg.content,
            sender: "assistant",
            timestamp: new Date(msg.createdAt),
            status: msg.read ? "read" : "delivered",
            imageUrl:
              msg.imageUrl ||
              (isImageMessage ? extractImageUrl(msg.content) : undefined),
          };
        });

        // Get all current message IDs for deduplication
        const currentMessageIds = new Set(messages.map((msg) => msg.id));

        // Filter out messages we already have in our UI
        const messagesToAdd = formattedAdminMessages.filter(
          (msg: Message) =>
            !currentMessageIds.has(msg.id) &&
            !processedMessageIds.current.has(msg.id)
        );

        console.log("Admin messages to add:", messagesToAdd.length);

        // Add these messages to our processed set
        messagesToAdd.forEach((msg: Message) => {
          processedMessageIds.current.add(msg.id);
        });

        // Only update state if we have new admin messages
        if (messagesToAdd.length > 0) {
          setMessages((prev) => [...prev, ...messagesToAdd]);

          // Play a sound or notification here if you want
        }

        // Mark admin messages as read in the database
        const adminMessageIds = adminMessages.map((msg: ApiMessage) => msg.id);

        if (adminMessageIds.length > 0) {
          await fetch("/api/checkMessages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              helpSessionId,
              messageIds: adminMessageIds,
            }),
          });
        }
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!message.trim() && !fileInputRef.current?.files?.length) || isClosed)
      return;

    // If there's an active session but we don't have a current one selected,
    // prevent creating a new one
    if (!helpSessionId && hasActiveSession) {
      // Find the active session
      const activeSession = sessions.find((s) => s.completed === 0);
      if (activeSession) {
        // Alert the user
        alert(
          "You already have an active chat session. Please use that one or close it before starting a new chat."
        );
        return;
      }
    }

    // Add user message to UI immediately for better UX, with "sending" status
    const userMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "user" as const,
      timestamp: new Date(),
      status: "sending" as const,
    };

    // Add to processed IDs to prevent duplicates
    processedMessageIds.current.add(userMessage.id);

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      // Create form data for API request
      const formData = new FormData();

      if (message.trim()) {
        formData.append("message", message.trim());
      }

      // Add help session ID if we have one (for ongoing conversations)
      if (helpSessionId) {
        formData.append("helpSessionId", helpSessionId);
      }

      // API call to send message
      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Update the user message status to "delivered"
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: "delivered" } : msg
        )
      );

      // Store the help session ID for future messages
      if (data.session && data.session.id) {
        const newSessionId = data.session.id;
        setHelpSessionId(newSessionId);

        // Update URL with the new session ID
        router.push(`/app/chat?id=${newSessionId}`);

        // Refresh sessions list to show the new session
        fetchUserSessions();

        // Manually check for new messages once
        setTimeout(() => {
          checkForNewMessages();
        }, 1000);
      }

      // Only show the "thank you" message if this is the first message in a new session
      if (isFirstMessage) {
        setIsFirstMessage(false);

        // Add assistant response after a short delay to simulate thinking
        setTimeout(() => {
          const assistantMessage = {
            id: (Date.now() + 1).toString(),
            text: "Thank you for your message. You are currently in line and we will respond as soon as possible.",
            sender: "assistant" as const,
            timestamp: new Date(),
            status: "delivered" as const,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 1000);
      } else {
        // For subsequent messages, just show a delivery confirmation
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Update the user message to show the error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessage.id ? { ...msg, status: "error" as any } : msg
        )
      );

      // Show error message to user
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, there was an error sending your message. Please try again.",
        sender: "assistant" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isClosed) return;

    // If there's an active session but we don't have a current one selected,
    // prevent creating a new one
    if (!helpSessionId && hasActiveSession) {
      // Find the active session
      const activeSession = sessions.find((s) => s.completed === 0);
      if (activeSession) {
        // Alert the user
        alert(
          "You already have an active chat session. Please use that one or close it before starting a new chat."
        );
        return;
      }
    }

    // Show a preview of the image with "sending" status
    const imageMessage = {
      id: Date.now().toString(),
      text: "I've sent an image.",
      sender: "user" as const,
      timestamp: new Date(),
      imageUrl: URL.createObjectURL(file),
      status: "sending" as const,
    };

    // Add to processed IDs to prevent duplicates
    processedMessageIds.current.add(imageMessage.id);

    setMessages((prev) => [...prev, imageMessage]);
    setIsLoading(true);

    try {
      // Create form data for API request
      const formData = new FormData();
      formData.append("file", file);

      // Add a message for context if none was provided
      if (!message.trim()) {
        formData.append("message", "Image attachment");
      } else {
        formData.append("message", message.trim());
        setMessage("");
      }

      // Add help session ID if we have one
      if (helpSessionId) {
        formData.append("helpSessionId", helpSessionId);
      }

      // API call to send the image
      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      // Update message status to "delivered"
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === imageMessage.id ? { ...msg, status: "delivered" } : msg
        )
      );

      // Store the help session ID for future messages
      if (data.session && data.session.id) {
        const newSessionId = data.session.id;
        setHelpSessionId(newSessionId);

        // Update URL with the new session ID
        router.push(`/app/chat?id=${newSessionId}`);

        // Refresh sessions list to show the new session
        fetchUserSessions();

        // Manually check for new messages once
        setTimeout(() => {
          checkForNewMessages();
        }, 1000);
      }

      // Only show the automated response for first message
      if (isFirstMessage) {
        setIsFirstMessage(false);

        // Add assistant response after a short delay
        setTimeout(() => {
          const assistantMessage = {
            id: (Date.now() + 1).toString(),
            text: "I've received your image. Our team will review it and respond shortly.",
            sender: "assistant" as const,
            timestamp: new Date(),
            status: "delivered" as const,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 1000);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error uploading image:", error);

      // Update the message to show error status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === imageMessage.id ? { ...msg, status: "error" as any } : msg
        )
      );

      // Show error message to user
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, there was an error uploading your image. Please try again.",
        sender: "assistant" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  // Add a function to handle closing the chat
  const handleCloseChat = async () => {
    if (!helpSessionId || isClosing || isClosed) return;

    setIsClosing(true);

    try {
      // Add a closing message to UI immediately
      const closingMessage = {
        id: Date.now().toString(),
        text: "Generating session summary...",
        sender: "assistant" as const,
        timestamp: new Date(),
        status: "delivered" as const,
      };

      setMessages((prev) => [...prev, closingMessage]);
      scrollToBottom();

      // Call API to close the session
      const response = await fetch("/api/closeSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ helpSessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to close session");
      }

      const data = await response.json();

      // Update the closing message with the session recap
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === closingMessage.id
            ? {
                ...msg,
                text: `This chat session has been closed.\n\n${
                  data.recap || "Session summary not available."
                }`,
              }
            : msg
        )
      );

      // Store the recap
      setSessionRecap(data.recap);

      // Mark session as closed
      setIsClosed(true);
      setSessionStatus("closed");

      // Refresh the sessions list
      fetchUserSessions();

      // Clear the check interval
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
        checkInterval.current = null;
      }
    } catch (error) {
      console.error("Error closing chat:", error);

      // Show error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === prev[prev.length - 1]?.id && msg.sender === "assistant"
            ? { ...msg, text: "Error closing chat. Please try again." }
            : msg
        )
      );
    } finally {
      setIsClosing(false);
    }
  };

  // Add a function to fetch user sessions
  const fetchUserSessions = async () => {
    if (!session?.user?.id) return;

    setIsLoadingSessions(true);
    try {
      const response = await fetch("/api/getUserSessions");
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const data = await response.json();
      setSessions(data.sessions);
      setHasActiveSession(data.hasActiveSession);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Check for session ID in URL query params
  useEffect(() => {
    // Get session ID from URL if available
    const sessionIdFromUrl = searchParams.get("id");

    if (sessionIdFromUrl && sessionIdFromUrl !== helpSessionId) {
      // If we have a session ID in the URL, select that session
      console.log("Loading session from URL param:", sessionIdFromUrl);
      processedMessageIds.current.clear();
      setHelpSessionId(sessionIdFromUrl);
      handleSelectSession(sessionIdFromUrl);
    }
  }, [searchParams]);

  // Call fetchUserSessions in a useEffect
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserSessions().then(() => {
        // Only auto-select if no session ID in URL and no current session
        const sessionIdFromUrl = searchParams.get("id");
        if (!sessionIdFromUrl && !helpSessionId) {
          autoSelectActiveSession();
        }
      });
    }
  }, [session?.user?.id]);

  // Function to automatically select the most recent active session
  const autoSelectActiveSession = () => {
    // If we have sessions and no current session is selected
    if (sessions.length > 0 && !helpSessionId) {
      // Find the most recent active session
      const activeSession = sessions.find((s) => s.completed === 0);

      // If there's an active session, select it
      if (activeSession) {
        console.log("Auto-selecting active session:", activeSession.id);
        // Clear processed message IDs when selecting a new session
        processedMessageIds.current.clear();
        handleSelectSession(activeSession.id);
      } else {
        // If no active session, select the most recent one
        const mostRecent = [...sessions].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];

        if (mostRecent) {
          console.log("Auto-selecting most recent session:", mostRecent.id);
          // Clear processed message IDs when selecting a new session
          processedMessageIds.current.clear();
          handleSelectSession(mostRecent.id);
        }
      }
    }
  };

  // Add a function to handle session selection
  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === helpSessionId) return;

    // Clear current chat state
    setMessages([]);
    setIsFirstMessage(false);
    setSessionStatus(null);
    setIsClosed(false);

    // Clear processed message IDs when selecting a new session
    processedMessageIds.current.clear();

    // Update URL with the session ID
    router.push(`/app/chat?id=${sessionId}`);

    // Load the selected session
    try {
      setIsLoading(true);

      // Get the session with all its messages
      const response = await fetch(
        `/api/checkMessages?helpSessionId=${sessionId}`
      );
      if (!response.ok) {
        throw new Error("Failed to load session");
      }

      const data = await response.json();

      // Set session ID and status
      setHelpSessionId(sessionId);
      setSessionStatus(data.sessionStatus);

      // Find the session to check if it's completed
      const selectedSession = sessions.find((s) => s.id === sessionId);
      if (selectedSession && selectedSession.completed === 1) {
        setIsClosed(true);
      }

      // Get all messages for this session
      const messagesResponse = await fetch(
        `/api/getSessionMessages?helpSessionId=${sessionId}`
      );
      if (!messagesResponse.ok) {
        throw new Error("Failed to load messages");
      }

      const messagesData = await messagesResponse.json();

      console.log(messagesData);

      // Format messages for the UI
      const formattedMessages = messagesData.messages.map((msg: any) => {
        // Check if this is an image message
        const isImageMessage =
          (msg.content.includes("Image attachment") && msg.imageUrl) ||
          msg.content.includes(
            "deepskygallery.s3.us-east-2.amazonaws.com/eldrix"
          ) ||
          (msg.content.includes("api.twilio.com") &&
            (msg.content.includes("[Image") ||
              msg.content.includes("![Image]"))) ||
          msg.content.includes("[Image 1:") ||
          /\[Image \d+:/.test(msg.content) ||
          msg.content.includes("![Image]") ||
          msg.content.startsWith("!") ||
          /!\[Image\]\(.*?\)/.test(msg.content) ||
          msg.content.includes("vercel-storage.com") ||
          msg.content.includes("blob.vercel-storage.com") ||
          /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)/i.test(msg.content);

        return {
          id: msg.id,
          text: isImageMessage ? "Attached Image" : msg.content,
          sender: msg.isAdmin ? "assistant" : "user",
          timestamp: new Date(msg.createdAt),
          status: msg.read ? "read" : "delivered",
          imageUrl:
            msg.imageUrl ||
            (isImageMessage ? extractImageUrl(msg.content) : undefined),
        };
      });

      // Add welcome message if there are no messages
      if (formattedMessages.length === 0) {
        formattedMessages.unshift({
          id: "welcome-1",
          text: "Hello! How can I help you with your tech needs today?",
          sender: "assistant",
          timestamp: new Date(),
          status: "delivered",
        });
      }

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setIsLoading(false);
      // Ensure we scroll to bottom after loading messages
      setTimeout(scrollToBottom, 100);
    }
  };

  // Add a function to handle starting a new chat
  const handleNewChat = () => {
    if (hasActiveSession) return;

    // Clear current chat state
    setHelpSessionId(null);
    setSessionStatus(null);
    setIsFirstMessage(true);
    setIsClosed(false);
    setSessionRecap(null);

    // Clear processed message IDs when starting a new chat
    processedMessageIds.current.clear();

    // Update URL to remove session ID
    router.push("/app/chat");

    // Reset messages to just the welcome message
    setMessages([
      {
        id: "welcome-1",
        text: "Hello! How can I help you with your tech needs today?",
        sender: "assistant",
        timestamp: new Date(),
        status: "delivered",
      },
    ]);
  };

  // Add a function to make links clickable
  const makeLinksClickable = (text: string): React.ReactNode => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
      <>
        {parts.map((part, index) => {
          if (urlRegex.test(part)) {
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline break-all"
              >
                {part}
              </a>
            );
          }
          return part;
        })}
      </>
    );
  };

  // Add a function to extract image URL from a message
  const extractImageUrl = (content: string): string | undefined => {
    // Try to match [Image 1: URL] format (Twilio format)
    let match = content.match(/\[Image \d+: (.*?)\]/);
    if (match && match[1]) {
      return match[1];
    }

    // Try to match [Image: URL] format
    match = content.match(/\[Image: (.*?)\]/);
    if (match && match[1]) {
      return match[1];
    }

    // Try to match ![Image](URL) format
    match = content.match(/!\[Image\]\((.*?)\)/);
    if (match && match[1]) {
      return match[1];
    }

    // Try to match URL directly if it contains amazonaws
    if (content.includes("deepskygallery.s3.us-east-2.amazonaws.com")) {
      match = content.match(/(https?:\/\/[^\s]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Try to match Twilio URLs directly
    if (content.includes("api.twilio.com")) {
      match = content.match(/(https?:\/\/[^\s]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Try to match Vercel storage URLs
    if (
      content.includes("vercel-storage.com") ||
      content.includes("blob.vercel-storage.com")
    ) {
      match = content.match(/(https?:\/\/[^\s]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Try to match any image URL pattern as fallback
    match = content.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/i);
    if (match && match[1]) {
      return match[1];
    }

    return undefined;
  };

  return (
    <div className="flex h-screen">
      {/* Main Sidebar */}
      <Sidebar
        name={userData?.name || ""}
        profilePictureUrl={userData?.imageUrl || "/default-avatar.png"}
        phoneNumber={userData?.phone || ""}
      />

      {/* Sessions Sidebar */}
      {/* {showSidebar && (
        <SessionsSidebar
          sessions={sessions}
          currentSessionId={helpSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          hasActiveSession={hasActiveSession}
        />
      )} */}

      <div className="flex-1 flex flex-col bg-[#FDF9F4] relative">
        {/* Toggle sidebar button */}
        {/* <button
          onClick={() => setShowSidebar((prev) => !prev)}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100"
        >
          {showSidebar ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          )}
        </button> */}

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-[#2D3E50]">
              Tech Support Chat
            </h1>
            <div className="flex items-center space-x-3">
              {helpSessionId && (
                <div
                  className={`px-3 py-1 rounded-full text-sm ${
                    isClosed
                      ? "bg-gray-100 text-gray-800"
                      : sessionStatus === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {isClosed
                    ? "Closed"
                    : sessionStatus === "pending"
                    ? "Awaiting Message"
                    : "Open"}
                </div>
              )}
              {helpSessionId && !isClosed && (
                <button
                  onClick={handleCloseChat}
                  disabled={isClosing || isClosed}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    isClosing
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {isClosing ? "Closing..." : "Close Chat"}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center mt-1 text-sm text-[#5A7897]">
            <p>
              Want to chat with your phone? Call or text:{" "}
              <span className="font-semibold">888-670-2766</span>
            </p>
            <div className="flex ml-2 space-x-2">
              <a
                href="tel:8886702766"
                className="text-[#2D3E50] hover:text-[#5A7897]"
              >
                <FaPhoneAlt size={14} />
              </a>
              <a
                href="sms:8886702766"
                className="text-[#2D3E50] hover:text-[#5A7897]"
              >
                <FaSms size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-4"
          id="messagesContainer"
        >
          {messages.map((msg, index) => {
            // Check if this is an image message (contains image URL text)
            const isImageUrlMessage =
              msg.text &&
              typeof msg.text === "string" &&
              (msg.text.includes("Image attachment [Image:") ||
                msg.text.includes("[Image 1:") ||
                msg.text.match(/\[Image \d+:/) ||
                msg.text.includes(
                  "deepskygallery.s3.us-east-2.amazonaws.com/eldrix"
                ) ||
                (msg.text.includes("api.twilio.com") &&
                  (msg.text.includes("[Image") ||
                    msg.text.includes("![Image]"))) ||
                msg.text.includes("![Image](https://") ||
                msg.text.match(/!\[Image\]\(.*?\)/) ||
                msg.text.match(/^!\[Image\]/) ||
                msg.text.startsWith("!") ||
                msg.text.includes(
                  "https://rnydzbhxroblhdca.public.blob.vercel-storage.com"
                ) ||
                msg.text.includes("vercel-storage.com") ||
                msg.text.includes("blob.vercel-storage.com"));

            // For image messages, replace the verbose URL text with simpler message
            const displayText = isImageUrlMessage ? "Attached Image" : msg.text;

            // If it's an image URL message but doesn't have imageUrl property,
            // extract the URL from the text
            let imageUrl = msg.imageUrl;
            if (isImageUrlMessage && !imageUrl) {
              // Try to match [Image 1: URL] format (Twilio format)
              let match = msg.text.match(/\[Image \d+: (.*?)\]/);
              if (match && match[1]) {
                imageUrl = match[1];
              } else {
                // Try to match [Image: URL] format
                match = msg.text.match(/\[Image: (.*?)\]/);
                if (match && match[1]) {
                  imageUrl = match[1];
                } else {
                  // Try to match ![Image](URL) format
                  match = msg.text.match(/!\[Image\]\((.*?)\)/);
                  if (match && match[1]) {
                    imageUrl = match[1];
                  } else {
                    // Try to match direct URL patterns
                    match = msg.text.match(/(https?:\/\/[^\s]+)/);
                    if (match && match[1]) {
                      imageUrl = match[1];
                    }
                  }
                }
              }
            }

            return (
              <div
                key={`${msg.id}-${index}`}
                className={`flex ${
                  msg.sender === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.sender === "assistant"
                      ? "bg-white text-[#2D3E50] border border-gray-200"
                      : "bg-[#2D3E50] text-white"
                  }`}
                >
                  {imageUrl ? (
                    <div>
                      <img
                        src={imageUrl}
                        alt="Uploaded content"
                        className="rounded-lg max-h-60 w-auto mb-2"
                        onError={(e) => {
                          // If image fails to load, show the URL as text
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<p class="text-sm">${makeLinksClickable(
                              displayText
                            )}</p>`;
                          }
                        }}
                      />
                      {displayText !== "Attached Image" && (
                        <p className="text-sm mt-2">
                          {makeLinksClickable(displayText)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm">{makeLinksClickable(displayText)}</p>
                  )}
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs opacity-70">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {msg.sender === "user" && msg.status && (
                      <span className="text-xs opacity-70 ml-2">
                        {msg.status === "sending" && "Sending..."}
                        {msg.status === "sent" && "Sent"}
                        {msg.status === "delivered" && "Delivered"}
                        {msg.status === "read" && "Read"}
                        {msg.status === "error" && "Failed to send"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-[#2D3E50] border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div
                    className="w-2 h-2 rounded-full bg-[#2D3E50] animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-[#2D3E50] animate-bounce"
                    style={{ animationDelay: "100ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-[#2D3E50] animate-bounce"
                    style={{ animationDelay: "200ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center space-x-2"
          >
            <button
              type="button"
              onClick={handleImageUpload}
              disabled={isClosed}
              className={`text-[#5A7897] hover:text-[#2D3E50] p-2 rounded-full transition ${
                isClosed ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FaImage size={20} />
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isClosed}
            />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isClosed
                  ? "This chat session has been closed"
                  : "Type your message here..."
              }
              className={`flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2D3E50]/40 ${
                isClosed ? "bg-gray-100 text-gray-500" : ""
              }`}
              disabled={isClosed}
            />
            <button
              type="submit"
              disabled={(!message.trim() && !isLoading) || isClosed}
              className={`bg-[#2D3E50] text-white p-2 rounded-full transition ${
                (!message.trim() && !isLoading) || isClosed
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#24466d]"
              }`}
            >
              <FaPaperPlane size={16} />
            </button>
          </form>
        </div>
      </div>
      {showSidebar && (
        <SessionsSidebar
          sessions={sessions}
          currentSessionId={helpSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          hasActiveSession={hasActiveSession}
        />
      )}
    </div>
  );
};

export default Chat;
