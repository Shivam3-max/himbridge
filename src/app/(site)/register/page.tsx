import type { Metadata } from 'next';
import { PageBar } from '@/components/ui/primitives';
import { SELF_SERVICE_ROLES, type SelfServiceRole } from '@/domain/roles';
import { RegisterForm } from './register-form';
import { BUYER_TYPE_INFO, BUYER_TYPES, type BuyerType } from '@/domain/sourcing';

export const metadata: Metadata = { title: 'Registration' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const role = sp.role;
  // ?as=brands|designers|importers comes from the "Source from India" landing pages.
  const as = String(sp.as ?? '');
  const initialBuyerType: BuyerType = (as && BUYER_TYPES.find((b) => b === as || BUYER_TYPE_INFO[b].slug === as)) || 'importer';
  const nextRaw = String(sp.next ?? '');
  const next = nextRaw.startsWith('/dashboard') && !nextRaw.startsWith('//') ? nextRaw : undefined;
  const initialRole: SelfServiceRole = (SELF_SERVICE_ROLES as readonly string[]).includes(String(role))
    ? (role as SelfServiceRole)
    : 'buyer';
  return (
    <>
      <PageBar
        crumbs={[[null, 'Registration']]}
        title="Create your free account"
        lead="Your account and login are created instantly. Manufacturers then go through KYC verification before they can quote."
      />
      <div className="wrap section" style={{ maxWidth: 900 }}>
        <RegisterForm initialRole={initialRole} initialBuyerType={initialBuyerType} next={next} />
      </div>
    </>
  );
}
