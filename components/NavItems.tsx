"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Profile", href: "/profile" },
  { label: "Job Targets", href: "/job-targets" },
  { label: "Create Interview", href: "/create" },
  { label: "Pricing", href: "/pricing" },
];

const NavItems = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-4">
      {navItems.map(({ label, href }) => (
        <Link
          href={href}
          key={label}
          className={cn(
            pathname === href && "text-primary font-semibold",
            href === "/create" && pathname.startsWith("/create") && "hidden",
            href === "/pricing" && pathname.startsWith("/pricing") && "hidden",
            href === "/dashboard" &&
              pathname.startsWith("/dashboard") &&
              "hidden",
            href === "/profile" && pathname.startsWith("/profile") && "hidden",
            href === "/job-targets" &&
              pathname.startsWith("/job-targets") &&
              "hidden"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default NavItems;
