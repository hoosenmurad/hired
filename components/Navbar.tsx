import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import NavItems from "@/components/NavItems";

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <Image src="/logo.svg" alt="logo" width={46} height={44} />{" "}
          <h2 className="text-primary-100">HiredAI</h2>
        </div>
      </Link>
      <div className="flex items-center gap-8">
        <NavItems />
        <SignedOut>
          <Link href="/sign-up">
            <button className="btn-primary max-sm:w-full px-6 py-2 rounded-full font-bold transition-colors">
              Sign Up
            </button>
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
};

export default Navbar;
