import type { Metadata } from 'next';
import { NicheScorecard } from '@/components/catalog/niche-scorecard';
import { PageBanner, PageBar } from '@/components/ui/primitives';
import { NICHES } from '@/domain/niches';
import { getI18n } from '@/i18n/server';

export const metadata: Metadata = { title: 'Niches & Research' };

export default async function NichesPage() {
  const { t } = await getI18n();
  const intro: [title: string, tone: string, text: string][] = [
    [
      'Crafted collection',
      'saffron',
      'Handmade, artisanal and natural-material goods — brass & wood décor, rugs, home textiles, leather, wellness. Small-batch, story-led and customisable; preferential tariffs apply in several key markets.',
    ],
    [
      'Engineered collection',
      '',
      'Scale, speed and cost in lighting, solar, appliances, electronics, hardware and modern furniture. Deep component supply chains, certified factories and fast sampling.',
    ],
    [
      'Hybrid sourcing',
      'green',
      'Engineered components combined with Crafted finishing and assembly — e.g. furniture hardware with solid-wood bodies — to balance cost, quality and rules of origin. Always verify origin rules per market.',
    ],
  ];
  return (
    <>
      <PageBanner img="/images/banner-categories.jpg" kicker="Categories & research" line="Sixteen categories. One standard." />
      <PageBar
        crumbs={[[null, 'Niches & Research']]}
        title="Niche Opportunity Research"
        lead={t(
          `${NICHES.length} export categories scored on global demand, margin, ease of entry and manufacturing edge. Phase 1 niches launch first.`,
        )}
      />
      <div className="wrap section">
        <div className="grid g3" style={{ marginBottom: 20 }}>
          {intro.map(([title, tone, text]) => (
            <div key={title} className="block">
              <div className={`block-head ${tone}`}>
                <h3>{t(title)}</h3>
              </div>
              <div className="block-body small">{t(text)}</div>
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
