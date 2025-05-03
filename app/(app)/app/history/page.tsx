"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "../../../components/Sidebar";

interface UserData {
  name: string;
  imageUrl: string;
  phone: string;
  email?: string;
  id?: string;
}

const History = () => {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);

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

  return (
    <div className="flex h-screen">
      {userData && (
        <Sidebar
          name={userData.name}
          profilePictureUrl={userData.imageUrl || "/default-avatar.png"}
          phoneNumber={userData.phone}
        />
      )}
      <div className="flex-1 p-6">History Content</div>
    </div>
  );
};

export default History;
