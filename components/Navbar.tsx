"use client";

import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import NavItems from "@/components/NavItems";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <nav className="navbar relative">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <Image src="/logo.svg" alt="logo" width={46} height={44} />{" "}
            <h2 className="text-primary-100">HiredAI</h2>
          </div>
        </Link>
        {/* Desktop Nav */}
        <div className="items-center gap-8 max-sm:hidden flex">
          <NavItems />
          <SignedOut>
            <div className="flex items-center gap-3">
              <Link href="/sign-in">
                <button className="btn-secondary px-6 py-2 rounded-full font-bold transition-colors hover:bg-dark-200/60">
                  Sign In
                </button>
              </Link>
              <Link href="/sign-up">
                <button className="btn-primary px-6 py-2 rounded-full font-bold transition-colors">
                  Sign Up
                </button>
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
        {/* Hamburger for mobile */}
        <button
          className="sm:hidden flex flex-col justify-center items-center w-10 h-10 ml-auto z-30 relative"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span
            className={`block w-7 h-0.5 bg-primary-100 transition-all duration-300 ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></span>
          <span
            className={`block w-7 h-0.5 bg-primary-100 my-1 transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`block w-7 h-0.5 bg-primary-100 transition-all duration-300 ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          ></span>
        </button>
      </nav>

      {/* Mobile Menu Backdrop */}
      {mounted && menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 sm:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Dropdown */}
      {mounted && menuOpen && (
        <div className="fixed top-[72px] right-4 left-4 bg-dark-200 shadow-2xl flex flex-col gap-6 p-6 animate-fadeIn sm:hidden z-30 rounded-xl border border-gray-700/50 max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="flex flex-col gap-4">
            <NavItems isMobile={true} onItemClick={() => setMenuOpen(false)} />
          </div>

          <div className="border-t border-gray-700/50 pt-4">
            <SignedOut>
              <div className="flex flex-col gap-3">
                <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
                  <button className="btn-secondary w-full px-6 py-3 rounded-full font-bold transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link href="/sign-up" onClick={() => setMenuOpen(false)}>
                  <button className="btn-primary w-full px-6 py-3 rounded-full font-bold transition-colors">
                    Sign Up
                  </button>
                </Link>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex justify-center">
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
