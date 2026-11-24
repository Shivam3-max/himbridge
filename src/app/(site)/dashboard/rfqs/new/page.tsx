import { PostRfqForm } from '@/components/dashboard/trade-forms';
import { Banner, Block } from '@/components/ui/primitives';
import { ROLE_LABEL } from '@/domain/roles';
import { getI18n } from '@/i18n/server';
import { requirePageUser } from '@/server/auth/session';

export const metadata = { title: 'Post RFQ' };

export default async function PostRfqPage({ searchParams }: { searchParams: Promise<{ title?: string; niche?: string }> }) {
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
      <PostRfqForm defaults={{ title: sp.title, niche: sp.niche, destination: me.country }} />
    </Block>
  );
}
