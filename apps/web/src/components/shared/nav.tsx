"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  LogoMark,
  DashboardIcon,
  ProjectsIcon,
  ClientsIcon,
  ReportsIcon,
  SignOutIcon,
} from "@/components/shared/icons";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/projects", label: "Projects", Icon: ProjectsIcon },
  { href: "/clients", label: "Clients", Icon: ClientsIcon },
  { href: "/reports", label: "Reports", Icon: ReportsIcon },
];

export function Nav() {
  const { user, signOut } = useAuthContext();
  const pathname = usePathname();

  return (
    <>
      <header className="border-b border-border bg-paper-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-ink">
              <LogoMark className="h-6 w-6 text-accent" />
              <span className="hidden font-display text-lg italic sm:inline">Ledger</span>
            </Link>
            <div className="hidden gap-5 md:flex">
              {links.map((link) => {
                const active = pathname?.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      active ? "text-accent" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            {user?.photoURL && (
              // Google avatars come from a domain not configured for next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt=""
                className="h-7 w-7 rounded-full border border-border"
              />
            )}
            <span className="hidden text-ink-muted sm:inline">
              {user?.displayName ?? user?.email}
            </span>
            <button
              onClick={() => signOut()}
              aria-label="Sign out"
              className="text-ink-muted hover:text-ink"
            >
              <span className="hidden font-medium underline decoration-border underline-offset-4 sm:inline">
                Sign out
              </span>
              <SignOutIcon className="h-5 w-5 sm:hidden" />
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-paper-raised pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto flex max-w-6xl items-stretch justify-between">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);
            const { Icon } = link;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-w-[44px] flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  active ? "text-accent" : "text-ink-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
