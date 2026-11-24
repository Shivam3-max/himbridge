import { Badge, Banner, Block, Empty } from '@/components/ui/primitives';
import { getI18n } from '@/i18n/server';
import { fmtDate } from '@/lib/format';
import { requirePageUser } from '@/server/auth/session';
import { listOutbox } from '@/server/services/admin';

export const metadata = { title: 'Email Outbox' };

/** Turns URLs in a plain-text email into links. */
function Linkify({ text }: { text: string }) {
  return text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export default async function OutboxPage() {
  const me = await requirePageUser('/dashboard/admin/outbox');
  const [{ t }, mails] = await Promise.all([getI18n(), listOutbox(me)]);
  const smtp = Boolean(process.env.SMTP_URL);
  return (
    <>
      <Banner tone="info">
        {smtp ? (
          <>
            <b>{t('Email log.')}</b> {t('Every email the portal sends is recorded here with its delivery status.')}
          </>
        ) : (
          <>
            <b>{t('Development mailbox.')}</b>{' '}
            {t(
              'No email provider is connected yet, so verification and password-reset emails are kept here (and printed in the server log). Set SMTP_URL to deliver them for real.',
            )}
          </>
        )}
      </Banner>
      <Block title={t(`Email outbox (${mails.length})`)}>
        {mails.length ? (
          mails.map((m) => (
            <div key={m.id} className="mail">
              <header>
                <span>
                  <b>{m.subject}</b> <Badge tone={m.status === 'sent' ? 'ok' : m.status === 'failed' ? 'bad' : 'grey'}>{m.status}</Badge>
                </span>
                <span className="tiny muted">
                  {t('To')} {m.toEmail} · {fmtDate(m.createdAt)}
                </span>
              </header>
              <pre>
                <Linkify text={m.body} />
              </pre>
              {m.error && (
                <div className="tiny" style={{ color: 'var(--bad)', padding: '0 12px 10px' }}>
                  {m.error}
                </div>
              )}
            </div>
          ))
        ) : (
          <Empty>No emails sent yet.</Empty>
        )}
      </Block>
    </>
  );
}
