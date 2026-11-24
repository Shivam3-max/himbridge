import { FileList } from '@/components/dashboard/files';
import { VendorStatusButtons } from '@/components/dashboard/trade-forms';
import { Badge, Block, CollectionChip } from '@/components/ui/primitives';
import { nicheName } from '@/domain/niches';
import { getI18n } from '@/i18n/server';
import { requirePageUser } from '@/server/auth/session';
import { listUsers } from '@/server/services/admin';
import { listKycFilesByOwner } from '@/server/services/files';

export const metadata = { title: 'Vendor Verification' };

export default async function VendorQueuePage() {
  const me = await requirePageUser('/dashboard/admin/vendors');
  const { t } = await getI18n();
  const vendors = (await listUsers(me))
    .filter((u) => u.role === 'vendor')
    .sort((a, b) => Number(b.verification === 'pending') - Number(a.verification === 'pending'));
  const kyc = await listKycFilesByOwner(vendors.map((v) => v.id));
  return (
    <Block title={t('Vendor verification queue')} tone="saffron" bodyClassName="">
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t('Company')}</th>
              <th>{t('Collection')}</th>
              <th>{t('Category')}</th>
              <th>{t('Certifications')}</th>
              <th>{t('KYC documents')}</th>
              <th>{t('Status')}</th>
              <th>{t('Action')}</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              const docs = kyc.get(v.id) ?? [];
              return (
                <tr key={v.id}>
                  <td>
                    <b>{v.company}</b>
                    <br />
                    <span className="tiny muted">
                      {v.name} · {v.email}
                    </span>
                  </td>
                  <td>
                    <CollectionChip origin={v.origin} />
                    <br />
                    <span className="tiny muted">{v.cluster}</span>
                  </td>
                  <td className="small">
                    {t(nicheName(v.niche))}
                    <br />
                    <span className="tiny muted">{v.capacity}</span>
                  </td>
                  <td className="small">{v.certifications || '—'}</td>
                  <td>{docs.length ? <FileList files={docs} /> : <span className="tiny muted">{t('None uploaded')}</span>}</td>
                  <td>
                    <Badge tone={v.verification === 'verified' ? 'ok' : v.verification === 'pending' ? 'warn' : 'bad'}>
                      {v.verification ?? '—'}
                    </Badge>
                  </td>
                  <td className="nowrap">
                    <VendorStatusButtons vendorId={v.id} status={v.verification ?? 'pending'} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Block>
  );
}
