'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';

type Mode = 'all' | 'desktop' | 'mobile';

const DESKTOP_W = 700;
const MOBILE_W = 390;
const FRAME_H = 900;

// На узких экранах "all" (две колонки) выглядит плохо — делаем как Stripo: один экран.
const NARROW_BREAKPOINT_PX = 900;

function isMode(v: string | null): v is Mode {
  return v === 'all' || v === 'desktop' || v === 'mobile';
}

function Frame({
  src,
  width,
  onTitle,
}: {
  src: string;
  width: number;
  onTitle?: (t: string) => void;
}) {
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
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer-when-downgrade"
        loading="lazy"
        onLoad={(e) => {
          try {
            const doc = (e.currentTarget as HTMLIFrameElement).contentDocument;
            const t = doc?.title?.trim();
            if (t) onTitle?.(t);
          } catch {
            // Если вдруг браузер/политика не даст — молчим
          }
        }}
      />
    </div>
  );
}

export default function PreviewByIdPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const params = useParams<{ id: string }>();
  const id = params?.id;

  // clientMode: если URL публичный (/p/...)
  const clientMode = useMemo(() => (pathname ? pathname.startsWith('/p/') : false), [pathname]);

  // ключ для доступа к /preview (если его нет — считаем, что это клиент и надо увести на /p/)
  const key = searchParams.get('key');

  const [mode, setMode] = useState<Mode>('all');
  const [isNarrow, setIsNarrow] = useState(false);

  // ✅ ТЕМА ПИСЬМА из <title> внутри HTML (iframe)
  const [subject, setSubject] = useState<string>('');

  const src = useMemo(() => (id ? `/emails/${id}.html` : ''), [id]);

  // ✅ РЕДИРЕКТ: если пользователь открыл /preview/[id] без ключа — уводим на /p/[id]
  useEffect(() => {
    if (!pathname || !id) return;

    const isPreviewRoute = pathname.startsWith('/preview/');
    if (isPreviewRoute && !key) {
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete('key'); // на всякий случай
      const qs = sp.toString();
      router.replace(`/p/${id}${qs ? `?${qs}` : ''}`);
    }
  }, [pathname, id, key, router, searchParams]);

  // 1) Отслеживаем узкий экран (телефон/планшет, поворот)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${NARROW_BREAKPOINT_PX}px)`);

    const apply = () => setIsNarrow(mq.matches);
    apply();

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }

    // Safari старые
    // eslint-disable-next-line deprecation/deprecation
    mq.addListener(apply);
    // eslint-disable-next-line deprecation/deprecation
    return () => mq.removeListener(apply);
  }, []);

  // 2) На входе читаем ?view=
  //    Если view нет — дефолт зависит от ширины и режима:
  //    - clientMode (/p/...) => desktop (или mobile на узком)
  //    - workMode (/preview/...) => all (или mobile на узком)
  useEffect(() => {
    const view = searchParams.get('view');

    if (isMode(view)) {
      setMode(view);
      return;
    }

    if (clientMode) {
      setMode(isNarrow ? 'mobile' : 'desktop');
      return;
    }

    setMode(isNarrow ? 'mobile' : 'all');
  }, [searchParams, isNarrow, clientMode]);

  // 3) Клик по переключателям: меняем режим + обновляем URL
  const setModeAndUrl = (nextMode: Mode) => {
    // На узком экране "all" бессмысленен — показываем mobile
    const effective: Mode = isNarrow && nextMode === 'all' ? 'mobile' : nextMode;

    setMode(effective);

    const sp = new URLSearchParams(searchParams.toString());
    sp.set('view', effective);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  const Pill = ({ value, label }: { value: Mode; label: string }) => {
    // Чтобы подсветка кнопок была логичной на телефоне
    const effectiveValue: Mode = isNarrow && value === 'all' ? 'mobile' : value;
    const active = mode === effectiveValue;

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
          opacity: isNarrow && value === 'all' ? 0.6 : 1,
        }}
        title={isNarrow && value === 'all' ? 'На телефоне показываем один вариант' : undefined}
      >
        {label}
      </button>
    );
  };

  if (!id) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: 16 }}>
        Нет id в URL. Открой: <code>/p/test</code>
      </div>
    );
  }

  // 4) На узком экране "all" рендерим как "mobile"
  const renderMode: Mode = isNarrow && mode === 'all' ? 'mobile' : mode;

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
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
          flexWrap: 'wrap',
        }}
      >
        <strong style={{ marginRight: 8 }}>{clientMode ? 'Email viewer' : 'Preview:'}</strong>

        {/* ✅ Тема письма из <title> */}
        <span style={{ fontWeight: 800, color: '#0f172a' }}>{subject || id}</span>

        <span style={{ width: 1, height: 18, background: '#e5e7eb', margin: '0 6px' }} />

        <Pill value="all" label="All" />
        <Pill value="desktop" label="Desktop" />
        <Pill value="mobile" label="Mobile" />

        {!clientMode && (
          <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>{src}</span>
        )}
      </div>

      <div style={{ padding: 16 }}>
        {renderMode === 'all' && (
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
                <Frame src={src} width={DESKTOP_W} onTitle={setSubject} />
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
                <Frame src={src} width={MOBILE_W} onTitle={setSubject} />
              </div>
            </div>
          </div>
        )}

        {renderMode === 'desktop' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Frame src={src} width={DESKTOP_W} onTitle={setSubject} />
          </div>
        )}

        {renderMode === 'mobile' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Frame src={src} width={MOBILE_W} onTitle={setSubject} />
          </div>
        )}
      </div>
    </div>
  );
}
