
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { BusinessCard } from '../../lib/api';

const emptyForm = {
  slug: '',
  fullName: '',
  jobTitle: '',
  company: '',
  bio: '',
  email: '',
  phone: '',
  website: '',
};
type Analytics = {
  totalProfileViews: number;
  totalLeads: number;
  cards: {
    slug: string;
    fullName: string;
    profileViews: number;
    leads: number;
  }[];
};
export default function Dashboard() {
  const router = useRouter();
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics>({
   totalProfileViews: 0,
   totalLeads: 0,
   cards: [],
});

  async function loadCards() {
    const response = await fetch('/api/cards', {
      cache: 'no-store',
    });

    if (response.status === 401) {
      router.replace('/');
      return;
    }

    if (!response.ok) {
      setMessage('Unable to load cards.');
      return;
    }

    setCards(await response.json());

const analyticsResponse = await fetch(
  '/api/cards/analytics',
  { cache: 'no-store' },
);

if (analyticsResponse.status === 401) {
  router.replace('/');
  return;
}

if (analyticsResponse.ok) {
  setAnalytics(await analyticsResponse.json());
}
  }

  useEffect(() => {
    loadCards()
      .catch(() => setMessage('Unable to connect to the API.'))
      .finally(() => setLoading(false));
    // Initial load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    try {
      const response = await fetch(
        editingId ? `/api/cards/${editingId}` : '/api/cards',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          Array.isArray(result.message)
            ? result.message.join(', ')
            : result.message ?? 'Unable to save card',
        );
        return;
      }

      setForm(emptyForm);
      setEditingId(null);
      setMessage('Card saved successfully.');
      await loadCards();
    } catch {
      setMessage('Unable to connect to the API.');
    }
  }

  function edit(card: BusinessCard) {
    setEditingId(card.id);
    setForm({
      slug: card.slug,
      fullName: card.fullName,
      jobTitle: card.jobTitle ?? '',
      company: card.company ?? '',
      bio: card.bio ?? '',
      email: card.email ?? '',
      phone: card.phone ?? '',
      website: card.website ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deactivate(id: string) {
    if (!window.confirm('Deactivate this card?')) return;

    const response = await fetch(`/api/cards/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      setMessage('Unable to deactivate card.');
      return;
    }

    await loadCards();
  }

  async function logout() {
    await fetch('/api/session', { method: 'DELETE' });
    router.replace('/');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your dashboard</h1>
          <button onClick={logout} className="text-cyan-400">
            Sign out
          </button>
        </header>
      <section className="mb-8 grid gap-4 sm:grid-cols-2">
  <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
    <p className="text-sm text-slate-400">
      Total profile views
    </p>
    <p className="mt-2 text-3xl font-bold">
      {analytics.totalProfileViews}
    </p>
  </div>

  <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
    <p className="text-sm text-slate-400">
      Total leads
    </p>
    <p className="mt-2 text-3xl font-bold">
      {analytics.totalLeads}
    </p>
  </div>
</section>

<section className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
  <h2 className="mb-4 text-xl font-semibold">
    Card performance
  </h2>

  {analytics.cards.length === 0 ? (
    <p className="text-slate-400">
      Create a business card to start tracking performance.
    </p>
  ) : (
    <div className="space-y-3">
      {analytics.cards.map((card) => (
        <div
          key={card.slug}
          className="flex flex-col justify-between gap-2 border-b border-slate-800 pb-3 sm:flex-row"
        >
          <div>
            <p className="font-medium">{card.fullName}</p>
            <Link
              href={`/c/${card.slug}`}
              target="_blank"
              className="text-sm text-cyan-400 hover:underline"
            >
              View public card
            </Link>
          </div>

          <div className="flex gap-6 text-sm">
            <p>
              <span className="text-slate-400">Views:</span>{' '}
              {card.profileViews}
            </p>
            <p>
              <span className="text-slate-400">Leads:</span>{' '}
              {card.leads}
            </p>
          </div>
        </div>
      ))}
    </div>
  )}
</section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl bg-slate-900 p-6">
            <h2 className="mb-6 text-xl font-bold">
              {editingId ? 'Edit business card' : 'Create business card'}
            </h2>

            <form onSubmit={save} className="space-y-4">
              {(Object.keys(emptyForm) as (keyof typeof emptyForm)[]).map(
                (field) => (
                  <label key={field} className="block text-sm capitalize">
                    {field.replace(/([A-Z])/g, ' $1')}
                    {field === 'bio' ? (
                      <textarea
                        value={form[field]}
                        maxLength={2000}
                        onChange={(e) =>
                          setForm({ ...form, [field]: e.target.value })
                        }
                        className="mt-2 w-full rounded-lg bg-slate-800 p-3"
                      />
                    ) : (
                      <input
                        required={field === 'slug' || field === 'fullName'}
                        type={
                          field === 'email'
                            ? 'email'
                            : field === 'website'
                              ? 'url'
                              : 'text'
                        }
                        value={form[field]}
                        onChange={(e) =>
                          setForm({ ...form, [field]: e.target.value })
                        }
                        className="mt-2 w-full rounded-lg bg-slate-800 p-3"
                      />
                    )}
                  </label>
                ),
              )}

              <button className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950">
                {editingId ? 'Save changes' : 'Create card'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="w-full text-slate-300"
                >
                  Cancel editing
                </button>
              )}
            </form>
          </section>

          <section>
            <h2 className="mb-6 text-xl font-bold">Your business cards</h2>

            {message && (
              <p role="status" className="mb-4 text-cyan-300">
                {message}
              </p>
            )}

            {loading && <p>Loading...</p>}

            <div className="space-y-4">
              {cards.map((card) => (
                <article
                  key={card.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {card.fullName}
                      </h3>
                      <p className="text-slate-400">
                        {card.jobTitle} {card.company && `· ${card.company}`}
                      </p>
                    </div>
                    <span className="text-xs text-cyan-400">
                      {card.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-4 text-sm">
                    {card.isActive && (
                      <Link
                        href={`/c/${card.slug}`}
                        className="text-cyan-400"
                      >
                        View public card
                      </Link>
                    )}
                    <button onClick={() => edit(card)}>Edit</button>
                    {card.isActive && (
                      <button
                        onClick={() => deactivate(card.id)}
                        className="text-red-400"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
