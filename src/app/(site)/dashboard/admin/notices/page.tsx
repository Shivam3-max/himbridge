import { NoticeForm } from '@/components/dashboard/trade-forms';
import { Badge, Block } from '@/components/ui/primitives';
import { getI18n } from '@/i18n/server';
import { fmtDate } from '@/lib/format';
import { listNotices } from '@/server/services/admin';

export const metadata = { title: 'Notices' };

export default async function NoticesPage() {
  const [{ t }, notices] = await Promise.all([getI18n(), listNotices(50)]);
  return (
    <>
      <Block title={t('Publish a notice / circular')} tone="saffron" style={{ marginBottom: 16 }}>
        <NoticeForm />
      </Block>
      <Block title={t('Published notices')}>
        <ul className="notices">
          {notices.map((n) => (
            <li key={n.id}>
              <Badge tone="info">{n.tag}</Badge>
              <span>
                <div className="t">{n.title}</div>
                <div className="tiny muted">{fmtDate(n.createdAt)}</div>
              </span>
            </li>
          ))}
        </ul>
      </Block>
    </>
  );
}
