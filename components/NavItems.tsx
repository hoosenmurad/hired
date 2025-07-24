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
        "flex items-center gap-2",
        isMobile ? "flex-col items-stretch w-full gap-1" : ""
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
              // Base styles
              "relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              // Desktop styles
              !isMobile && [
                "text-light-100 hover:text-primary-200 hover:bg-dark-200/30",
                "before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2",
                "before:w-0 before:h-0.5 before:bg-primary-200 before:transition-all before:duration-200",
                "hover:before:w-3/4",
              ],
              // Mobile styles
              isMobile && [
                "text-light-100 hover:text-white hover:bg-dark-300/50",
                "text-center border border-transparent hover:border-primary-200/20",
              ],
              // Active state
              isActive && [
                !isMobile
                  ? ["text-primary-200 bg-dark-200/40", "before:w-3/4"]
                  : ["text-primary-200 bg-dark-300/50 border-primary-200/30"],
              ],
              // Hide if needed
              shouldHide && "hidden"
            )}
          >
            {label}
            {/* Active indicator for mobile */}
            {isMobile && isActive && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-200 rounded-full"></div>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavItems;
