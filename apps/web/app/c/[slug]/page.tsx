import { notFound } from 'next/navigation';
import { API_URL, type PublicCard } from '../../../lib/api';
import CardActions from './card-actions';
import LeadForm from './lead-form';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string | string[] }>;
};

export const instant = false;

type LeadSource = 'NFC' | 'QR' | 'DIRECT';

function getLeadSource(value: string | string[] | undefined): LeadSource {
  if (value === 'nfc') return 'NFC';
  if (value === 'qr') return 'QR';
  return 'DIRECT';
}

export default async function PublicCardPage({
  params,
  searchParams,
}: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    notFound();
  }

  const source = getLeadSource(query.source);
  const response = await fetch(
  `${API_URL}/cards/public/${encodeURIComponent(slug)}?source=${source}`,
  { cache: 'no-store' },
  );

  if (response.status === 404) notFound();
  if (!response.ok) throw new Error('Unable to load card');

  const card: PublicCard = await response.json();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <article className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="h-32 bg-gradient-to-r from-cyan-500 to-blue-700" />

        <div className="px-8 pb-10">
          <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-slate-900 bg-slate-800 text-4xl font-bold">
            {card.fullName.charAt(0).toUpperCase()}
          </div>

          <h1 className="mt-5 text-3xl font-bold">{card.fullName}</h1>

          {card.jobTitle && (
            <p className="mt-2 text-cyan-400">{card.jobTitle}</p>
          )}

          {card.company && (
            <p className="mt-1 text-slate-300">{card.company}</p>
          )}

          {card.bio && (
            <p className="mt-6 whitespace-pre-wrap leading-relaxed text-slate-300">
              {card.bio}
            </p>
          )}

          <div className="mt-8 space-y-3">
            {card.email && (
              <a
                className="block rounded-xl bg-slate-800 p-4"
                href={`mailto:${card.email}`}
              >
                Email: {card.email}
              </a>
            )}

            {card.phone && (
              <a
                className="block rounded-xl bg-slate-800 p-4"
                href={`tel:${card.phone}`}
              >
                Phone: {card.phone}
              </a>
            )}

            {card.website && (
              <a
                className="block rounded-xl bg-slate-800 p-4"
                href={card.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit website
              </a>
            )}
          </div>

          <CardActions card={card} />
          <LeadForm slug={slug} source={source} />
        </div>
      </article>
    </main>
  );
}