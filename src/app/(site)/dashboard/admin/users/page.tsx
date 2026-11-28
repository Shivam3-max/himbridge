import { BUYER_TYPE_INFO, isBuyerType } from '@/domain/sourcing';
import { Badge, Block } from '@/components/ui/primitives';
import { getI18n } from '@/i18n/server';
import { fmtDate } from '@/lib/format';
import { requirePageUser } from '@/server/auth/session';
import { listUsers } from '@/server/services/admin';

export const metadata = { title: 'Users' };

export default async function UsersPage() {
  const me = await requirePageUser('/dashboard/admin/users');
  const [{ t }, users] = await Promise.all([getI18n(), listUsers(me)]);
  return (
    <Block title={t(`All users (${users.length})`)} bodyClassName="">
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t('Name')}</th>
              <th>{t('Role')}</th>
              <th>{t('Company')}</th>
              <th>{t('Country')}</th>
              <th>{t('Joined')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <b>{u.name}</b>
                  <br />
                  <span className="tiny muted">{u.email}</span>
                </td>
                <td>
                  <Badge tone="info">{u.role}</Badge>
                  {isBuyerType(u.buyerType) && <div className="tiny muted">{t(BUYER_TYPE_INFO[u.buyerType].label)}</div>}
                  {u.buyerNote && <div className="tiny">“{u.buyerNote}”</div>}
                  {u.status !== 'active' && (
                    <>
                      {' '}
                      <Badge tone="bad">{u.status}</Badge>
                    </>
                  )}
                </td>
                <td>{u.company}</td>
                <td>{u.country}</td>
                <td className="small">{fmtDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Block>
  );
}
