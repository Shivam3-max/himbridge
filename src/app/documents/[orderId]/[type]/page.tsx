import type { Metadata } from 'next';
import Link from 'next/link';
import { LogoMark } from '@/components/brand/logo';
import { BRAND } from '@/config/brand';
import { ORIGIN_COUNTRY } from '@/domain/sectors';
import { getI18n } from '@/i18n/server';
import { fmtDate, fmtNum, usd } from '@/lib/format';
import { requirePageUser } from '@/server/auth/session';
import { getOrderDocument } from '@/server/services/orders';
import s from '../../document.module.css';
import { PrintButton } from '../../print-button';

const TYPES = { proforma: 'Proforma Invoice', commercial: 'Commercial Invoice', packing: 'Packing List' } as const;
type DocType = keyof typeof TYPES;
const PREFIX: Record<DocType, string> = { proforma: 'PI', commercial: 'CI', packing: 'PL' };

type Params = Promise<{ orderId: string; type: string }>;
const docType = (t: string): DocType => (t in TYPES ? (t as DocType) : 'proforma');

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { type } = await params;
  return { title: TYPES[docType(type)], robots: { index: false } };
}

export default async function TradeDocumentPage({ params }: { params: Params }) {
  const { orderId, type: rawType } = await params;
  const type = docType(rawType);
  const me = await requirePageUser(`/documents/${orderId}/${rawType}`);
  const { t } = await getI18n();
  const id = Number(orderId);
  const doc = Number.isInteger(id) && id > 0 ? await getOrderDocument(me, id) : null;

  if (!doc) {
    return (
      <div className={s.page}>
        <div className={s.err}>
          <b>{t('Document unavailable.')}</b>
          <br />
          {t('Order not found')}. <Link href={`/login?next=${encodeURIComponent(`/documents/${orderId}/${rawType}`)}`}>{t('Log in')}</Link>{' '}
          {t('with an account that is part of this order.')}
        </div>
      </div>
    );
  }

  const o = doc.order;
  const no = `${PREFIX[type]}-${o.code}`;
  const origin = ORIGIN_COUNTRY;
  const adv = doc.payments.find((p) => p.stage === 'advance');
  const bal = doc.payments.find((p) => p.stage === 'balance');
  const advPct = adv?.pct ?? 30;
  const balPct = bal?.pct ?? 70;

  const party = (heading: string, name: string, lines: (string | null | undefined)[]) => (
    <div>
      <h4>{t(heading)}</h4>
      <b>{name}</b>
      {lines.filter(Boolean).map((l) => (
        <span key={l}>
          <br />
          {l}
        </span>
      ))}
    </div>
  );

  const goods = (
    <td>
      <b>{o.title}</b>
      {doc.details && (
        <>
          <br />
          <span className={s.muted}>{doc.details}</span>
        </>
      )}
    </td>
  );

  return (
    <div className={s.page}>
      <div className={s.bar}>
        <PrintButton />
        <Link href="/dashboard/orders">{t('Back to dashboard')}</Link>
      </div>
      <article className={s.sheet}>
        <div className={s.head}>
          <div className={s.brand}>
            <LogoMark className="" />
            <div>
              <b>{BRAND.name.toUpperCase()}</b>
              <span>GLOBAL TRADE PORTAL</span>
            </div>
          </div>
          <div className={s.docTitle}>
            <h1>{t(TYPES[type])}</h1>
            <div>
              {t('No.')} <b>{no}</b>
            </div>
            <div>
              {t('Date')} {fmtDate(new Date())}
            </div>
            <div>
              {t('Order')} {o.code} · {t('Placed on')} {fmtDate(o.createdAt)}
            </div>
          </div>
        </div>

        <div className={s.parties}>
          {party('Seller / manufacturer', doc.vendorCompany, [doc.vendorCluster, doc.vendorCountry])}
          {party('Buyer / consignee', doc.buyerCompany, [doc.buyerName, doc.buyerCountry, doc.buyerEmail, doc.buyerPhone])}
          {party('Trade facilitator', BRAND.full, [BRAND.email, t('Escrow & milestone payments')])}
        </div>

        <div className={s.terms}>
          <div>
            <h4>{t('Incoterm')}</h4>
            {o.incoterm || 'FOB'}
          </div>
          <div>
            <h4>{t('Country of origin')}</h4>
            {t(origin)}
          </div>
          <div>
            <h4>{t('Port of loading')}</h4>
            {o.originPort || t('To be confirmed')}
          </div>
          <div>
            <h4>{t('Port of discharge')}</h4>
            {o.destPort || o.destination || '—'}
          </div>
          <div>
            <h4>{t('Mode')}</h4>
            {o.mode || t('To be confirmed')}
          </div>
          <div>
            <h4>{t('Lead time')}</h4>
            {doc.leadDays ? t(`${doc.leadDays} days`) : '—'}
          </div>
          <div>
            <h4>{t('Currency')}</h4>USD
          </div>
          <div>
            <h4>{t('Status')}</h4>
            {t(o.status.replace('_', ' '))}
          </div>
        </div>

        {type === 'packing' ? (
          <>
            <div className={s.tblWrap}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('Description of goods')}</th>
                    <th>{t('HS code')}</th>
                    <th className={s.r}>{t('Quantity')}</th>
                    <th className={s.r}>{t('Cartons')}</th>
                    <th className={s.r}>{t('Net wt (kg)')}</th>
                    <th className={s.r}>{t('Gross wt (kg)')}</th>
                    <th className={s.r}>CBM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    {goods}
                    <td>{doc.hs}</td>
                    <td className={s.r}>
                      {fmtNum(o.quantity)} {o.unit}
                    </td>
                    <td className={s.r}>________</td>
                    <td className={s.r}>________</td>
                    <td className={s.r}>________</td>
                    <td className={s.r}>______</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={s.muted} style={{ fontSize: 11 }}>
              {t('Carton count, weights and volume are completed by the manufacturer at packing and verified at pre-shipment inspection.')}
            </p>
          </>
        ) : (
          <>
            <div className={s.tblWrap}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('Description of goods')}</th>
                    <th>{t('HS code')}</th>
                    <th className={s.r}>{t('Quantity')}</th>
                    <th className={s.r}>{t('Unit price (USD)')}</th>
                    <th className={s.r}>{t('Amount (USD)')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    {goods}
                    <td>{doc.hs}</td>
                    <td className={s.r}>
                      {fmtNum(o.quantity)} {o.unit}
                    </td>
                    <td className={s.r}>{usd(o.unitPrice)}</td>
                    <td className={s.r}>{usd(o.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <table className={s.totals}>
              <tbody>
                <tr>
                  <td>
                    {t('Sub-total')} ({o.incoterm})
                  </td>
                  <td className={s.r}>{usd(o.total)}</td>
                </tr>
                {type === 'proforma' && (
                  <>
                    <tr>
                      <td>{t(`Advance ${advPct}% — due on confirmation`)}</td>
                      <td className={s.r}>{usd(adv?.amount)}</td>
                    </tr>
                    <tr>
                      <td>{t(`Balance ${balPct}% — due after QC`)}</td>
                      <td className={s.r}>{usd(bal?.amount)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td>{t('Total amount (USD)')}</td>
                  <td className={s.r}>{usd(o.total)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        <div className={s.foot}>
          <div>
            <h4>{t(type === 'packing' ? 'Marks & numbers' : 'Payment terms & bank')}</h4>
            {type === 'packing' ? (
              <>
                {t('Shipping marks')}: {o.code} / {doc.buyerCompany} / {o.destPort || o.destination}
                <br />
                {t('Made in')} {t(origin)}
              </>
            ) : (
              <>
                {t(
                  `${advPct}% advance against this proforma, ${balPct}% balance after the pre-shipment QC report is shared. Funds are paid to the Himbridge collection account and released to the seller at each milestone.`,
                )}
                <br />
                <br />
                {t('Bank details are shared on the official proforma issued by the Himbridge accounts desk.')}
              </>
            )}
          </div>
          <div>
            <div className={s.sign}>
              {t('Authorised signatory')} · {doc.vendorCompany}
            </div>
          </div>
        </div>
        <p className={s.note}>
          {t(
            type === 'proforma'
              ? 'This proforma invoice is issued for advance payment and import licensing purposes. Prices are valid for the agreed lead time.'
              : 'We certify that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
          )}{' '}
          {t(
            'Generated on the Himbridge Global Trade Portal. Verify current duties and compliance requirements for the destination market.',
          )}
        </p>
      </article>
    </div>
  );
}
