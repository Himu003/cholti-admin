"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, MonitorPlay, ShoppingBag, ClipboardList, LayoutGrid, Star, Settings, HelpCircle, Users, SlidersHorizontal, ChevronDown, Megaphone, Info, UserCog,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/users", label: "Users", Icon: Users },
  { href: "/hero", label: "Hero", Icon: MonitorPlay },
  { href: "/brand", label: "Brand", Icon: Megaphone },
  { href: "/about", label: "About", Icon: Info },
  { href: "/products", label: "Products", Icon: ShoppingBag },
  { href: "/options", label: "Product Options", Icon: SlidersHorizontal },
  { href: "/orders", label: "Orders", Icon: ClipboardList },
  { href: "/categories", label: "Categories", Icon: LayoutGrid },
  { href: "/faqs", label: "FAQs", Icon: HelpCircle },
  { href: "/reviews", label: "Reviews", Icon: Star },
  { href: "/settings", label: "Settings", Icon: Settings },
  { href: "/admins", label: "Admins", Icon: UserCog },
];

const GROUPS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard, hrefs: ["/dashboard"] },
  { id: "catalog", label: "Catalog", Icon: ShoppingBag, hrefs: ["/products", "/categories", "/options"] },
  { id: "sales", label: "Sales", Icon: ClipboardList, hrefs: ["/orders", "/users", "/reviews"] },
  { id: "content", label: "Content", Icon: MonitorPlay, hrefs: ["/hero", "/brand", "/about", "/faqs"] },
  { id: "system", label: "System", Icon: Settings, hrefs: ["/settings", "/admins"] },
];

const STORE_KEY = "cholti_nav_open";

const isActive = (pathname: string, href: string) =>
  pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

function linkCls(active: boolean) {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold ${
    active ? "bg-white/15 text-white" : "text-neutral-200 hover:bg-white/10"
  }`;
}

export default function AdminNav({ isAdmin = false, grouped = true }: { isAdmin?: boolean; grouped?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? NAV : NAV.filter((n) => n.href !== "/admins");
  const [open, setOpen] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let initial: string[] = [];
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) initial = (JSON.parse(raw) as string[]).filter((x) => typeof x === "string");
    } catch {}
    const activeGroup = GROUPS.find((g) => g.hrefs.some((h) => isActive(pathname, h)))?.id;
    if (activeGroup && !initial.includes(activeGroup)) initial = [...initial, activeGroup];
    setOpen(initial);
    setReady(true);
  }, [pathname]);

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  if (!grouped) {
    return (
      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-current={isActive(pathname, href) ? "page" : undefined} className={linkCls(isActive(pathname, href))}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    );
  }

  const byHref = new Map(items.map((i) => [i.href, i]));
  const groups = GROUPS.map((g) => ({ ...g, links: g.hrefs.map((h) => byHref.get(h)).filter((x) => x !== undefined) })).filter(
    (g) => g.links.length > 0
  );

  return (
    <nav className="flex flex-col gap-1">
      {groups.map(({ id, label, Icon, links }) => {
        const expanded = !ready || open.includes(id);
        const groupActive = links.some((l) => isActive(pathname, l.href));
        return (
          <div key={id}>
            <button
              onClick={() => ready && toggle(id)}
              aria-expanded={expanded}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-bold ${
                groupActive ? "text-white" : "text-neutral-300 hover:bg-white/10"
              }`}
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{label}</span>
              <ChevronDown size={14} className={`transition-transform ${expanded ? "" : "-rotate-90"}`} />
            </button>
            {expanded && (
              <div className="flex flex-col gap-1 ml-4 mt-0.5 border-l border-white/10 pl-2">
                {links.map(({ href, label: l, Icon: LI }) => (
                  <Link key={href} href={href} aria-current={isActive(pathname, href) ? "page" : undefined} className={linkCls(isActive(pathname, href))}>
                    <LI size={16} />
                    {l}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
