import { redirect } from 'next/navigation';
import { AddProductPhotos, DeleteProductButton, ProductForm } from '@/components/dashboard/trade-forms';
import { Block, Placeholder } from '@/components/ui/primitives';
import { nicheName } from '@/domain/niches';
import { getI18n } from '@/i18n/server';
import { fmtNum, usd } from '@/lib/format';
import { requirePageUser } from '@/server/auth/session';
import { listMyProducts } from '@/server/services/catalog';

export const metadata = { title: 'My Products' };

export default async function ProductsPage() {
  const me = await requirePageUser('/dashboard/products');
  if (me.role !== 'vendor' || !me.vendor) redirect('/dashboard');
  const [{ t }, products] = await Promise.all([getI18n(), listMyProducts(me)]);
  return (
    <Block title={t(`My products (${products.length})`)} tone="saffron">
      <ProductForm vendorNiche={me.vendor.niche} vendorOrigin={me.vendor.origin} open={!products.length} />
      {products.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th />
                <th>{t('Product')}</th>
                <th>{t('Niche')}</th>
                <th>{t('MOQ')}</th>
                <th className="right">{t('FOB range')}</th>
                <th>{t('Lead')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td style={{ width: 80 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- permission-checked file route */}
                    {p.imageId ? <img className="thumb" src={`/files/${p.imageId}`} alt="" /> : <Placeholder className="niche-img" />}
                    <AddProductPhotos productId={p.id} />
                  </td>
                  <td>
                    <b>{p.title}</b>
                    <br />
                    <span className="tiny muted">
                      HS {p.hsCode || '—'} · {p.material}
                    </span>
                  </td>
                  <td className="small">{t(nicheName(p.niche))}</td>
                  <td>
                    {fmtNum(p.moq)} {p.unit}
                  </td>
                  <td className="right nowrap">
                    {usd(p.priceMin)} – {usd(p.priceMax)}
                  </td>
                  <td>{p.leadDays} d</td>
                  <td>
                    <DeleteProductButton productId={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Block>
  );
}
