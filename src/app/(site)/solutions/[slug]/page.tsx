import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageBanner, PageBar } from '@/components/ui/primitives';
import { AUDIENCES, audienceBySlug } from '@/domain/audiences';
import { SHIP_MODE_INFO, type ShipMode } from '@/domain/sourcing';
import { getI18n } from '@/i18n/server';
import { getCurrentUser } from '@/server/auth/session';

export function generateStaticParams() {
  return AUDIENCES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = audienceBySlug((await params).slug);
  return a ? { title: a.nav, description: a.lead } : {};
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const a = audienceBySlug((await params).slug);
  if (!a) notFound();
  const [{ t }, me] = await Promise.all([getI18n(), getCurrentUser()]);
  const start =
    a.type === 'importer' && me?.role === 'buyer'
      ? '/dashboard/rfqs/new'
      : me?.role === 'buyer'
        ? `/dashboard/sourcing/new?kind=${a.kind}`
        : `/register?role=buyer&as=${a.slug}&next=${encodeURIComponent(`/dashboard/sourcing/new?kind=${a.kind}`)}`;
  return (
    <>
      <PageBar
        crumbs={[
          [null, 'Source from India'],
          [null, a.nav],
        ]}
        title={a.title}
        lead={a.lead}
      />
      <PageBanner img={a.img} kicker="Source from India" line={a.nav} />
      <div className="wrap section">
        <div className="cta-strip">
          <div>
            <b>{t(a.cta)}</b>
            <span className="small muted">{t('Free to post · verified makers only · reply within one working day')}</span>
          </div>
          <Link className="btn saffron" href={start}>
            {t(a.cta)} →
          </Link>
        </div>

        <h2 className="section-title">{t('Why source through Himbridge')}</h2>
        <div className="benefit-grid">
          {a.benefits.map(([title, text]) => (
            <div key={title} className="benefit">
              <b>{t(title)}</b>
              <p className="small">{t(text)}</p>
            </div>
          ))}
        </div>

        <h2 className="section-title">{t('How it works')}</h2>
        <div className="steps">
          {a.steps.map(([title, text]) => (
            <div key={title} className="step">
              <b>{t(title)}</b>
              <p>{t(text)}</p>
            </div>
          ))}
        </div>

        <h2 className="section-title">{t('Typical orders')}</h2>
        <div className="table-wrap block">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('Order')}</th>
                <th>{t('Size')}</th>
                <th>{t('How it ships')}</th>
              </tr>
            </thead>
            <tbody>
              {a.examples.map(([what, size, ship]) => (
                <tr key={what}>
                  <td>
                    <b>{t(what)}</b>
                  </td>
                  <td className="small">{t(size)}</td>
                  <td className="small">{t(ship)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="section-title">{t('Shipping options')}</h2>
        <div className="g4 grid">
          {(Object.keys(SHIP_MODE_INFO) as ShipMode[]).map((m) => (
            <div key={m} className="benefit">
              <b>{t(SHIP_MODE_INFO[m].label)}</b>
              <div className="tiny muted">{t(SHIP_MODE_INFO[m].transit)}</div>
              <p className="small">{t(SHIP_MODE_INFO[m].sub)}</p>
            </div>
          ))}
        </div>

        <h2 className="section-title">{t('Questions')}</h2>
        <div className="faq">
          {a.faqs.map(([q, ans]) => (
            <details key={q}>
              <summary>{t(q)}</summary>
              <p className="small">{t(ans)}</p>
            </details>
          ))}
        </div>

        <div className="cta-strip">
          <div>
            <b>{t('Ready when you are.')}</b>
            <span className="small muted">{t('Tell us what you need. It takes about three minutes.')}</span>
          </div>
          <Link className="btn saffron" href={start}>
            {t(a.cta)} →
          </Link>
        </div>
        <p className="small muted">
          {t('Also see:')}{' '}
          {AUDIENCES.filter((x) => x.slug !== a.slug).map((x, i) => (
            <span key={x.slug}>
              {i > 0 && ' · '}
              <Link href={`/solutions/${x.slug}`}>{t(x.nav)}</Link>
            </span>
          ))}
        </p>
      </div>
    </>
  );
}
