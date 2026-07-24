'use client';
import Link from 'next/link';
import { useProjects } from '@/hooks/use-projects';

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      <ul className="space-y-2">
        {projects?.map((p) => (
          <li key={p.id} className="border rounded p-3">
            <Link href={`/projects/${p.id}`}>{p.name} — {p.status}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
