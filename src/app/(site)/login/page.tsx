import type { Metadata } from 'next';
import { PageBar, Peak } from '@/components/ui/primitives';
import { getI18n } from '@/i18n/server';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Login' };

/** Only same-site paths are allowed as a post-login destination (prevents open redirects). */
function safeNext(next: string | string[] | undefined) {
  const v = Array.isArray(next) ? next[0] : next;
  return v && v.startsWith('/') && !v.startsWith('//') ? v : '/dashboard';
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t } = await getI18n();
  const next = safeNext((await searchParams).next);
  return (
    <>
      <PageBar
        crumbs={[[null, 'Login']]}
        title="Portal Login"
        lead="One login for buyers, manufacturers, logistics partners and Himbridge staff."
      />
      <div className="wrap">
        <LoginForm next={next}>
          <div className="side-banner">
            {/* eslint-disable-next-line @next/next/no-img-element -- decorative photo */}
            <img src="/images/login-warehouse.jpg" alt="" loading="lazy" />
            <div>
              <span className="kicker">
                <Peak />
                {t('Secure portal')}
              </span>
              <p>{t('One login for buyers, makers and logistics partners.')}</p>
            </div>
          </div>
        </LoginForm>
      </div>
    </>
  );
}
