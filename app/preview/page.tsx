import fs from 'fs';
import path from 'path';
import { redirect } from 'next/navigation';
import PreviewClient from './PreviewClient';

type Status = 'draft' | 'approved' | 'sent';
type StatusFilter = 'all' | Status;

export type EmailMeta = {
  title: string;
  project: string;
  status: Status;
  can_show_client: boolean;
  created_at: string; // YYYY-MM-DD
};

export type EmailItem = {
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

export default async function PreviewIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; status?: StatusFilter; client?: string; project?: string }>;
}) {
  const PREVIEW_KEY = process.env.PREVIEW_KEY;
  const { key, status: statusParam, client: clientParam, project: projectParam } = await searchParams;

  // защита каталога
  if (PREVIEW_KEY && key !== PREVIEW_KEY) {
    redirect('/');
  }

  const statusFilter: StatusFilter = statusParam ?? 'all';
  const clientOnly = clientParam !== '0';
  const projectFilter = (projectParam ?? 'all').trim();

  const itemsAll = getEmails();

  const projects = Array.from(
    new Set(itemsAll.map((i) => i.meta?.project ?? '—').filter((p) => p && p !== '—'))
  ).sort((a, b) => a.localeCompare(b));

  const items = itemsAll.filter((item) => {
    const meta = item.meta;

    // 0) проект
    if (projectFilter !== 'all') {
      const p = meta?.project ?? '—';
      if (p !== projectFilter) return false;
    }

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
    <PreviewClient
      items={items}
      projects={projects}
      keyParam={key}
      statusFilter={statusFilter}
      clientOnly={clientOnly}
      projectFilter={projectFilter}
      localToolsEnabled={process.env.NEXT_PUBLIC_LOCAL_META_TOOLS === '1'}
      baseUrl={process.env.NEXT_PUBLIC_BASE_URL || ''}
    />
  );
}
