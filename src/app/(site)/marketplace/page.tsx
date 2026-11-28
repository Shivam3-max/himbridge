import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketplaceFilters } from '@/components/catalog/marketplace-filters';
import { ProductCard } from '@/components/catalog/product-card';
import { PageBanner, PageBar } from '@/components/ui/primitives';
import { isSector } from '@/domain/sectors';
import { getNiche } from '@/domain/niches';
import { getI18n } from '@/i18n/server';
import { countProductsByNiche, listProducts } from '@/server/services/catalog';
import { CategoryGrid } from '@/components/catalog/category-grid';
import { CategoryBadge } from '@/components/catalog/category-icon';

export const metadata: Metadata = { title: 'Marketplace' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 100);
  const niche = getNiche(one(sp.niche)) ? one(sp.niche) : '';
  const sector = isSector(one(sp.c)) ? one(sp.c) : '';
  const c = sector;
  const [{ t }, products, counts] = await Promise.all([
    getI18n(),
    listProducts({ q, niche: niche || undefined, sector: isSector(sector) ? sector : undefined }),
    countProductsByNiche(),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const current = getNiche(niche);

  return (
    <>
      <PageBanner img="/images/banner-marketplace.jpg" kicker="Marketplace" line="Factory-direct. Export-ready." pos="70% 60%" />
      <PageBar
        crumbs={[[null, 'Marketplace']]}
        title="Export Marketplace"
        lead="Export-ready products from verified, audited manufacturers. Prices are indicative FOB — request a quotation for firm pricing."
      />
      <div className="wrap section filters-layout">
        <MarketplaceFilters q={q} niche={niche} c={c} />
        <section>
          <CategoryGrid compact base="/marketplace?niche=" active={niche} counts={counts} sector={isSector(sector) ? sector : undefined} />
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="small muted">{t(`${products.length} product${products.length === 1 ? '' : 's'} found`)}</span>
          </div>
          <div className="products">
            {products.length ? (
              products.map((p) => <ProductCard key={p.id} p={p} />)
            ) : (
              <div className="empty-rich" style={{ gridColumn: '1/-1' }}>
                {current && <CategoryBadge niche={current.slug} size={64} />}
                <b>
                  {total === 0
                    ? t('Our catalogue is opening: verified makers are listing their first products.')
                    : current
                      ? `${t(current.name)}: ${t('no live listings yet.')}`
                      : t('No products match these filters yet.')}
                </b>
                <p className="small muted">
                  {t(
                    'You can still source it today. Tell us what you need and our sourcing desk will match verified Indian makers within 3–5 working days.',
                  )}
                </p>
                <div className="row-actions" style={{ justifyContent: 'center', margin: 0 }}>
                  <Link className="btn saffron" href={`/dashboard/sourcing/new${current ? `?niche=${current.slug}` : ''}`}>
                    {t('Start a sourcing request')}
                  </Link>
                  <Link className="btn ghost" href={`/dashboard/rfqs/new${current ? `?niche=${current.slug}` : ''}`}>
                    {t('Post a bulk RFQ')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
