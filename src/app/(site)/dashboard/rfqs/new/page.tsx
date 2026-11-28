import Link from 'next/link';
import { PostRfqForm } from '@/components/dashboard/trade-forms';
import { Banner, Block } from '@/components/ui/primitives';
import { ROLE_LABEL } from '@/domain/roles';
import { getI18n } from '@/i18n/server';
import { requirePageUser } from '@/server/auth/session';

export const metadata = { title: 'Post RFQ' };

export default async function PostRfqPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; niche?: string; qty?: string; unit?: string }>;
}) {
  const me = await requirePageUser('/dashboard/rfqs/new');
  const { t } = await getI18n();
  if (me.role !== 'buyer') {
    return (
      <Banner tone="warn">
        {t('Only buyer accounts can post RFQs.')} {t('You are signed in as')} {t(ROLE_LABEL[me.role])}.
      </Banner>
    );
  }
  const sp = await searchParams;
  return (
    <Block title={t('Post a buying requirement (RFQ)')} tone="saffron">
      <>
        <p className="small muted" style={{ marginTop: 0 }}>
          {t('For container and bulk orders. Ordering smaller batches, samples or custom pieces?')}{' '}
          <Link href="/dashboard/sourcing/new">{t('Start a sourcing request instead →')}</Link>
        </p>
        <PostRfqForm
          defaults={{ title: sp.title, niche: sp.niche, destination: me.country, quantity: Number(sp.qty) || undefined, unit: sp.unit }}
        />
      </>
    </Block>
  );
}
