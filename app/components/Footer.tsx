import Link from "next/link";
import Image from "next/image";
import {
  FaInstagram,
  FaFacebookF,
  FaGithub,
  FaLinkedinIn,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#FDF9F4] w-full border-t border-[#E5E7EB] py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Image
            src="/logos/logoHorizontal.png"
            alt="Eldrix Icon"
            width={200}
            height={80}
          />
          <p className="text-sm text-[#5A7897]">
            © {new Date().getFullYear()} Eldrix.app. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center md:justify-start gap-4">
          <Link
            href="/privacy"
            className="text-sm text-[#2D3E50] transition hover:text-[#24466d]"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-[#2D3E50] transition hover:text-[#24466d]"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="text-sm text-[#2D3E50] transition hover:text-[#24466d]"
          >
            Contact
          </Link>
          <Link
            href="/about"
            className="text-sm text-[#2D3E50] transition hover:text-[#24466d]"
          >
            About
          </Link>
          <Link
            href="/faqs"
            className="text-sm text-[#2D3E50] transition hover:text-[#24466d]"
          >
            FAQs
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-[#2D3E50] transition hover:text-[#24466d]"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-[#2D3E50] transition hover:text-[#24466d]"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm text-[#2D3E50] transition hover:text-[#24466d]"
          >
            Sign Up
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="https://www.instagram.com/eldrixapp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2D3E50] transition hover:text-[#24466d]"
          >
            <FaInstagram size={20} />
          </Link>
          <Link
            href="https://www.facebook.com/eldrixapp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2D3E50] transition hover:text-[#24466d]"
          >
            <FaFacebookF size={20} />
          </Link>
          <Link
            href="https://github.com/eldrixapp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2D3E50] transition hover:text-[#24466d]"
          >
            <FaGithub size={20} />
          </Link>
          <Link
            href="https://www.linkedin.com/company/eldrixapp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2D3E50] transition hover:text-[#24466d]"
          >
            <FaLinkedinIn size={20} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
