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

const NavItems = ({
  isMobile = false,
  onItemClick,
}: {
  isMobile?: boolean;
  onItemClick?: () => void;
}) => {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex gap-4",
        isMobile ? "flex-col items-stretch w-full" : "items-center"
      )}
    >
      {navItems.map(({ label, href }) => (
        <Link
          href={href}
          key={label}
          onClick={onItemClick}
          className={cn(
            "transition-colors hover:text-primary-200",
            pathname === href && "text-primary font-semibold",
            href === "/create" && pathname.startsWith("/create") && "hidden",
            href === "/pricing" && pathname.startsWith("/pricing") && "hidden",
            href === "/dashboard" &&
              pathname.startsWith("/dashboard") &&
              "hidden",
            href === "/profile" && pathname.startsWith("/profile") && "hidden",
            href === "/job-targets" &&
              pathname.startsWith("/job-targets") &&
              "hidden",
            isMobile && "py-2 px-4 text-center rounded-md hover:bg-dark-300/50"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};

export default NavItems;
