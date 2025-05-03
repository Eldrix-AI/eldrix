"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "../../../components/Sidebar";

interface UserData {
  name: string;
  profilePictureUrl: string;
  phoneNumber: string;
  email?: string;
  id?: string;
}

const Usage = () => {
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
          profilePictureUrl={userData.profilePictureUrl}
          phoneNumber={userData.phoneNumber}
        />
      )}
      <div className="flex-1 p-6">Usage Content</div>
    </div>
  );
};

export default Usage;
