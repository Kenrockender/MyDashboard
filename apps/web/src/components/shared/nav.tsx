import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/clients", label: "Clients" },
  { href: "/reports", label: "Reports" },
];

export function Nav() {
  return (
    <nav className="flex gap-6 border-b px-6 py-4">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm font-medium">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
