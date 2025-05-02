"use client";
import React from "react";
import { useSession } from "next-auth/react";

const Dashboard = () => {
  const { data: session } = useSession();

  console.log("User ID:", session?.user?.id);

  return <div>Dashboard</div>;
};

export default Dashboard;
