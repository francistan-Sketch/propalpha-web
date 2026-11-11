import type { Metadata } from 'next';
import Nav from '@/components/site/Nav';
import Footer, { CONTACT_EMAIL, DISCLAIMER } from '@/components/site/Footer';

export const metadata: Metadata = {
  title: 'Terms — PropAlpha',
  description: 'PropAlpha terms of use.',
};

// Placeholder until the terms text is supplied. Deliberately contains no policy wording.
export default function TermsPage() {
  return (
    <div className="pa-page">
      <Nav />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(56px,8vw,112px) var(--pa-pad) var(--pa-sec)', display: 'flex', flexDirection: 'column', gap: 24, minHeight: '50vh' }}>
        <h1 style={{ fontSize: 'clamp(32px,4vw,52px)' }}>Terms</h1>
        <p style={{ fontSize: 16, color: 'var(--pa-text-2)', lineHeight: 1.6 }}>{DISCLAIMER}</p>
        <p style={{ fontSize: 15, color: 'var(--pa-text-3)', lineHeight: 1.6, overflowWrap: 'anywhere' }}>
          Full policy text to follow; contact <a className="pa-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with any question.
        </p>
      </main>
      <Footer />
    </div>
  );
}
