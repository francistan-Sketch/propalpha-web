import type { Metadata } from 'next';
import { Suspense } from 'react';
import ForgotForm from '@/components/site/ForgotForm';

export const metadata: Metadata = { title: 'Reset your PropAlpha password' };

// Password reset for any account, including Apple and Google sign-ups that never had a password:
// a six-digit code by SMS to the verified mobile or by email, then a new password.
export default function ForgotPage() {
  return (
    <Suspense fallback={null}>
      <ForgotForm />
    </Suspense>
  );
}
