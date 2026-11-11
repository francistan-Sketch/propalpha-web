'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowRight } from '@/components/site/ui';
import { CONTACT_EMAIL } from '@/components/site/Footer';

const field: CSSProperties = {
  height: 48, padding: '0 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.25)',
  background: 'rgba(255,255,255,.1)', color: '#fff',
};

/**
 * The Platform contact form. There is no backend endpoint yet: on submit it opens a prefilled mailto to
 * contact@luminaireproptech.com.sg with the fields in the body, then swaps the button label as the design does.
 */
export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState('');

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const subject = 'Integrating PropAlpha';
    const body = [
      `Name: ${name}`,
      `Agency or company: ${company}`,
      `Website: ${website}`,
      '',
      'What would you like to integrate?',
      message,
    ].join('\n');
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input placeholder="Your name" aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} style={field} />
      <input placeholder="Agency or company" aria-label="Agency or company" value={company} onChange={(e) => setCompany(e.target.value)} style={field} />
      <input placeholder="Website" aria-label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} style={field} />
      <textarea
        placeholder="What would you like to integrate?"
        aria-label="What would you like to integrate?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ minHeight: 96, padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.1)', color: '#fff', resize: 'vertical' }}
      />
      <button
        className="pa-btn"
        type="submit"
        style={{ height: 50, borderRadius: 12, border: 0, background: '#fff', color: 'var(--pa-deep-1)', fontWeight: 800, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}
      >
        {sent ? 'Thanks, we will be in touch' : 'Send'}
        <ArrowRight />
      </button>
    </form>
  );
}
