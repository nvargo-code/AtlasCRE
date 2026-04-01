"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/portal", label: "Dashboard", icon: "grid" },
  { href: "/portal/collections", label: "Collections", icon: "folder" },
  { href: "/portal/saved", label: "Saved Homes", icon: "heart" },
  { href: "/portal/saved-searches", label: "Saved Searches", icon: "search" },
  { href: "/portal/showings", label: "Showings", icon: "calendar" },
  { href: "/portal/messages", label: "Messages", icon: "chat" },
];

function NavIcon({ icon }: { icon: string }): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    grid: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
    folder: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
    heart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    calendar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    chat: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  };
  return icons[icon] || null;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/portal");
  }, [status, router]);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/portal/messages")
      .then((r) => r.ok ? r.json() : { threads: [] })
      .then((data) => {
        const unread = (data.threads || []).filter((t: { hasUnread: boolean }) => t.hasUnread).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetch("/api/portal/messages")
        .then((r) => r.ok ? r.json() : { threads: [] })
        .then((data) => {
          const unread = (data.threads || []).filter((t: { hasUnread: boolean }) => t.hasUnread).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-gray">
        <div className="text-mid-gray">Loading portal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-gray flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-navy flex-col flex-shrink-0">
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logos/sg-horizontal-white.png" alt="Shapiro Group" className="h-8 w-auto" />
          </Link>
          <Link href="/portal/messages" className="relative text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gold rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <NavIcon icon={item.icon} />
                {item.label}
              </Link>
            );
          })}

          {/* Agent section */}
          {((session?.user as { role?: string })?.role === "ADMIN" || (session?.user as { role?: string })?.role === "AGENT") && (
            <>
              <div className="border-t border-white/10 mt-4 pt-4 mb-2 px-4">
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/30">Agent Tools</span>
              </div>
              {[
                { href: "/portal/agent", label: "Agent Dashboard", icon: "grid" },
                { href: "/portal/agent/clients", label: "Client Activity", icon: "heart" },
                { href: "/portal/agent/tours", label: "Tour Planner", icon: "calendar" },
                { href: "/admin-email", label: "Add Pocket Listing", icon: "folder" },
              ].map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/30 hover:text-white/60 hover:bg-white/5"
                    }`}
                  >
                    <NavIcon icon={item.icon} />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            href="/search"
            className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white text-sm font-semibold rounded-lg hover:bg-gold-dark transition-colors w-full justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            SuperSearch
          </Link>
        </div>

        <div className="p-4 border-t border-white/10">
          <Link href="/portal/settings" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-bold">
              {session.user?.name?.[0] || session.user?.email?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate group-hover:text-gold transition-colors">{session.user?.name || "User"}</p>
              <p className="text-white/40 text-[11px] truncate">{session.user?.email}</p>
            </div>
            <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-navy/10 z-40 flex">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-[10px] ${
                isActive ? "text-gold" : "text-mid-gray"
              }`}
            >
              <NavIcon icon={item.icon} />
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
