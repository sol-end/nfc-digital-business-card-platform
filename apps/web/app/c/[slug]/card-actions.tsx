
'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import type { PublicCard } from '../../../lib/api';

function escapeVCard(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

export default function CardActions({
  card,
}: {
  card: PublicCard;
}) {
  const [url, setUrl] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    const currentUrl = new URL(window.location.href);

    const directUrl = new URL(currentUrl.origin + currentUrl.pathname);
    const qrTrackingUrl = new URL(directUrl);

    qrTrackingUrl.searchParams.set('source', 'qr');

    setUrl(directUrl.toString());
    setQrUrl(qrTrackingUrl.toString());
  }, []);

  function saveContact() {
    const fields = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCard(card.fullName)}`,
      ...(card.company
        ? [`ORG:${escapeVCard(card.company)}`]
        : []),
      ...(card.jobTitle
        ? [`TITLE:${escapeVCard(card.jobTitle)}`]
        : []),
      ...(card.email
        ? [`EMAIL:${escapeVCard(card.email)}`]
        : []),
      ...(card.phone
        ? [`TEL:${escapeVCard(card.phone)}`]
        : []),
      ...(card.website
        ? [`URL:${escapeVCard(card.website)}`]
        : []),
      'END:VCARD',
    ];

    const blob = new Blob([fields.join('\r\n') + '\r\n'], {
      type: 'text/vcard;charset=utf-8',
    });

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${card.slug}.vcf`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  }

  return (
    <section className="mt-8">
      <button
        onClick={saveContact}
        className="w-full rounded-xl bg-cyan-400 p-4 font-bold text-slate-950"
      >
        Save contact
      </button>

      {url && (
        <div className="mt-8 text-center">
          <div className="inline-block rounded-2xl bg-white p-4">
            <QRCodeSVG value={qrUrl} size={180} />
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Scan to share this card
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(url)}
            className="mt-3 text-sm text-cyan-400"
          >
            Copy card link
          </button>
        </div>
      )}
    </section>
  );
}
