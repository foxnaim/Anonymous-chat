'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface NavLinkProps {
  href?: string;
  to?: string;
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  children?: React.ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, pendingClassName, href, to, children, ...props }, ref) => {
    const pathname = usePathname();
    const linkHref = href || to || "";
    const isActive = pathname === linkHref;
    
    return (
      <Link
        ref={ref}
        href={linkHref as any}
        className={cn(className, isActive && activeClassName)}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
