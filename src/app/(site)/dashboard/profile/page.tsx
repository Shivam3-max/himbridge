import { BuyerTypePicker } from '@/components/account/buyer-type-picker';
import { FileList, UploadForm } from '@/components/dashboard/files';
import { ChangePasswordForm } from '@/components/dashboard/trade-forms';
import { VerifyEmailBanner } from '@/components/dashboard/verify-banner';
import { Banner, Block, Placeholder } from '@/components/ui/primitives';
import { ORIGIN_COUNTRY, sectorName } from '@/domain/sectors';
import { KYC_DOC_LABELS } from '@/domain/files';
import { nicheName } from '@/domain/niches';
import { ROLE_LABEL } from '@/domain/roles';
import { getI18n } from '@/i18n/server';
import { requirePageUser } from '@/server/auth/session';
import { listKycFiles } from '@/server/services/files';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const me = await requirePageUser('/dashboard/profile');
  const { t } = await getI18n();
  const v = me.vendor;
  const kyc = v ? await listKycFiles(me) : [];
  const rows: [string, string][] = [
    ['Name', me.name],
    ['Email', `${me.email}${me.emailVerified ? ' ✔' : ` (${t('unconfirmed')})`}`],
    ['Company', me.company],
    ['Country', me.country],
    ['Phone', me.phone || '—'],
    ['Account type', t(ROLE_LABEL[me.role])],
    ...(v
      ? ([
          ['Factory country', t(ORIGIN_COUNTRY)],
          ['Sector', t(sectorName(v.niche))],
          ['Cluster', v.cluster || '—'],
          ['Primary category', t(nicheName(v.niche))],
          ['Certifications', v.certifications || '—'],
          ['Capacity', v.capacity || '—'],
          ['Verification', t(v.verification)],
        ] as [string, string][])
      : []),
  ];
  return (
    <>
      <VerifyEmailBanner email={me.email} verified={me.emailVerified} />
      <Block title={t('My profile')} style={{ marginBottom: 16 }}>
        <div className="grid g2">
          <table className="tbl">
            <tbody>
              {rows.map(([k, val]) => (
                <tr key={k}>
                  <td className="muted">{t(k)}</td>
                  <td>
                    <b>{val}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <Placeholder label={v ? 'Company logo' : 'Profile photo'} size="400 × 400" style={{ height: 200 }} />
            {v && <Placeholder label="Factory photo" size="1200 × 600" style={{ height: 120, marginTop: 10 }} />}
          </div>
        </div>
      </Block>
      {me.role === 'buyer' && (
        <Block title={t('What kind of buyer are you?')} style={{ marginBottom: 16 }}>
          <p className="small muted" style={{ marginTop: 0 }}>
            {t('This tailors your dashboard, suggested order sizes and shipping options.')}
          </p>
          <BuyerTypePicker current={me.buyerType} />
        </Block>
      )}
      {v && (
        <Block title={t('KYC & certification documents')} tone="saffron" style={{ marginBottom: 16 }}>
          <p className="small muted" style={{ marginTop: 0 }}>
            {t(
              'Upload your export registration, tax registration, business licence and certificates (ISO, BSCI, FSC, CE…). Only you and the Himbridge compliance team can see these files.',
            )}
          </p>
          {kyc.length ? (
            <FileList files={kyc} removable />
          ) : (
            <Banner tone="warn">{t('No documents uploaded yet — verification cannot start without them.')}</Banner>
          )}
          <UploadForm options={KYC_DOC_LABELS.map((l) => ['kyc', l])} button="Upload documents" buttonClass="btn sm saffron" />
        </Block>
      )}
      <Block title={t('Change password')}>
        <ChangePasswordForm />
      </Block>
    </>
  );
}
