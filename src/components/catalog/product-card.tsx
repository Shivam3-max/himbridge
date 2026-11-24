'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getNiche } from '@/domain/niches';
import { useT } from '@/i18n/client';
import { fmtNum, singularUnit, usd } from '@/lib/format';
import { CollectionChip, Placeholder } from '../ui/primitives';

export interface ProductCardData {
  id: number;
  niche: string;
  title: string;
  hsCode: string;
  moq: number;
  unit: string;
  priceMin: number;
  priceMax: number;
  leadDays: number;
  material: string;
  imageId: number | null;
  vendorCompany: string;
  origin: string;
  cluster: string;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const t = useT();
  const n = getNiche(p.niche);
  const rfqHref = `/dashboard/rfqs/new?niche=${encodeURIComponent(p.niche)}&title=${encodeURIComponent(p.title)}`;
  return (
    <article className="pcard" style={{ '--c': n?.color ?? '#0b2a5b' } as CSSProperties}>
      {p.imageId ? (
        <div className="pthumb">
          <CollectionChip origin={p.origin} />
          {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded image served by /files */}
          <img src={`/files/${p.imageId}`} alt={p.title} loading="lazy" />
        </div>
      ) : (
        <Placeholder label="Product image" size="800 × 600" className="pthumb">
          <CollectionChip origin={p.origin} />
        </Placeholder>
      )}
      <div className="pbody">
        <span className="tiny muted">
          {t(n?.name ?? p.niche)} · HS {p.hsCode || '—'}
        </span>
        <h4>{p.title}</h4>
        <div className="price">
          {usd(p.priceMin)} – {usd(p.priceMax)} <span className="tiny muted">{t(`/ ${singularUnit(p.unit)} FOB`)}</span>
        </div>
        <div className="pmeta">
          <span>
            {t('MOQ')}{' '}
            <b>
              {fmtNum(p.moq)} {p.unit}
            </b>
          </span>
          <span>
            {t('Lead')} <b>{t(`${p.leadDays} days`)}</b>
          </span>
          <span style={{ gridColumn: '1/-1' }}>
            {t('Material')} <b>{p.material || '—'}</b>
          </span>
        </div>
        <div className="pvendor">
          ✔ <b>{p.vendorCompany}</b>
          <br />
          {p.cluster}
        </div>
        <Link className="btn sm ghost" href={rfqHref}>
          {t('Request quotation')}
        </Link>
      </div>
    </article>
  );
}
