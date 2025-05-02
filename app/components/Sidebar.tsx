import React from "react";
import Link from "next/link";
import {
  FaTachometerAlt,
  FaComments,
  FaChartBar,
  FaCog,
  FaHistory,
  FaSignOutAlt,
} from "react-icons/fa";

interface SidebarProps {
  name: string;
  profilePictureUrl: string;
  phoneNumber: string;
}

export default function Sidebar({
  name,
  profilePictureUrl,
  phoneNumber,
}: SidebarProps) {
  const navItems = [
    { label: "Dashboard", href: "/dashboard", Icon: FaTachometerAlt },
    { label: "Chat", href: "/chat", Icon: FaComments },
    { label: "Usage", href: "/usage", Icon: FaChartBar },
    { label: "Settings", href: "/settings", Icon: FaCog },
    { label: "History", href: "/history", Icon: FaHistory },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* User Info */}
      <div className="flex flex-col items-center px-6 py-8">
        <img
          src={profilePictureUrl}
          alt={`${name}'s profile picture`}
          className="w-20 h-20 rounded-full object-cover"
        />
        <h2 className="mt-4 text-lg font-semibold text-gray-800">{name}</h2>
        <p className="mt-1 text-sm text-gray-500">{phoneNumber}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navItems.map(({ label, href, Icon }) => (
            <li key={label}>
              <Link
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-4 py-6">
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition"
        >
          <FaSignOutAlt className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
