"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "../../../components/Sidebar";

interface UserData {
  name: string;
  email?: string;
  id?: string;
  imageUrl: string;
  phone: string;
}

const Dashboard = () => {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      console.log("Fetching user data for ID:", session.user.id);
      fetch(`/api/getUser?userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("User data received:", data);
          setUserData(data);
        })
        .catch((err) => console.error("Error fetching user data:", err));
    }
  }, [session]);

  console.log("Current userData state:", userData);

  return (
    <div className="flex h-screen">
      {userData && (
        <Sidebar
          name={userData.name || "User"}
          profilePictureUrl={userData.imageUrl || "/default-avatar.png"}
          phoneNumber={userData.phone || ""}
        />
      )}
      <div className="flex-1 p-6">Dashboard Content</div>
    </div>
  );
};

export default Dashboard;
