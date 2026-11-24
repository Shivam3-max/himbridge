import type { Metadata } from 'next';
import { PageBar } from '@/components/ui/primitives';
import { SELF_SERVICE_ROLES, type SelfServiceRole } from '@/domain/roles';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Registration' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const role = (await searchParams).role;
  const initialRole: SelfServiceRole = (SELF_SERVICE_ROLES as readonly string[]).includes(String(role))
    ? (role as SelfServiceRole)
    : 'buyer';
  return (
    <>
      <PageBar
        crumbs={[[null, 'Registration']]}
        title="New Registration"
        lead="Choose your account type. Manufacturers go through KYC verification before they can quote."
      />
      <div className="wrap section" style={{ maxWidth: 900 }}>
        <RegisterForm initialRole={initialRole} />
      </div>
    </>
  );
}
