import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

type Status = 'draft' | 'approved' | 'sent';

type EmailMeta = {
  title: string;
  project: string;
  status: Status;
  can_show_client: boolean;
  created_at: string; // YYYY-MM-DD
};

function isLocalToolsEnabled() {
  // Включаем только если явно задано в .env.local
  return process.env.NEXT_PUBLIC_LOCAL_META_TOOLS === '1';
}

function isStatus(v: any): v is Status {
  return v === 'draft' || v === 'approved' || v === 'sent';
}

function safeSlug(slug: string) {
  // Разрешаем только буквы/цифры/дефис/подчёркивание/точку
  // чтобы нельзя было писать куда-то вне public/emails
  if (!slug || typeof slug !== 'string') return null;
  const ok = /^[a-zA-Z0-9._-]+$/.test(slug);
  return ok ? slug : null;
}

function normalizeMeta(slug: string, raw: any): EmailMeta {
  const title = typeof raw?.title === 'string' && raw.title.trim() ? raw.title.trim() : slug;
  const project = typeof raw?.project === 'string' && raw.project.trim() ? raw.project.trim() : 'LS';
  const status: Status = isStatus(raw?.status) ? raw.status : 'draft';
  const can_show_client = typeof raw?.can_show_client === 'boolean' ? raw.can_show_client : false;

  const created_at =
    typeof raw?.created_at === 'string' && raw.created_at.trim()
      ? raw.created_at.trim()
      : new Date().toISOString().slice(0, 10);

  return { title, project, status, can_show_client, created_at };
}

export async function POST(req: Request) {
  if (!isLocalToolsEnabled()) {
    return NextResponse.json({ ok: false, error: 'Local meta tools are disabled' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const slug = safeSlug(body?.slug);
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Bad slug' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'public', 'emails');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const htmlPath = path.join(dir, `${slug}.html`);
    if (!fs.existsSync(htmlPath)) {
      return NextResponse.json({ ok: false, error: 'HTML not found' }, { status: 404 });
    }

    const meta = normalizeMeta(slug, body?.meta);

    const metaPath = path.join(dir, `${slug}.meta.json`);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');

    return NextResponse.json({ ok: true, slug, metaPath: `/emails/${slug}.meta.json`, meta });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
