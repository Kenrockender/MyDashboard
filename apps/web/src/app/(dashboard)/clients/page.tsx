'use client';
import { useState } from 'react';
import { useClients } from '@/hooks/use-clients';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const { data: clients, isLoading } = useClients(search);

  return (
    <div>
      <input
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded px-3 py-2 mb-4"
      />
      {isLoading && <p>Loading...</p>}
      <ul className="space-y-2">
        {clients?.map((c) => (
          <li key={c.id} className="border rounded p-3">{c.name}</li>
        ))}
      </ul>
    </div>
  );
}
