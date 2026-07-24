export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      role="img"
      aria-label="Ledger logo"
    >
      <span className="text-[1.25rem] leading-none">💸</span>
    </span>
  );
}

export function DashboardIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="10" width="7.5" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ProjectsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M3.5 7.5c0-1.1.9-2 2-2h4l1.8 2.2H18.5c1.1 0 2 .9 2 2v8.3c0 1.1-.9 2-2 2h-13c-1.1 0-2-.9-2-2V7.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClientsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.75 19c.6-3 2.7-5 5.25-5s4.65 2 5.25 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16.5" cy="7.5" r="2.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15 12.5c2.05.2 3.75 1.9 4.25 4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ReportsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M4.5 20V10.5M11.5 20V4M18.5 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SunIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MoonIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M20 14.2A8.5 8.5 0 1 1 9.8 4a6.7 6.7 0 0 0 10.2 10.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SignOutIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M9 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M14.5 8l4 4-4 4M18 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
