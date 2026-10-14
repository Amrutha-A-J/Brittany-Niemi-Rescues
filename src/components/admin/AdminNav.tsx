"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/cats", label: "Cats" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/meetings", label: "Meet & greets" },
  { href: "/admin/adopted", label: "Adopted" },
  { href: "/admin/account", label: "Account" },
];

export function AdminNav({ newCount }: { newCount: number }) {
  const path = usePathname();
  return (
    <ul className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((item) => {
        const active = item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? "bg-ink text-white" : "text-ink hover:bg-card"
              }`}
            >
              {item.label}
              {item.href === "/admin/applications" && newCount > 0 && (
                <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-white text-ink" : "bg-ink text-white"}`}>
                  {newCount}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
