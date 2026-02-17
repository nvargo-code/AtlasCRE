"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center px-4 justify-between z-50">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold text-teal-600">
          AtlasCRE
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 transition-colors">
            Map
          </Link>
          <Link href="/favorites" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 transition-colors">
            Favorites
          </Link>
          <Link href="/saved-searches" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 transition-colors">
            Saved Searches
          </Link>
          {(session?.user as { role?: string })?.role === "ADMIN" && (
            <Link href="/admin" className="text-gray-600 dark:text-gray-300 hover:text-teal-600 transition-colors">
              Admin
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {session?.user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-teal-600 px-2 py-1 rounded transition-colors"
            >
              {session.user.email}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
