"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// Pages with dark (navy) hero backgrounds where nav should start transparent
const DARK_HERO_PAGES = ["/", "/buy", "/sell", "/team", "/about", "/contact", "/careers", "/blog", "/exclusive", "/valuation", "/find", "/privacy", "/investment", "/terms", "/fair-housing", "/condos", "/luxury", "/new-construction", "/join"];

export function PublicNav() {
  const pathname = usePathname();
  const hasDarkHero = DARK_HERO_PAGES.includes(pathname) || pathname.startsWith("/neighborhoods/");
  const [scrolled, setScrolled] = useState(!hasDarkHero);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!hasDarkHero) { setScrolled(true); return; }
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll(); // check initial position
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasDarkHero]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="relative h-10 w-[180px] md:w-[200px]">
              <Image
                src="/images/logos/sg-horizontal-white.png"
                alt="Shapiro Group"
                fill
                className={`object-contain object-left transition-opacity duration-500 ${
                  scrolled ? "opacity-0" : "opacity-100"
                }`}
                priority
              />
              <Image
                src="/images/logos/sg-horizontal-black.png"
                alt="Shapiro Group"
                fill
                className={`object-contain object-left transition-opacity duration-500 ${
                  scrolled ? "opacity-100" : "opacity-0"
                }`}
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {[
                { href: "/buy", label: "Buy" },
                { href: "/sell", label: "Sell" },
                { href: "/investment", label: "Invest" },
                { href: "/neighborhoods", label: "Neighborhoods" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[13px] font-medium tracking-[0.12em] uppercase transition-colors duration-300 ${
                    scrolled
                      ? "text-navy/70 hover:text-navy"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <Link
                href="/search"
                className={`hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-[12px] font-semibold tracking-[0.12em] uppercase transition-all duration-300 ${
                  scrolled
                    ? "bg-gold text-white hover:bg-gold-dark"
                    : "bg-white/10 text-white border border-white/30 hover:bg-white/20"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                SuperSearch
              </Link>

              <Link
                href="/portal"
                className={`hidden lg:inline-flex text-[12px] font-medium tracking-[0.1em] uppercase transition-colors duration-300 ${
                  scrolled
                    ? "text-navy/60 hover:text-navy"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Sign In
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex flex-col gap-1.5 p-2"
                aria-label="Toggle menu"
              >
                <span
                  className={`block w-6 h-[1.5px] transition-all duration-300 ${
                    mobileOpen
                      ? `${scrolled ? "bg-navy" : "bg-white"} rotate-45 translate-y-[4.5px]`
                      : scrolled
                      ? "bg-navy"
                      : "bg-white"
                  }`}
                />
                <span
                  className={`block w-6 h-[1.5px] transition-all duration-300 ${
                    mobileOpen
                      ? "opacity-0"
                      : scrolled
                      ? "bg-navy"
                      : "bg-white"
                  }`}
                />
                <span
                  className={`block w-6 h-[1.5px] transition-all duration-300 ${
                    mobileOpen
                      ? `${scrolled ? "bg-navy" : "bg-white"} -rotate-45 -translate-y-[4.5px]`
                      : scrolled
                      ? "bg-navy"
                      : "bg-white"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-navy flex flex-col items-center justify-center gap-8 animate-fade-in-up">
          {[
            { href: "/buy", label: "Buy" },
            { href: "/sell", label: "Sell" },
            { href: "/investment", label: "Invest" },
            { href: "/valuation", label: "Home Value" },
            { href: "/search", label: "Search" },
            { href: "/neighborhoods", label: "Neighborhoods" },
            { href: "/careers", label: "Careers" },
            { href: "/contact", label: "Contact" },
            { href: "/portal", label: "Sign In" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-white text-2xl font-light tracking-[0.15em] uppercase hover:text-gold transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
