import type { Metadata } from 'next';
import AppLayout from '@/components/AppLayout';
import FlyerWizard from '@/components/app/flyer/FlyerWizard';

export const metadata: Metadata = { title: 'Flyer Maker · PropAlpha' };

export default function FlyerPage() {
  return (
    <AppLayout title="Flyer Maker" subtitle="URA data to Oct 2026">
      <FlyerWizard />
    </AppLayout>
  );
}
