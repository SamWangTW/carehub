"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/patients", label: "Patients" },
  { href: "/schedule", label: "Schedule" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-8 text-base">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/" && pathname?.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`pb-2 ${
              active
                ? "text-foreground border-b-2 border-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
