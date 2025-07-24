"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav
      className={cn(
        "flex items-center gap-4",
        isMobile ? "flex-col items-stretch w-full" : ""
      )}
    >
      {navItems.map(({ label, href }) => {
        // Only apply pathname-dependent classes after component mounts
        const isActive = mounted && pathname === href;
        const shouldHide = mounted && pathname.startsWith(href) && href !== "/";

        return (
          <Link
            href={href}
            key={label}
            onClick={onItemClick}
            className={cn(
              "transition-colors hover:text-primary-200",
              isActive && "text-primary font-semibold",
              shouldHide && "hidden",
              isMobile &&
                "py-2 px-4 text-center rounded-md hover:bg-dark-300/50"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavItems;
