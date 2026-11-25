'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'CONVERTED'
  | 'LOST';

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: LeadStatus;
  source: string;
  createdAt: string;
  card: {
    slug: string;
    fullName: string;
    company: string | null;
  };
};

const statuses: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'CONVERTED',
  'LOST',
];

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadLeads = useCallback(async () => {
    const response = await fetch('/api/leads', { cache: 'no-store' });

    if (response.status === 401) {
      router.replace('/');
      return;
    }

    if (!response.ok) {
      throw new Error('Unable to load leads.');
    }

    setLeads(await response.json());
  }, [router]);

  useEffect(() => {
    loadLeads()
      .catch(() => setMessage('Unable to load leads. Please try again.'))
      .finally(() => setLoading(false));
  }, [loadLeads]);

  async function updateStatus(id: string, status: LeadStatus) {
    setMessage('');

    try {
      const response = await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message ?? 'Unable to update lead.');
        return;
      }

      setLeads((current) =>
        current.map((lead) =>
          lead.id === id ? { ...lead, status } : lead,
        ),
      );
      setMessage('Lead status updated.');
    } catch {
      setMessage('Unable to connect to the server.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Lead management</h1>
            <p className="mt-2 text-slate-400">
              Review and manage people who contacted you.
            </p>
          </div>
          <Link href="/dashboard" className="text-cyan-400">
            Back to dashboard
          </Link>
        </header>

        {message && (
          <p role="status" className="mb-5 text-sm text-cyan-300">
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-slate-400">Loading leads...</p>
        ) : leads.length === 0 ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-xl font-semibold">No leads yet</h2>
            <p className="mt-2 text-slate-400">
              When someone submits the contact form on one of your cards,
              their details will appear here.
            </p>
          </section>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <article
                key={lead.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{lead.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      For {lead.card.fullName}
                      {lead.card.company ? ` · ${lead.card.company}` : ''}
                    </p>
                  </div>

                  <select
                    aria-label={`Status for ${lead.name}`}
                    value={lead.status}
                    onChange={(event) =>
                      updateStatus(lead.id, event.target.value as LeadStatus)
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 space-y-1 text-sm text-slate-300">
                  {lead.email && <p>Email: {lead.email}</p>}
                  {lead.phone && <p>Phone: {lead.phone}</p>}
                  {lead.message && (
                    <p className="mt-3 whitespace-pre-wrap">{lead.message}</p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>Source: {lead.source}</span>
                  <span>
                    Received: {new Date(lead.createdAt).toLocaleString()}
                  </span>
                  <Link
                    href={`/c/${lead.card.slug}`}
                    className="text-cyan-400"
                  >
                    View card
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
