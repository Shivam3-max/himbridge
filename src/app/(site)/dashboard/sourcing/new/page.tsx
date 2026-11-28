import Link from 'next/link';
import { SourcingWizard } from '@/components/sourcing/wizard';
import { Banner } from '@/components/ui/primitives';
import { isNiche } from '@/domain/niches';
import { ROLE_LABEL } from '@/domain/roles';
import { DEFAULT_KIND, isBuyerType, REQUEST_KINDS, type RequestKind } from '@/domain/sourcing';
import { getI18n } from '@/i18n/server';
import { requirePageUser } from '@/server/auth/session';

export const metadata = { title: 'Start a sourcing request' };

type Params = { kind?: string; niche?: string; title?: string; item?: string; qty?: string; unit?: string; ref?: string };

export default async function NewSourcingPage({ searchParams }: { searchParams: Promise<Params> }) {
  const me = await requirePageUser('/dashboard/sourcing/new');
  const { t } = await getI18n();
  if (me.role !== 'buyer') {
    return (
      <Banner tone="warn">
        {t('Only buyer accounts can start sourcing requests.')} {t('You are signed in as')} {t(ROLE_LABEL[me.role])}.{' '}
        <Link href="/register">{t('Create a buyer account →')}</Link>
      </Banner>
    );
  }
  const sp = await searchParams;
  const kind: RequestKind = (REQUEST_KINDS as readonly string[]).includes(sp.kind ?? '')
    ? (sp.kind as RequestKind)
    : DEFAULT_KIND[isBuyerType(me.buyerType) ? me.buyerType : 'brand'];
  const qty = Number(sp.qty);
  return (
    <SourcingWizard
      defaults={{
        kind,
        niche: isNiche(sp.niche) ? sp.niche : undefined,
        title: sp.title?.slice(0, 200),
        destination: me.country,
        item: {
          name: sp.item?.slice(0, 160),
          quantity: Number.isInteger(qty) && qty > 0 ? qty : undefined,
          unit: sp.unit?.slice(0, 20),
          referenceUrl: sp.ref?.startsWith('http') ? sp.ref.slice(0, 500) : undefined,
        },
      }}
    />
  );
}
