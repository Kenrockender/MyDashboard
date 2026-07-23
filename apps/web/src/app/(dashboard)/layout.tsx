import { Nav } from "@/components/shared/nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Nav />
      <main className="p-6">{children}</main>
    </div>
  );
}
