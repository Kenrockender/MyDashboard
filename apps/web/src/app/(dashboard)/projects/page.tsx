import ProjectsView from './projects-client';

/**
 * The projects view reads `?id=` via `useSearchParams()`. Next only demands a
 * Suspense boundary for that when the page is statically prerendered — and a
 * boundary here left the tree suspended indefinitely after hydration. Since
 * every page in this app is behind a client-side auth gate and renders no
 * meaningful static shell anyway, opting out of prerendering is both simpler
 * and more honest about what this page actually is.
 */
export const dynamic = 'force-dynamic';

export default function ProjectsPage() {
  return <ProjectsView />;
}
