'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

type Mode = 'all' | 'desktop' | 'mobile';

const DESKTOP_W = 700;
const MOBILE_W = 390;
const FRAME_H = 900;

function isMode(val: string | null): val is Mode {
  return val === 'all' || val === 'desktop' || val === 'mobile';
}

function Frame({ src, width }: { src: string; width: number }) {
  return (
    <div
      style={{
        width,
        maxWidth: '100%',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <iframe
        title="email-preview"
        style={{
          width: '100%',
          height: FRAME_H,
          border: 0,
          background: '#fff',
          display: 'block',
        }}
        src={src}
        // ✅ чтобы ссылки (https/mailto/tel) открывались в новой вкладке/приложении
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer-when-downgrade"
        loading="lazy"
      />
    </div>
  );
}

export default function PreviewByIdPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [mode, setMode] = useState<Mode>('all');

  const src = useMemo(() => (id ? `/emails/${id}.html` : ''), [id]);

  useEffect(() => {
    const view = searchParams.get('view');
    if (isMode(view)) setMode(view);
  }, [searchParams]);

  const setModeAndUrl = (nextMode: Mode) => {
    setMode(nextMode);

    const sp = new URLSearchParams(searchParams.toString());
    sp.set('view', nextMode);

    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  const Pill = ({ value, label }: { value: Mode; label: string }) => {
    const active = mode === value;

    return (
      <button
        type="button"
        onClick={() => setModeAndUrl(value)}
        style={{
          border: `1px solid ${active ? '#dc146e' : '#e5e7eb'}`,
          background: '#fff',
          padding: '6px 10px',
          borderRadius: 999,
          cursor: 'pointer',
          fontWeight: 600,
          boxShadow: active ? '0 0 0 3px rgba(220,20,110,.18)' : 'none',
        }}
      >
        {label}
      </button>
    );
  };

  if (!id) {
    return <div style={{ padding: 16 }}>Нет id в URL. Обнови страницу.</div>;
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '10px 12px',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <strong style={{ marginRight: 8 }}>Preview:</strong>
        <Pill value="all" label="All" />
        <Pill value="desktop" label="Desktop" />
        <Pill value="mobile" label="Mobile" />
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>
          {src}
        </span>
      </div>

      <div style={{ padding: 16 }}>
        {mode === 'all' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              alignItems: 'start',
            }}
          >
            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#64748b',
                  fontSize: 12,
                }}
              >
                Desktop ({DESKTOP_W}px)
              </div>
              <div
                style={{
                  padding: 12,
                  background: '#f9fafb',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Frame src={src} width={DESKTOP_W} />
              </div>
            </div>

            <div
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#64748b',
                  fontSize: 12,
                }}
              >
                Mobile ({MOBILE_W}px)
              </div>
              <div
                style={{
                  padding: 12,
                  background: '#f9fafb',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Frame src={src} width={MOBILE_W} />
              </div>
            </div>
          </div>
        )}

        {mode === 'desktop' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Frame src={src} width={DESKTOP_W} />
          </div>
        )}

        {mode === 'mobile' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Frame src={src} width={MOBILE_W} />
          </div>
        )}
      </div>
    </div>
  );
}
