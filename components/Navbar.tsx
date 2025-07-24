"use client";

import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import NavItems from "@/components/NavItems";
import { useState } from "react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
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
        className="sm:hidden flex flex-col justify-center items-center w-10 h-10 ml-auto z-20"
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
      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-dark-200 shadow-lg flex flex-col items-center gap-6 py-6 animate-fadeIn sm:hidden z-10">
          <NavItems />
          <SignedOut>
            <div className="w-full flex flex-col gap-3 items-center">
              <Link href="/sign-in" className="w-full flex justify-center">
                <button className="btn-secondary w-11/12 px-6 py-2 rounded-full font-bold transition-colors">
                  Sign In
                </button>
              </Link>
              <Link href="/sign-up" className="w-full flex justify-center">
                <button className="btn-primary w-11/12 px-6 py-2 rounded-full font-bold transition-colors">
                  Sign Up
                </button>
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="w-full flex justify-center">
              <UserButton />
            </div>
          </SignedIn>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
