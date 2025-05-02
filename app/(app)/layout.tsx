"use client";
import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [userData, setUserData] = useState({
    name: "Loading...",
    profilePictureUrl: "/default-avatar.png",
    phoneNumber: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data after component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/getUser");
        if (response.ok) {
          const data = await response.json();
          setUserData({
            name: data.name,
            profilePictureUrl: data.profilePictureUrl,
            phoneNumber: data.phoneNumber || "Add phone number",
          });
        } else {
          // If not authenticated, show default values
          setUserData({
            name: "Guest",
            profilePictureUrl: "/default-avatar.png",
            phoneNumber: "Sign in to see details",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <SessionProvider>
      <div className="flex h-screen">
        {!isLoading && <Sidebar {...userData} />}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </SessionProvider>
  );
}
