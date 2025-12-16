'use client';

import { useState } from 'react';

export default function CopyButton({
  url,
  label,
}: {
  url: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      // Современный способ
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // На всякий случай — fallback
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch {
        alert('Не удалось скопировать ссылку');
      }
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      style={{
        border: '1px solid',
        borderColor: copied ? '#22c55e' : '#e5e7eb',
        borderRadius: 999,
        padding: '6px 10px',
        fontWeight: 600,
        background: '#fff',
        cursor: 'pointer',
        color: copied ? '#16a34a' : '#0f172a',
      }}
    >
      {copied ? 'Copied ✓' : label}
    </button>
  );
}
