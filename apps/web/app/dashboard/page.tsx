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

type FormField = keyof typeof emptyForm;
type FormErrors = Partial<Record<FormField, string>>;

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

function validateField(field: FormField, value: string): string | undefined {
  const trimmed = value.trim();

  const requiredFields: FormField[] = [
    'slug',
    'fullName',
    'email',
    'website',
  ];

  if (requiredFields.includes(field) && !trimmed) {
    const labels: Record<FormField, string> = {
      slug: 'Public URL slug',
      fullName: 'Full name',
      jobTitle: 'Job title',
      company: 'Company',
      bio: 'Bio',
      email: 'Email address',
      phone: 'Phone number',
      website: 'Website',
    };

    return `${labels[field]} is required.`;
  }

  if (field === 'slug') {
    if (!trimmed) return 'Slug is required.';
    if (trimmed.length > 80) return 'Slug must be 80 characters or fewer.';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
      return 'Use lowercase letters, numbers, and hyphens only. Do not use spaces or underscores.';
    }
  }

  if (field === 'fullName') {
    if (!trimmed) return 'Full name is required.';
    if (trimmed.length > 120) return 'Full name must be 120 characters or fewer.';
  }

  if (field === 'email' && trimmed) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Enter a valid email address.';
    }
  }

  if (field === 'website' && trimmed) {
    try {
      const url = new URL(trimmed);

      if (url.protocol !== 'https:' || !url.hostname.includes('.')) {
        return 'Enter a valid HTTPS website address, starting with https://.';
      }
    } catch {
      return 'Enter a valid website address.';
    }
  }

  return undefined;
}

export default function Dashboard() {
  const router = useRouter();

  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
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

  function updateField(field: FormField, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => {
      if (!(field in previous)) return previous;

      return {
        ...previous,
        [field]: validateField(field, value),
      };
    });
  }

  function validateAllFields(): boolean {
    const newErrors: FormErrors = {};

    (Object.keys(emptyForm) as FormField[]).forEach((field) => {
      const error = validateField(field, form[field]);

      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!validateAllFields()) {
      const firstInvalidField = (
        Object.keys(emptyForm) as FormField[]
      ).find((field) => validateField(field, form[field]));

      document.getElementById(firstInvalidField ?? '')?.focus();
      return;
    }

    setSaving(true);

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
        if (Array.isArray(result.message)) {
          const fieldErrors: FormErrors = {};

          const fields = Object.keys(emptyForm) as FormField[];

          for (const error of result.message) {
            const field = fields.find((name) =>
              String(error)
                .toLowerCase()
                .startsWith(`${name.toLowerCase()} `),
            );

            if (field) {
              fieldErrors[field] = String(error);
            }
          }

          setErrors(fieldErrors);

          if (Object.keys(fieldErrors).length === 0) {
            setMessage(result.message.join(', '));
          } else {
            const firstInvalidField = fields.find(
              (field) => fieldErrors[field],
            );

            document.getElementById(firstInvalidField ?? '')?.focus();
          }
        } else {
          setMessage(result.message ?? 'Unable to save card.');
        }

        return;
      }

      if (!editingId) {
        const createdSlug =
          result.slug ?? result.card?.slug ?? form.slug.trim();

        router.push(`/c/${encodeURIComponent(createdSlug)}`);
        return;
      }

      setForm(emptyForm);
      setEditingId(null);
      setErrors({});
      setMessage('Card updated successfully.');

      await loadCards();
    } catch {
      setMessage('Unable to connect to the API.');
    } finally {
      setSaving(false);
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

    setErrors({});
    setMessage('');

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

  const fieldLabels: Record<FormField, string> = {
    slug: 'Public URL slug',
    fullName: 'Full name',
    jobTitle: 'Job title',
    company: 'Company',
    bio: 'Bio',
    email: 'Email address',
    phone: 'Phone number',
    website: 'Website',
  };

  const requiredFields: FormField[] = [
    'slug',
    'fullName',
    'email',
    'website',
  ];

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
            <h2 className="mb-2 text-xl font-bold">
              {editingId ? 'Edit business card' : 'Create business card'}
            </h2>

            <p className="mb-6 text-sm text-slate-400">
              Fields marked <span className="text-red-400">*</span> are required.
              All other fields are optional.
            </p>

            <form
              onSubmit={save}
              noValidate
              className="space-y-5"
            >
              {(Object.keys(emptyForm) as FormField[]).map((field) => (
                <div key={field}>
                  <label
                    htmlFor={field}
                    className="block text-sm font-medium text-slate-200"
                  >
                    {fieldLabels[field]}{' '}
                    {requiredFields.includes(field) ? (
                      <span className="text-red-400">*</span>
                    ) : (
                      <span className="text-slate-500">(Optional)</span>
                    )}
                  </label>

                  {field === 'bio' ? (
                    <textarea
                      id={field}
                      value={form[field]}
                      maxLength={2000}
                      rows={5}
                      placeholder="Write a short professional introduction..."
                      onChange={(e) =>
                        updateField(field, e.target.value)
                      }
                      onBlur={() => {
                        const error = validateField(field, form[field]);
                        setErrors((previous) => ({
                          ...previous,
                          [field]: error,
                        }));
                      }}
                      aria-invalid={Boolean(errors[field])}
                      aria-describedby={
                        errors[field] ? `${field}-error` : undefined
                      }
                      className={`mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none transition focus:ring-2 ${
                        errors[field]
                          ? 'border border-red-500 focus:ring-red-500'
                          : 'border border-slate-700 focus:ring-cyan-400'
                      }`}
                    />
                  ) : (
                    <input
                      id={field}
                      name={field}
                      type={
                        field === 'email'
                          ? 'email'
                          : field === 'website'
                            ? 'url'
                            : 'text'
                      }
                      required={requiredFields.includes(field)}
                      value={form[field]}
                      placeholder={
                        field === 'slug'
                          ? 'e.g. sol-end'
                          : field === 'fullName'
                            ? 'Your full name'
                            : field === 'email'
                              ? 'you@example.com'
                              : field === 'website'
                                ? 'https://example.com'
                                : ''
                      }
                      onChange={(e) =>
                        updateField(field, e.target.value)
                      }
                      onBlur={() => {
                        const error = validateField(field, form[field]);
                        setErrors((previous) => ({
                          ...previous,
                          [field]: error,
                        }));
                      }}
                      aria-invalid={Boolean(errors[field])}
                      aria-describedby={
                        errors[field] ? `${field}-error` : undefined
                      }
                      className={`mt-2 w-full rounded-lg bg-slate-800 p-3 outline-none transition focus:ring-2 ${
                        errors[field]
                          ? 'border border-red-500 focus:ring-red-500'
                          : 'border border-slate-700 focus:ring-cyan-400'
                      }`}
                    />
                  )}

                  {errors[field] && (
                    <p
                      id={`${field}-error`}
                      role="alert"
                      className="mt-2 text-sm text-red-400"
                    >
                      {errors[field]}
                    </p>
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save changes'
                    : 'Create card'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                    setErrors({});
                    setMessage('');
                  }}
                  className="w-full text-slate-300"
                >
                  Cancel editing
                </button>
              )}

              {message && (
                <p role="status" className="text-sm text-cyan-300">
                  {message}
                </p>
              )}
            </form>
          </section>

          <section>
            <h2 className="mb-6 text-xl font-bold">
              Your business cards
            </h2>

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

                    <button onClick={() => edit(card)}>
                      Edit
                    </button>

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
