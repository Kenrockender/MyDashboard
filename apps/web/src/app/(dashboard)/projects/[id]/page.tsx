'use client';

import { useParams, useRouter } from 'next/navigation';
import { ProjectDetailPanel } from '@/components/projects/project-detail-panel';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return <ProjectDetailPanel projectId={id} onBack={() => router.push('/projects')} />;
}
