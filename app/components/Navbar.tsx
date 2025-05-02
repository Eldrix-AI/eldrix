"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaBars, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
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
          className="sm:hidden text-2xl text-[#2D3E50]"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-[#2D3E50] font-medium transition hover:text-[#24466d] ${
                pathname === href
                  ? "underline decoration-2 decoration-[#2D3E50] underline-offset-4"
                  : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-4">
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
        <div className="sm:hidden bg-white border-t border-[#E5E7EB] px-4 py-6 flex flex-col items-center gap-4">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`text-[#2D3E50] font-medium transition hover:text-[#24466d] ${
                pathname === href
                  ? "underline decoration-2 decoration-[#2D3E50] underline-offset-4"
                  : ""
              }`}
            >
              {label}
            </Link>
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
