import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketplaceFilters } from '@/components/catalog/marketplace-filters';
import { ProductCard } from '@/components/catalog/product-card';
import { PageBanner, PageBar } from '@/components/ui/primitives';
import { isSector } from '@/domain/sectors';
import { getNiche } from '@/domain/niches';
import { getI18n } from '@/i18n/server';
import { listProducts } from '@/server/services/catalog';

export const metadata: Metadata = { title: 'Marketplace' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 100);
  const niche = getNiche(one(sp.niche)) ? one(sp.niche) : '';
  const sector = isSector(one(sp.c)) ? one(sp.c) : '';
  const c = sector;
  const [{ t }, products] = await Promise.all([
    getI18n(),
    listProducts({ q, niche: niche || undefined, sector: isSector(sector) ? sector : undefined }),
  ]);

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
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="small muted">{t(`${products.length} product${products.length === 1 ? '' : 's'} found`)}</span>
          </div>
          <div className="products">
            {products.length ? (
              products.map((p) => <ProductCard key={p.id} p={p} />)
            ) : (
              <div className="empty" style={{ gridColumn: '1/-1' }}>
                {t('No products match these filters yet. Try another category or')}{' '}
                <Link href="/dashboard/rfqs/new">{t('post an RFQ')}</Link>.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
