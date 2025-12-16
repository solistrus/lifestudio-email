import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import CopyButton from './CopyButton';

function getEmailSlugs(): string[] {
  const dir = path.join(process.cwd(), 'public', 'emails');
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.html'))
    .map((f) => f.replace(/\.html$/i, ''))
    .sort((a, b) => a.localeCompare(b));
}

function Card({ slug }: { slug: string }) {
  // для открытия внутри приложения
  const previewPath = `/preview/${slug}`;

  // для копирования "клиентских" ссылок (абсолютных)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const baseForCopy = baseUrl ? `${baseUrl}${previewPath}` : previewPath;

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontWeight: 700 }}>{slug}</div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
          /emails/{slug}.html
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Link
          href={previewPath}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 999,
            padding: '6px 10px',
            textDecoration: 'none',
            color: '#0f172a',
            fontWeight: 600,
            background: '#fff',
          }}
        >
          Open (All)
        </Link>

        <Link
          href={`${previewPath}?view=desktop`}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 999,
            padding: '6px 10px',
            textDecoration: 'none',
            color: '#0f172a',
            fontWeight: 600,
            background: '#fff',
          }}
        >
          Open (Desktop)
        </Link>

        <Link
          href={`${previewPath}?view=mobile`}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 999,
            padding: '6px 10px',
            textDecoration: 'none',
            color: '#0f172a',
            fontWeight: 600,
            background: '#fff',
          }}
        >
          Open (Mobile)
        </Link>

        <CopyButton label="Copy (All)" url={baseForCopy} />
        <CopyButton label="Copy (Desktop)" url={`${baseForCopy}?view=desktop`} />
        <CopyButton label="Copy (Mobile)" url={`${baseForCopy}?view=mobile`} />
      </div>
    </div>
  );
}

export default function PreviewIndexPage() {
  const slugs = getEmailSlugs();

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
          zIndex: 10,
        }}
      >
        <strong>LifeStudio Email · Previews</strong>
        <span style={{ color: '#64748b', fontSize: 12 }}>файлов: {slugs.length}</span>
      </div>

      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        {slugs.length === 0 ? (
          <div style={{ color: '#64748b' }}>
            В <code>public/emails</code> пока нет .html файлов.
          </div>
        ) : (
          slugs.map((slug) => <Card key={slug} slug={slug} />)
        )}
      </div>
    </div>
  );
}
