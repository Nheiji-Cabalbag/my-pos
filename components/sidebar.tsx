"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/", label: "POS" },
  { href: "/inventory", label: "Inventory" },
  { href: "/sales", label: "Sales" },
  { href: "/reports", label: "Reports" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 print:hidden md:w-56 md:flex-col md:border-b-0 md:border-r md:p-4">
      <span className="hidden px-3 pb-5 text-lg font-semibold text-emerald-700 md:block">My Store</span>
      {links.map((l) => (
        <Link key={l.href} href={l.href}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${path === l.href ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100"}`}>
          {l.label}
        </Link>
      ))}
      <button onClick={() => supabase.auth.signOut()}
        className="ml-auto whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100 md:ml-0 md:mt-auto">
        Sign out
      </button>
    </nav>
  );
}
