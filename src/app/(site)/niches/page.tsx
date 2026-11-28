import type { Metadata } from 'next';
import { NicheScorecard } from '@/components/catalog/niche-scorecard';
import { CategoryBadge } from '@/components/catalog/category-icon';
import { PageBanner, PageBar } from '@/components/ui/primitives';
import { NICHES } from '@/domain/niches';
import { SECTORS, SECTOR_KEYS, type SectorKey } from '@/domain/sectors';
import { getI18n } from '@/i18n/server';

export const metadata: Metadata = { title: 'Niches & Research' };

export default async function NichesPage() {
  const { t } = await getI18n();
  const tones: Record<SectorKey, string> = { home: 'saffron', food: 'red', fashion: '', wellness: 'green' };
  return (
    <>
      <PageBanner img="/images/banner-categories.jpg" kicker="Categories & research" line="Made in India. Sold worldwide." />
      <PageBar
        crumbs={[[null, 'Niches & Research']]}
        title="Niche Opportunity Research"
        lead={t(
          `${NICHES.length} Indian export categories scored on global demand, margin, ease of entry and India's manufacturing edge. Phase 1 niches launch first.`,
        )}
      />
      <div className="wrap section">
        <div className="grid g4" style={{ marginBottom: 20 }}>
          {SECTOR_KEYS.map((k) => (
            <div key={k} className="block">
              <div className={`block-head ${tones[k]}`}>
                <h3>{t(SECTORS[k].name)}</h3>
              </div>
              <div className="block-body small">
                <div className="badge-row">
                  {NICHES.filter((n) => n.sector === k).map((n) => (
                    <a key={n.slug} href={`/marketplace?niche=${n.slug}`} title={t(n.name)}>
                      <CategoryBadge niche={n.slug} size={36} />
                    </a>
                  ))}
                </div>
                {t(SECTORS[k].blurb)} · {t(`${NICHES.filter((n) => n.sector === k).length} categories`)}
              </div>
            </div>
          ))}
        </div>
        <NicheScorecard />
        <p className="tiny muted" style={{ marginTop: 10 }}>
          {t(
            'Scores are an internal planning estimate (1–5) to prioritise launch niches; validate with trade data and buyer interviews before committing inventory.',
          )}
        </p>
      </div>
    </>
  );
}
