import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ledger — Project Finance Dashboard',
    short_name: 'Ledger',
    description: 'Track income, expenses, and profitability across your projects.',
    start_url: '/',
    display: 'standalone',
    background_color: '#17150f',
    theme_color: '#17150f',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
