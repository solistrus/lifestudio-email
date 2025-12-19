import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CopyButton from './CopyButton';

type Status = 'draft' | 'approved' | 'sent';
type StatusFilter = 'all' | Status;

type EmailMeta = {
  title: string;
  project: string;
  status: Status;
  can_show_client: boolean;
  created_at: string; // YYYY-MM-DD
};

type EmailItem = {
  slug: string;
  htmlPath: string; // /emails/x.html
  meta?: EmailMeta;
};

function safeReadJson(filePath: string): unknown | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isStatus(v: any): v is Status {
  return v === 'draft' || v === 'approved' || v === 'sent';
}

function normalizeMeta(slug: string, raw: any): EmailMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : slug;
  const project = typeof raw.project === 'string' && raw.project.trim() ? raw.project.trim() : '—';
  const status: Status = isStatus(raw.status) ? raw.status : 'draft';
  const can_show_client = typeof raw.can_show_client === 'boolean' ? raw.can_show_client : false;
  const created_at =
    typeof raw.created_at === 'string' && raw.created_at.trim() ? raw.created_at.trim() : '—';

  return { title, project, status, can_show_client, created_at };
}

function getEmails(): EmailItem[] {
  const dir = path.join(process.cwd(), 'public', 'emails');
  if (!fs.existsSync(dir)) return [];

  const htmlFiles = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.html'));

  const items = htmlFiles.map((f) => {
    const slug = f.replace(/\.html$/i, '');
    const htmlPath = `/emails/${slug}.html`;
    const metaPath = path.join(dir, `${slug}.meta.json`);
    const raw = safeReadJson(metaPath);
    const meta = normalizeMeta(slug, raw);

    return { slug, htmlPath, meta };
  });

  // Сортировка:
  // 1) project (A→Z)
  // 2) status (draft→approved→sent)
  // 3) slug
  const statusWeight: Record<Status, number> = { draft: 0, approved: 1, sent: 2 };

  return items.sort((a, b) => {
    const ap = a.meta?.project ?? '—';
    const bp = b.meta?.project ?? '—';
    if (ap !== bp) return ap.localeCompare(bp);

    const as = a.meta?.status ?? 'draft';
    const bs = b.meta?.status ?? 'draft';
    if (as !== bs) return statusWeight[as] - statusWeight[bs];

    return a.slug.localeCompare(b.slug);
  });
}

function StatusBadge({ status }: { status: Status }) {
  const cfg =
    status === 'draft'
      ? { bg: '#f1f5f9', bd: '#e2e8f0', fg: '#0f172a', label: 'draft' }
      : status === 'approved'
      ? { bg: 'rgba(34,197,94,.10)', bd: 'rgba(34,197,94,.35)', fg: '#14532d', label: 'approved' }
      : { bg: 'rgba(59,130,246,.10)', bd: 'rgba(59,130,246,.35)', fg: '#1e3a8a', label: 'sent' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: cfg.bg,
        border: `1px solid ${cfg.bd}`,
        color: cfg.fg,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
      }}
    >
      {cfg.label}
    </span>
  );
}

function BoolPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        border: `1px solid ${ok ? 'rgba(34,197,94,.35)' : '#e5e7eb'}`,
        background: ok ? 'rgba(34,197,94,.08)' : '#fff',
        color: ok ? '#14532d' : '#475569',
        fontSize: 12,
        fontWeight: 700,
      }}
      title={ok ? 'Можно показывать клиенту' : 'Не для клиента'}
    >
      {label}: {ok ? 'yes' : 'no'}
    </span>
  );
}

