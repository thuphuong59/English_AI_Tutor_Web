"use client";

import Link from "next/link";
import { useState } from "react";
import { useUser } from "@/app/settings/UserContext";
import { logoutUser } from "@/services/authService";
import { FiLogOut, FiSettings, FiUser, FiMenu, FiX } from "react-icons/fi";
import { usePathname } from "next/navigation"; // <--- 1. IMPORT HOOK NÀY

export default function Navbar() {
  const { user, refreshUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname(); // <--- 2. LẤY PATHNAME HIỆN TẠI

  // <--- 3. LOGIC QUAN TRỌNG: ẨN NAVBAR NẾU ĐANG Ở TRANG ADMIN --->
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const username =
    user?.username ||
    user?.user_metadata?.username ||
    user?.db_profile?.username ||
    user?.email?.split("@")[0] ||
    "User";

  const avatar =
    user?.avatar_url ||
    user?.db_profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${username}`;

  const handleLogout = async () => {
    await logoutUser();
    refreshUser();
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Test", href: "/test" },
    { label: "Practice", href: "/practice" },
    { label: "Vocabulary", href: "/vocabulary" },
  ];

  const primaryColor = "#0067C5";
  const primaryHover = "#0052A3";

  return (
    <nav className="w-full bg-gradient-to-r from-[#e6f0fa] via-white to-[#e6f0fa] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-2xl font-bold transition"
              style={{ color: primaryColor }}
            >
              English AI Tutor
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-6 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium transition-colors hover:text-[#0052A3]"
                style={{ color: primaryColor }}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-full px-3 py-1 transition"
                  style={{ border: `1px solid ${primaryColor}` }}
                >
                  <img
                    src={avatar}
                    alt="avatar"
                    className="w-8 h-8 rounded-full border object-cover"
                    style={{ borderColor: primaryColor }}
                  />
                  <span className="hidden sm:inline font-semibold text-gray-700">
                    {username}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-lg overflow-hidden animate-fadeIn">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm transition hover:bg-[#e6f0fa]"
                      style={{ color: primaryColor }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiUser /> Roadmap
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm transition hover:bg-[#e6f0fa]"
                      style={{ color: primaryColor }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiSettings /> Profiles
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <FiLogOut /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-2 rounded-lg text-white transition hover:bg-[#0052A3]"
                style={{ backgroundColor: primaryColor }}
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded transition"
              style={{ color: primaryColor }}
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg animate-fadeIn">
          <ul className="flex flex-col px-4 py-2 gap-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block px-3 py-2 rounded font-medium transition hover:bg-[#e6f0fa] hover:text-[#0067C5]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {user ? (
              <>
                <li>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded transition hover:bg-[#e6f0fa]"
                    style={{ color: primaryColor }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiUser /> Roadmap
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 rounded transition hover:bg-[#e6f0fa]"
                    style={{ color: primaryColor }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiSettings /> Profile
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-red-600 rounded hover:bg-red-50 transition"
                  >
                    <FiLogOut /> Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/auth"
                  className="block px-3 py-2 rounded text-white text-center transition hover:bg-[#0052A3]"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}