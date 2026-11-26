'use client';

import Link from 'next/link';
import { useState } from 'react';
import { NICHES, nicheScore } from '@/domain/niches';
import { SECTORS, SECTOR_KEYS, type SectorKey } from '@/domain/sectors';
import { useT } from '@/i18n/client';
import { Badge, SectorChip, Placeholder, ScoreBar } from '../ui/primitives';

const TABS: readonly (readonly ['' | SectorKey, string])[] = [['', 'All'], ...SECTOR_KEYS.map((k) => [k, SECTORS[k].name] as const)];

/** Category scorecard with an All / per-sector switch. */
export function NicheScorecard() {
  const t = useT();
  const [sector, setSector] = useState<'' | SectorKey>('');
  const rows = NICHES.filter((n) => !sector || n.sector === sector)
    .map((n) => ({ ...n, total: nicheScore(n) }))
    .sort((a, b) => b.total - a.total);
  return (
    <div className="block">
      <div className="block-head">
        <h3>{t('Category scorecard')}</h3>
        <div style={{ display: 'flex', gap: 6 }} role="tablist">
          {TABS.map(([value, label]) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={sector === value}
              className={sector === value ? 'btn sm' : 'btn sm ghost'}
              onClick={() => setSector(value)}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th />
              <th>{t('Category')}</th>
              <th>{t('Sector')}</th>
              <th>{t('Clusters')}</th>
              <th>{t('Best markets')}</th>
              <th>{t('Demand')}</th>
              <th>{t('Margin')}</th>
              <th>{t('Ease')}</th>
              <th>{t('Edge')}</th>
              <th>{t('Score')}</th>
              <th>{t('Phase')}</th>
              <th>{t('HS chapters')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.slug}>
                <td>
                  <Placeholder className="niche-img" />
                </td>
                <td>
                  <Link href={`/marketplace?niche=${n.slug}`}>
                    <b>{t(n.name)}</b>
                  </Link>
                </td>
                <td>
                  <SectorChip niche={n.slug} />
                </td>
                <td className="small">{n.clusters}</td>
                <td className="small">{n.markets}</td>
                <td>
                  <ScoreBar value={n.demand} />
                </td>
                <td>
                  <ScoreBar value={n.margin} />
                </td>
                <td>
                  <ScoreBar value={n.ease} />
                </td>
                <td>
                  <ScoreBar value={n.edge} />
                </td>
                <td>
                  <b>{n.total}</b>/20
                </td>
                <td>
                  <Badge tone={n.phase === 1 ? 'ok' : n.phase === 2 ? 'info' : 'grey'}>{`Phase ${n.phase}`}</Badge>
                </td>
                <td className="small nowrap">{n.hs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
