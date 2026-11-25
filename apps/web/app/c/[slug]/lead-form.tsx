
'use client';

import { FormEvent, useState } from 'react';

type LeadSource = 'NFC' | 'QR' | 'DIRECT';

type Props = {
  slug: string;
  source: LeadSource;
};

const initialForm = {
  name: '',
  email: '',
  phone: '',
  message: '',
  websiteConfirm: '',
};

export default function LeadForm({ slug, source }: Props) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage('');
    setSuccess(false);

    // Require at least one contact method.
    if (!form.email.trim() && !form.phone.trim()) {
      setMessage('Please provide an email address or phone number.');
      return;
    }

    // Prevent whitespace-only names.
    if (!form.name.trim()) {
      setMessage('Please enter your name.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/leads/public/${encodeURIComponent(slug)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.name.trim(),
            source,
            ...(form.email.trim()
              ? { email: form.email.trim() }
              : {}),
            ...(form.phone.trim()
              ? { phone: form.phone.trim() }
              : {}),
            ...(form.message.trim()
              ? { message: form.message.trim() }
              : {}),
            websiteConfirm: form.websiteConfirm,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          Array.isArray(result.message)
            ? result.message.join(', ')
            : result.message ?? 'Unable to send your message.',
        );
        return;
      }

      setForm(initialForm);
      setSuccess(true);
      setMessage('Your details have been sent successfully.');
    } catch {
      setMessage('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-10 border-t border-slate-700 pt-8">
      <h2 className="text-2xl font-bold">Get in touch</h2>

      <p className="mt-2 text-sm text-slate-400">
        Leave your contact details and a message.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {/* Honeypot field: hidden from real visitors, useful for detecting basic bots. */}
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px overflow-hidden"
        >
          <label htmlFor="websiteConfirm">
            Leave this field empty
          </label>

          <input
            id="websiteConfirm"
            name="websiteConfirm"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.websiteConfirm}
            onChange={(e) =>
              setForm({
                ...form,
                websiteConfirm: e.target.value,
              })
            }
          />
        </div>

        <label className="block text-sm">
          Your name

          <input
            required
            maxLength={120}
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className="mt-2 w-full rounded-lg bg-slate-800 p-3 text-white"
          />
        </label>

        <label className="block text-sm">
          Email address

          <input
            type="email"
            maxLength={254}
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="mt-2 w-full rounded-lg bg-slate-800 p-3 text-white"
          />
        </label>

        <label className="block text-sm">
          Phone number

          <input
            type="tel"
            maxLength={40}
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
            className="mt-2 w-full rounded-lg bg-slate-800 p-3 text-white"
          />
        </label>

        <p className="text-xs text-slate-400">
          Please provide at least an email address or phone number.
        </p>

        <label className="block text-sm">
          Message

          <textarea
            maxLength={2000}
            rows={4}
            value={form.message}
            onChange={(e) =>
              setForm({
                ...form,
                message: e.target.value,
              })
            }
            className="mt-2 w-full rounded-lg bg-slate-800 p-3 text-white"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 disabled:opacity-50"
        >
          {submitting ? 'Sending...' : 'Send message'}
        </button>

        {message && (
          <p
            role="status"
            aria-live="polite"
            className={
              success
                ? 'text-sm text-green-400'
                : 'text-sm text-red-400'
            }
          >
            {message}
          </p>
        )}
      </form>
    </section>
  );
}