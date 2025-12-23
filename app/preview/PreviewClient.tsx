'use client';

import React from 'react';
import Link from 'next/link';
import CopyButton from './CopyButton';
import type { EmailItem, EmailMeta } from './page';

type Status = 'draft' | 'approved' | 'sent';
type StatusFilter = 'all' | Status;

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

/** Полная форма (Create/Edit meta) — оставляем как “тяжёлый режим” */
function MetaEditor({
  slug,
  meta,
  onClose,
}: {
  slug: string;
  meta?: EmailMeta;
  onClose: () => void;
}) {
  const [state, setState] = React.useState<EmailMeta>({
    title: meta?.title ?? slug,
    project: meta?.project && meta.project !== '—' ? meta.project : 'LS',
    status: meta?.status ?? 'draft',
    can_show_client: meta?.can_show_client ?? false,
    created_at:
      meta?.created_at && meta.created_at !== '—' ? meta.created_at : new Date().toISOString().slice(0, 10),
  });

  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/meta/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, meta: state }),
      });

      if (res.ok) {
        location.reload();
      } else {
        const j = await res.json().catch(() => null);
        alert(`Ошибка сохранения meta: ${j?.error || res.status}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 10, marginTop: 10 }}>
      <label style={{ display: 'block', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>title</div>
        <input
          value={state.title}
          onChange={(e) => setState({ ...state, title: e.target.value })}
          style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>project</div>
        <input
          value={state.project}
          onChange={(e) => setState({ ...state, project: e.target.value })}
          style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>created_at (YYYY-MM-DD)</div>
        <input
          value={state.created_at}
          onChange={(e) => setState({ ...state, created_at: e.target.value })}
          style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>status</div>
        <select
          value={state.status}
          onChange={(e) => setState({ ...state, status: e.target.value as Status })}
          style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
        >
          <option value="draft">draft</option>
          <option value="approved">approved</option>
          <option value="sent">sent</option>
        </select>
      </label>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <input
          type="checkbox"
          checked={state.can_show_client}
          onChange={(e) => setState({ ...state, can_show_client: e.target.checked })}
        />
        can_show_client
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '8px 12px',
            fontWeight: 800,
            background: '#fff',
          }}
        >
          {saving ? 'Saving…' : 'Save meta'}
        </button>

        <button
          onClick={onClose}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '8px 12px',
            fontWeight: 800,
            background: '#fff',
            color: '#64748b',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Quick publish — быстрый режим (status + client + Save), только локально */
function QuickPublish({
  slug,
  meta,
}: {
  slug: string;
  meta?: EmailMeta;
}) {
  const [status, setStatus] = React.useState<Status>(meta?.status ?? 'draft');
  const [client, setClient] = React.useState<boolean>(meta?.can_show_client ?? false);
  const [saving, setSaving] = React.useState(false);

  // если meta обновится после reload — ок, но в рамках текущего UI синхроним один раз при монтировании
  // (нам достаточно: после Save делаем location.reload())
  const created_at =
    meta?.created_at && meta.created_at !== '—' ? meta.created_at : new Date().toISOString().slice(0, 10);
  const title = meta?.title ?? slug;
  const project = meta?.project && meta.project !== '—' ? meta.project : 'LS';

  const save = async () => {
    setSaving(true);
    try {
      const payload: EmailMeta = {
        title,
        project,
        status,
        can_show_client: client,
        created_at,
      };

      const res = await fetch('/api/meta/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, meta: payload }),
      });

      if (res.ok) {
        location.reload();
      } else {
        const j = await res.json().catch(() => null);
        alert(`Ошибка сохранения meta: ${j?.error || res.status}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>quick:</span>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as Status)}
        style={{
          padding: '6px 10px',
          borderRadius: 999,
          border: '1px solid #e5e7eb',
          background: '#fff',
          fontSize: 12,
          fontWeight: 800,
        }}
        title="Статус письма"
      >
        <option value="draft">draft</option>
        <option value="approved">approved</option>
        <option value="sent">sent</option>
      </select>

      <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 12, fontWeight: 800 }}>
        <input
          type="checkbox"
          checked={client}
          onChange={(e) => setClient(e.target.checked)}
        />
        client
      </label>

      <button
        onClick={save}
        disabled={saving}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 999,
          padding: '6px 10px',
          fontSize: 12,
          fontWeight: 900,
          background: '#fff',
        }}
        title="Сохранить status/client (локально)"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>

      <span style={{ color: '#94a3b8', fontSize: 12 }}>
        (title/project/created берём из meta или дефолтов)
      </span>
    </div>
  );
}

