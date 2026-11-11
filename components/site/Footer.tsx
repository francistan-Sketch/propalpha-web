import Link from 'next/link';
import Wordmark from './Wordmark';

export const CONTACT_EMAIL = 'contact@luminaireproptech.com.sg';
export const DISCLAIMER =
  'AI Socrates can make mistakes. Check important figures before relying on them. PropAlpha provides information for illustration only and is not financial, investment, valuation or legal advice.';

const col = { display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 } as const;
const head = { fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--pa-text-3)', fontWeight: 700 } as const;

// Public footer: 4 columns (1.4fr 1fr 1fr 1fr), wordmark, disclaimer, link columns, © line.
export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--pa-border)', background: 'color-mix(in srgb, var(--pa-card) 70%, transparent)' }}>
      <div className="pa-4col" style={{ maxWidth: 'var(--pa-max)', margin: '0 auto', padding: '56px var(--pa-pad) 40px', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Wordmark href={null} />
          <p style={{ color: 'var(--pa-text-2)', fontSize: 14 }}>by Luminaire Proptech, the makers of <a className="pa-link" href="https://www.aurastage.ai" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pa-text)', fontWeight: 600 }}>AuraStage</a></p>
          <p style={{ color: 'var(--pa-text-3)', fontSize: 13, lineHeight: 1.6, maxWidth: 420 }}>{DISCLAIMER}</p>
        </div>
        <div style={col}>
          <span style={head}>Product</span>
          <Link className="pa-link" href="/#features">Features</Link>
          <Link className="pa-link" href="/flyer-maker">Flyer Maker</Link>
          <Link className="pa-link" href="/#market">Market Data</Link>
          <Link className="pa-link" href="/download">Download</Link>
        </div>
        <div style={col}>
          <span style={head}>Platform</span>
          <Link className="pa-link" href="/platform">For agencies &amp; partners</Link>
          <Link className="pa-link" href="/platform#api">Partner data API</Link>
          <Link className="pa-link" href="/login">Sign In</Link>
        </div>
        <div style={col}>
          <span style={head}>Company</span>
          <a className="pa-link" href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          <a className="pa-link" href="https://www.aurastage.ai" target="_blank" rel="noopener noreferrer">AuraStage</a>
          <Link className="pa-link" href="/privacy">Privacy</Link>
          <Link className="pa-link" href="/terms">Terms</Link>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--pa-border)' }}>
        <div style={{ maxWidth: 'var(--pa-max)', margin: '0 auto', padding: '18px var(--pa-pad)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', fontSize: 13, color: 'var(--pa-text-3)' }}>
          <span>© {new Date().getFullYear()} Luminaire Proptech. All rights reserved.</span>
          <span>{CONTACT_EMAIL}</span>
        </div>
      </div>
    </footer>
  );
}