function Card({ item }: { item: EmailItem }) {
  const { slug, htmlPath, meta } = item;

  // Публичный URL для клиента
  const publicPath = `/p/${slug}`;

  // Абсолютные ссылки для Copy (если задан BASE_URL)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const baseForCopy = baseUrl ? `${baseUrl}${publicPath}` : publicPath;

  const title = meta?.title ?? slug;
  const project = meta?.project ?? '—';
  const status: Status = meta?.status ?? 'draft';
  const canShow = meta?.can_show_client ?? false;
  const createdAt = meta?.created_at ?? '—';

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: 14,
        display: 'grid',
        gap: 10,
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{title}</div>

        <StatusBadge status={status} />

        <span style={{ color: '#64748b', fontSize: 12 }}>
          project: <b style={{ color: '#0f172a' }}>{project}</b>
        </span>

        <span style={{ color: '#64748b', fontSize: 12 }}>
          created: <b style={{ color: '#0f172a' }}>{createdAt}</b>
        </span>

        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>{htmlPath}</div>
      </div>

      {/* flags + actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <BoolPill ok={canShow} label="client" />

        <span style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 2px' }} />

        {/* ✅ ПУБЛИЧНЫЕ кнопки показываем ТОЛЬКО если can_show_client = true */}
        {canShow ? (
          <>
            <Link
              href={publicPath}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 999,
                padding: '6px 10px',
                textDecoration: 'none',
                color: '#0f172a',
                fontWeight: 700,
                background: '#fff',
              }}
              title="Публичная ссылка для клиента"
            >
              Open (Public)
            </Link>

            <Link
              href={`${publicPath}?view=desktop`}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 999,
                padding: '6px 10px',
                textDecoration: 'none',
                color: '#0f172a',
                fontWeight: 700,
                background: '#fff',
              }}
            >
              Desktop
            </Link>

            <Link
              href={`${publicPath}?view=mobile`}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 999,
                padding: '6px 10px',
                textDecoration: 'none',
                color: '#0f172a',
                fontWeight: 700,
                background: '#fff',
              }}
            >
              Mobile
            </Link>

            <CopyButton label="Copy" url={baseForCopy} />
            <CopyButton label="Copy (Desktop)" url={`${baseForCopy}?view=desktop`} />
            <CopyButton label="Copy (Mobile)" url={`${baseForCopy}?view=mobile`} />
          </>
        ) : (
          <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700 }}>
            Публичные ссылки скрыты (client: no)
          </span>
        )}

        {!meta && (
          <span style={{ color: '#b45309', fontSize: 12, fontWeight: 700 }}>
            ⚠️ meta отсутствует
          </span>
        )}
      </div>
    </div>
  );
}

export default async function PreviewIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; status?: StatusFilter; client?: string }>;
}) {

  const PREVIEW_KEY = process.env.PREVIEW_KEY;
  const { key, status: statusParam, client: clientParam } = await searchParams;

  // Фильтры (дефолты)
  // client=1 по умолчанию (только клиентские)
  // status=all по умолчанию, но "sent" по умолчанию скрываем как архив
  const statusFilter: StatusFilter = statusParam ?? 'all';
  const clientOnly = clientParam !== '0';

  // защита каталога
  if (PREVIEW_KEY && key !== PREVIEW_KEY) {
    redirect('/');
  }

  const itemsAll = getEmails();

  const items = itemsAll.filter((item) => {
    const meta = item.meta;

    // 1) clientOnly: показываем только can_show_client=true
    if (clientOnly && !meta?.can_show_client) return false;

    // 2) статус
    const st: Status = meta?.status ?? 'draft';

    // если выбрали конкретный статус — фильтруем строго
    if (statusFilter !== 'all') return st === statusFilter;

    // если all — по умолчанию скрываем sent (архив)
    return st !== 'sent';
  });

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '10px 12px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          zIndex: 10,
        }}
      >
        <strong>LifeStudio Email · Previews</strong>
        <span style={{ color: '#64748b', fontSize: 12 }}>писем: {items.length}</span>
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {(['all', 'draft', 'approved', 'sent'] as StatusFilter[]).map((s) => {
            const active = statusFilter === s;

            const sp = new URLSearchParams();
            if (key) sp.set('key', key);
            sp.set('client', clientOnly ? '1' : '0');
            sp.set('status', s);

            return (
              <Link
                key={s}
                href={`/preview?${sp.toString()}`}
                style={{
                  border: `1px solid ${active ? '#dc146e' : '#e5e7eb'}`,
                  background: '#fff',
                  padding: '6px 10px',
                  borderRadius: 999,
                  textDecoration: 'none',
                  color: '#0f172a',
                  fontWeight: 700,
                  boxShadow: active ? '0 0 0 3px rgba(220,20,110,.18)' : 'none',
                }}
              >
                {s.toUpperCase()}
              </Link>
            );
          })}

          {(() => {
            const sp = new URLSearchParams();
            if (key) sp.set('key', key);
            sp.set('status', statusFilter);
            sp.set('client', clientOnly ? '0' : '1');

            return (
              <Link
                href={`/preview?${sp.toString()}`}
                style={{
                  border: `1px solid ${clientOnly ? 'rgba(34,197,94,.45)' : '#e5e7eb'}`,
                  background: clientOnly ? 'rgba(34,197,94,.08)' : '#fff',
                  padding: '6px 10px',
                  borderRadius: 999,
                  textDecoration: 'none',
                  color: clientOnly ? '#14532d' : '#0f172a',
                  fontWeight: 800,
                }}
                title="Показывать только письма, разрешённые для клиента"
              >
                CLIENT ONLY: {clientOnly ? 'ON' : 'OFF'}
              </Link>
            );
          })()}
        </div>
        
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
          key: <code>{key ? 'yes' : 'no'}</code>
        </span>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        {items.length === 0 ? (
          <div style={{ color: '#64748b' }}>
            В <code>public/emails</code> пока нет .html файлов.
          </div>
        ) : (
          items.map((item) => <Card key={item.slug} item={item} />)
        )}
      </div>
    </div>
  );
}
