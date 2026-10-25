'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  Menu,
  X,
  ArrowRight,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';

interface SessionUser {
  id: string;
  phone: string;
  name: string | null;
  role: string;
}

export function LandingHeader() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.refresh();
    } catch {
      // Ignore error
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.length >= 10) {
      const last4 = phone.slice(-4);
      return `+91 •••• ${last4}`;
    }
    return phone;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs transition-transform group-hover:scale-105">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-zinc-900 group-hover:text-indigo-600 transition-colors">
              CareerChecks
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">
              Student Guidance
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600">
          <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
            How it Works
          </a>
          <a href="#paths" className="hover:text-indigo-600 transition-colors">
            UG & PG Paths
          </a>
          <a href="#sample-report" className="hover:text-indigo-600 transition-colors">
            Sample Report
          </a>
          <a href="#pricing" className="hover:text-indigo-600 transition-colors">
            Pricing
          </a>
          <a href="#parents" className="hover:text-indigo-600 transition-colors">
            For Parents
          </a>
          <a href="#faq" className="hover:text-indigo-600 transition-colors">
            FAQ
          </a>
        </nav>

        {/* Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded-full" />
          ) : user ? (
            /* Logged in state */
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700">
                <User className="h-3.5 w-3.5 text-indigo-600" />
                <span>{user.name || formatPhone(user.phone)}</span>
              </div>
              <Link
                href="/onboarding/profile"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 transition-colors"
              >
                Resume Test
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 px-3 py-1.5 rounded-full hover:bg-zinc-100 transition-colors"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            /* Logged out state */
            <div className="flex items-center gap-2.5">
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-700 hover:text-indigo-600 px-4 py-2 rounded-full transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Log in</span>
              </Link>
              <Link
                href="/auth?redirect=/onboarding/profile"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <span>Take Free Test</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 bg-white px-4 pt-3 pb-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-3 text-base font-medium text-zinc-700">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-50"
            >
              How it Works
            </a>
            <a
              href="#paths"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-50"
            >
              UG & PG Paths
            </a>
            <a
              href="#sample-report"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-50"
            >
              Sample Report
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-50"
            >
              Pricing
            </a>
            <a
              href="#parents"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-50"
            >
              For Parents
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-zinc-50"
            >
              FAQ
            </a>

            <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-zinc-100">
              {user ? (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-zinc-500 flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-600" />
                    <span>Signed in as {formatPhone(user.phone)}</span>
                  </div>
                  <Link
                    href="/onboarding/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-full bg-indigo-600 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
                  >
                    Resume Test
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-center py-2 rounded-full border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-full border border-zinc-300 text-sm font-semibold text-zinc-800"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth?redirect=/onboarding/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-full bg-indigo-600 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
                  >
                    Take Free Test
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
