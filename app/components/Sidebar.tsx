import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FaTachometerAlt,
  FaComments,
  FaChartBar,
  FaCog,
  FaHistory,
  FaSignOutAlt,
  FaBars,
  FaTimes,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  console.log(phoneNumber);
  console.log(name);
  console.log(profilePictureUrl);

  // Set collapsed by default on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    // Run once on mount
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Format phone number
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    console.log("Formatting phone number:", phone);
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return phone;
  };

  const navItems = [
    { label: "Dashboard", href: "/app/dashboard", Icon: FaTachometerAlt },
    { label: "Chat", href: "/app/chat", Icon: FaComments },
    { label: "Settings", href: "/app/settings", Icon: FaCog },
    { label: "History", href: "/app/history", Icon: FaHistory },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Toggle Button - Fixed Position */}
      <button
        className="fixed top-4 left-2 z-50 bg-white border border-gray-200 rounded-full p-2 shadow-md block md:hidden"
        onClick={toggleSidebar}
      >
        <FaBars className="w-5 h-5 text-gray-600" />
      </button>

      <aside
        className={`${
          isCollapsed
            ? "w-0 md:w-16 -translate-x-full md:translate-x-0"
            : "w-56"
        } h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 fixed md:relative z-40`}
      >
        {/* Desktop Toggle Button */}
        <button
          className="absolute -right-3 top-4 bg-white border border-gray-200 rounded-full p-1 shadow-md hidden md:flex"
          onClick={toggleSidebar}
        >
          {isCollapsed ? (
            <FaBars className="w-4 h-4 text-gray-600" />
          ) : (
            <FaTimes className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* User Info */}
        <Link href="/app/settings#account">
          <div
            className={`flex flex-col items-center px-4 py-6 ${
              isCollapsed ? "space-y-2" : "space-y-3"
            }`}
          >
            <div
              className={`${
                isCollapsed ? "w-10 h-10 md:block hidden" : "w-16 h-16"
              } overflow-hidden rounded-full flex items-center justify-center bg-blue-500 text-white font-semibold`}
            >
              <span className={`${isCollapsed ? "text-sm" : "text-lg"}`}>
                {name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </div>
            {!isCollapsed && (
              <>
                <h2 className="mt-2 text-md font-semibold text-gray-800">
                  {name}
                </h2>
                {phoneNumber && (
                  <p className="text-xs text-gray-500">
                    {formatPhoneNumber(phoneNumber)}
                  </p>
                )}
              </>
            )}
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-2 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map(({ label, href, Icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${
                    isCollapsed ? "justify-center" : ""
                  } ${
                    pathname?.startsWith(href)
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className={`${isCollapsed ? "w-6 h-6" : "w-5 h-5"}`} />
                  {!isCollapsed && <span className="text-base">{label}</span>}
                </Link>
              </li>
            ))}

            {/* Logout button moved into navigation */}
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition ${
                  isCollapsed ? "justify-center" : ""
                }`}
              >
                <FaSignOutAlt
                  className={`${isCollapsed ? "w-6 h-6" : "w-5 h-5"}`}
                />
                {!isCollapsed && <span className="text-base">Logout</span>}
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}
