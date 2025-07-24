"use client";

import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import NavItems from "@/components/NavItems";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`navbar-enhanced relative transition-all duration-300 ${
          scrolled ? "navbar-scrolled" : ""
        }`}
      >
        <div className="flex items-center justify-between mx-auto w-full px-6 md:px-14 py-4 max-sm:px-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <Image
                  src="/logo.svg"
                  alt="HiredAI logo"
                  width={46}
                  height={44}
                  className="transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-primary-200/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </div>
              <h2 className="text-primary-100 font-bold text-xl tracking-tight group-hover:text-primary-200 transition-colors duration-200">
                HiredAI
              </h2>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="items-center gap-8 max-sm:hidden flex">
            <NavItems />
            <SignedOut>
              <div className="flex items-center gap-3">
                <Link href="/sign-in">
                  <button className="nav-btn-secondary">Sign In</button>
                </Link>
                <Link href="/sign-up">
                  <button className="nav-btn-primary">Sign Up</button>
                </Link>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="w-11 h-11 rounded-full bg-gradient-to-r from-primary-200/20 to-primary-100/20 border border-primary-200/30 flex items-center justify-center">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-9 h-9",
                      userButtonPopoverCard:
                        "bg-dark-200 border border-gray-700/50",
                      userButtonPopoverActionButton:
                        "text-white hover:bg-dark-300/50",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>

          {/* Enhanced Mobile Hamburger */}
          <button
            className="sm:hidden flex flex-col justify-center items-center w-12 h-12 ml-auto z-30 relative rounded-lg hover:bg-dark-200/50 transition-colors duration-200 group"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span
              className={`block w-6 h-0.5 bg-primary-100 transition-all duration-300 group-hover:bg-primary-200 ${
                menuOpen ? "rotate-45 translate-y-1.5" : ""
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-primary-100 my-1.5 transition-all duration-300 group-hover:bg-primary-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-primary-100 transition-all duration-300 group-hover:bg-primary-200 ${
                menuOpen ? "-rotate-45 -translate-y-1.5" : ""
              }`}
            ></span>
          </button>
        </div>
      </nav>

      {/* Enhanced Mobile Menu Backdrop */}
      {mounted && menuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-20 sm:hidden animate-fadeIn"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Enhanced Mobile Dropdown */}
      {mounted && menuOpen && (
        <div className="mobile-menu-enhanced">
          <div className="flex flex-col gap-6">
            <NavItems isMobile={true} onItemClick={() => setMenuOpen(false)} />
          </div>

          <div className="border-t border-gradient-subtle pt-6">
            <SignedOut>
              <div className="flex flex-col gap-4">
                <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
                  <button className="nav-btn-secondary w-full py-3">
                    Sign In
                  </button>
                </Link>
                <Link href="/sign-up" onClick={() => setMenuOpen(false)}>
                  <button className="nav-btn-primary w-full py-3">
                    Sign Up
                  </button>
                </Link>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-dark-300/30 border border-primary-200/20 flex items-center justify-center">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                        userButtonPopoverCard:
                          "bg-dark-200 border border-gray-700/50",
                        userButtonPopoverActionButton:
                          "text-white hover:bg-dark-300/50",
                      },
                    }}
                  />
                </div>
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
