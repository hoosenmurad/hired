"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  //{ label: "Home", href: "/" },
  { label: "Create", href: "/create" },
  { label: "Pricing", href: "/pricing" },
];

const NavItems = () => {
  const pathname = usePathname();

  // Hide Create and Pricing when on /create
  if (pathname === "/create") return null;

  return (
    <nav className="flex items-center gap-4">
      {navItems.map(({ label, href }) => (
        <Link
          href={href}
          key={label}
          className={cn(pathname === href && "text-primary font-semibold")}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default NavItems;