function Card({
  item,
  baseUrl,
  localToolsEnabled,
}: {
  item: EmailItem;
  baseUrl: string;
  localToolsEnabled: boolean;
}) {
  const { slug, htmlPath, meta } = item;
  const [edit, setEdit] = React.useState(false);

  const publicPath = `/p/${slug}`;
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <BoolPill ok={canShow} label="client" />

        <span style={{ width: 1, height: 20, background: '#e5e7eb', margin: '0 2px' }} />

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

      {/* Локальные инструменты */}
      {localToolsEnabled && (
        <div style={{ display: 'grid', gap: 10 }}>
          <QuickPublish slug={slug} meta={meta} />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setEdit((v) => !v)}
              style={{
                border: '1px dashed #94a3b8',
                borderRadius: 999,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 800,
                background: '#fff',
              }}
              title="Локальный инструмент — создать/редактировать meta (полная форма)"
            >
              {meta ? 'Edit meta (form)' : 'Create meta (form)'}
            </button>

            {edit && <MetaEditor slug={slug} meta={meta} onClose={() => setEdit(false)} />}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PreviewClient(props: {
  items: EmailItem[];
  projects: string[];
  keyParam?: string;
  statusFilter: StatusFilter;
  clientOnly: boolean;
  projectFilter: string;
  localToolsEnabled: boolean;
  baseUrl: string;
}) {
  const { items, projects, keyParam, statusFilter, clientOnly, projectFilter, localToolsEnabled, baseUrl } =
    props;

  // ===== Search + Sort (client-side, поверх серверных фильтров) =====
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState<'created_desc' | 'created_asc' | 'title_asc' | 'slug_asc'>('created_desc');

  const norm = (s: any) => String(s ?? '').toLowerCase();

  const filtered = React.useMemo(() => {
    const query = norm(q).trim();
    let arr = items;

    if (query) {
      arr = arr.filter((it) => {
        const m = it.meta;
        return (
          norm(it.slug).includes(query) ||
          norm(m?.title).includes(query) ||
          norm(m?.project).includes(query)
        );
      });
    }

    const toDate = (d: string | undefined) => {
      const s = d && d !== '—' ? d : '';
      const t = Date.parse(s);
      return Number.isFinite(t) ? t : 0;
    };

    const sorted = [...arr].sort((a, b) => {
      if (sort === 'created_desc') return toDate(b.meta?.created_at) - toDate(a.meta?.created_at);
      if (sort === 'created_asc') return toDate(a.meta?.created_at) - toDate(b.meta?.created_at);
      if (sort === 'title_asc') return norm(a.meta?.title || a.slug).localeCompare(norm(b.meta?.title || b.slug));
      return norm(a.slug).localeCompare(norm(b.slug));
    });

    return sorted;
  }, [items, q, sort]);

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
        <span style={{ color: '#64748b', fontSize: 12 }}>писем: {filtered.length}</span>

        {/* Search + Sort */}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="поиск: slug / title / project"
          style={{
            padding: '8px 10px',
            borderRadius: 999,
            border: '1px solid #e5e7eb',
            outline: 'none',
            fontSize: 12,
            minWidth: 240,
          }}
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          style={{
            padding: '8px 10px',
            borderRadius: 999,
            border: '1px solid #e5e7eb',
            fontSize: 12,
            background: '#fff',
            fontWeight: 800,
          }}
          title="Сортировка списка"
        >
          <option value="created_desc">created ↓ (new first)</option>
          <option value="created_asc">created ↑ (old first)</option>
          <option value="title_asc">title A→Z</option>
          <option value="slug_asc">slug A→Z</option>
        </select>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>

            {/* Project filter (dropdown) */}
            {(() => {
            const activeProject = projectFilter || 'all';

            const mkHref = (p: string) => {
                const sp = new URLSearchParams();
                if (keyParam) sp.set('key', keyParam);
                sp.set('client', clientOnly ? '1' : '0');
                sp.set('status', statusFilter);
                if (p !== 'all') sp.set('project', p);
                return `/preview?${sp.toString()}`;
            };

            const options = ['all', ...projects];

            return (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>project:</span>

                <select
                    value={activeProject}
                    onChange={(e) => {
                    const p = e.target.value;
                    window.location.href = mkHref(p);
                    }}
                    style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: '1px solid #e5e7eb',
                    fontSize: 12,
                    background: '#fff',
                    fontWeight: 800,
                    maxWidth: 240,
                    }}
                    title="Фильтр по проекту"
                >
                    {options.map((p) => (
                    <option key={p} value={p}>
                        {p === 'all' ? 'ALL projects' : p}
                    </option>
                    ))}
                </select>
                </div>
            );
            })()}

          {/* Status filter */}
          {(['all', 'draft', 'approved', 'sent'] as StatusFilter[]).map((s) => {
            const active = statusFilter === s;

            const sp = new URLSearchParams();
            if (keyParam) sp.set('key', keyParam);
            sp.set('client', clientOnly ? '1' : '0');
            sp.set('status', s);
            if (projectFilter && projectFilter !== 'all') sp.set('project', projectFilter);

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

          {/* Client only toggle */}
          {(() => {
            const sp = new URLSearchParams();
            if (keyParam) sp.set('key', keyParam);
            sp.set('status', statusFilter);
            sp.set('client', clientOnly ? '0' : '1');
            if (projectFilter && projectFilter !== 'all') sp.set('project', projectFilter);

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
          key: <code>{keyParam ? 'yes' : 'no'}</code>
        </span>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ color: '#64748b' }}>
            Ничего не найдено. Проверь фильтры и поиск.
          </div>
        ) : (
          filtered.map((item) => (
            <Card key={item.slug} item={item} baseUrl={baseUrl} localToolsEnabled={localToolsEnabled} />
          ))
        )}
      </div>
    </div>
  );
}
