import type { Metadata } from 'next';
import { ExportDocsChecklist, HsCodeFinder, LandedCostCalculator } from '@/components/tools/trade-tools';
import { PageBanner, PageBar } from '@/components/ui/primitives';
import { INCOTERM_GUIDE } from '@/domain/trade-reference';
import { getI18n } from '@/i18n/server';

export const metadata: Metadata = { title: 'Trade Tools' };

export default async function ToolsPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageBanner img="/images/banner-tools.jpg" kicker="Trade tools" line="Price it right before you buy." pos="center 40%" />
      <PageBar
        crumbs={[[null, 'Trade Tools']]}
        title="Trade Tools & Guides"
        lead="Estimate landed cost, find HS codes, understand Incoterms and prepare your export documents."
      />
      <div className="wrap section grid" style={{ gap: 20 }}>
        <LandedCostCalculator />
        <HsCodeFinder />
        <div className="grid g2">
          <div className="block" id="incoterms">
            <div className="block-head">
              <h3>{t('Incoterms 2020 — Quick Guide')}</h3>
            </div>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t('Term')}</th>
                    <th>{t('Seller covers')}</th>
                    <th>{t('Risk passes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {INCOTERM_GUIDE.map(([term, covers, risk]) => (
                    <tr key={term}>
                      <td>
                        <b>{term}</b>
                      </td>
                      <td>{t(covers)}</td>
                      <td>{t(risk)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <ExportDocsChecklist />
        </div>
      </div>
    </>
  );
}
