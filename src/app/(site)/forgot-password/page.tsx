import type { Metadata } from 'next';
import { PageBar } from '@/components/ui/primitives';
import { ForgotPasswordForm } from './forgot-form';

export const metadata: Metadata = { title: 'Forgot password' };

export default function ForgotPasswordPage() {
  return (
    <>
      <PageBar
        crumbs={[
          ['/login', 'Login'],
          [null, 'Forgot password'],
        ]}
        title="Forgot Password"
        lead="Enter your registered email. We will send you a secure link to choose a new password."
      />
      <div className="wrap section" style={{ maxWidth: 560 }}>
        <ForgotPasswordForm />
      </div>
    </>
  );
}
