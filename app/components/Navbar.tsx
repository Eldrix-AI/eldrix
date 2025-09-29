"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaBars, FaTimes, FaPhone, FaSms } from "react-icons/fa";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showPhoneOptions, setShowPhoneOptions] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
    {
      href: "tel:8886702766",
      label: "Call or Text: (888) 670-2766",
      isPhone: true,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#FDF9F4]/90 shadow-md" : "bg-[#FDF9F4]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/logos/logoHorizontal.png"
            alt="Eldrix Logo"
            width={200}
            height={80}
            priority
          />
        </Link>

        <button
          className="lg:hidden text-2xl text-[#2D3E50]"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map(({ href, label, isPhone }) => (
            <div key={href} className="relative">
              {isPhone ? (
                <button
                  onClick={() => setShowPhoneOptions(!showPhoneOptions)}
                  className="inline-flex items-center gap-2 text-[#2D3E50] bg-[#2D3E50]/10 px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#2D3E50]/20 hover:scale-105 shadow-sm transition"
                >
                  <FaPhone className="text-xs" />
                  {label}
                </button>
              ) : (
                <Link
                  href={href}
                  className={`font-medium transition hover:text-[#24466d] text-[#2D3E50] ${
                    pathname === href
                      ? "underline decoration-2 decoration-[#2D3E50] underline-offset-4"
                      : ""
                  }`}
                >
                  {label}
                </Link>
              )}

              {isPhone && showPhoneOptions && (
                <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-2 min-w-[200px] z-50">
                  <Link
                    href="tel:8886702766"
                    className="flex items-center gap-3 px-4 py-2 text-[#2D3E50] hover:bg-[#2D3E50]/10 transition"
                    onClick={() => setShowPhoneOptions(false)}
                  >
                    <FaPhone className="text-sm" />
                    <span className="font-medium">Call (888) 670-2766</span>
                  </Link>
                  <Link
                    href="sms:8886702766"
                    className="flex items-center gap-3 px-4 py-2 text-[#2D3E50] hover:bg-[#2D3E50]/10 transition"
                    onClick={() => setShowPhoneOptions(false)}
                  >
                    <FaSms className="text-sm" />
                    <span className="font-medium">Text (888) 670-2766</span>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <Link
            href="/login"
            className="rounded-lg border border-[#2D3E50] px-4 py-2 text-[#2D3E50] font-semibold transition hover:bg-[#2D3E50]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D3E50]"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[#2D3E50] px-4 py-2 text-white font-semibold transition hover:bg-[#24466d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D3E50]"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E5E7EB] px-4 py-6 flex flex-col items-center gap-4">
          {navLinks.map(({ href, label, isPhone }) => (
            <div key={href} className="w-full">
              {isPhone ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="tel:8886702766"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 text-[#2D3E50] bg-[#2D3E50]/10 px-4 py-3 rounded-full text-sm font-semibold hover:bg-[#2D3E50]/20 w-full shadow-sm"
                  >
                    <FaPhone className="text-xs" />
                    Call (888) 670-2766
                  </Link>
                  <Link
                    href="sms:8886702766"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center justify-center gap-2 text-[#2D3E50] bg-[#2D3E50]/10 px-4 py-3 rounded-full text-sm font-semibold hover:bg-[#2D3E50]/20 w-full shadow-sm"
                  >
                    <FaSms className="text-xs" />
                    Text (888) 670-2766
                  </Link>
                </div>
              ) : (
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`font-medium transition hover:text-[#24466d] text-[#2D3E50] ${
                    pathname === href
                      ? "underline decoration-2 decoration-[#2D3E50] underline-offset-4"
                      : ""
                  }`}
                >
                  {label}
                </Link>
              )}
            </div>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="w-full text-center rounded-lg border border-[#2D3E50] px-4 py-2 text-[#2D3E50] font-semibold transition hover:bg-[#2D3E50]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D3E50]"
          >
            Login
          </Link>
          <Link
            href="/signup"
            onClick={() => setMenuOpen(false)}
            className="w-full text-center rounded-lg bg-[#2D3E50] px-4 py-2 text-white font-semibold transition hover:bg-[#24466d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D3E50]"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
