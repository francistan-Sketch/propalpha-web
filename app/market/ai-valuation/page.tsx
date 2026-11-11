'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { getUser, type AuthUser } from '@/lib/auth';
import { BackLink, ErrorBlock, cardStyle, kickerStyle, noteStyle, tableStyle, tdNum, tdStyle, thRight, thStyle } from '@/components/app/market/ui';

// Six-step AI Valuation wizard. The flow and the four backend calls are unchanged:
// GET /valuation/lookup → (contact) POST /valuation/otp/send → POST /valuation/otp/verify → POST /valuation/generate.
// Only the presentation moved to the PropAlpha 2.0 design language.

// ── Types ─────────────────────────────────────────────────────────────────────
interface PropertyInfo {
  found: boolean;
  project_name?: string;
  address?: string;
  area_sqft?: number;
  floor?: number;
  tenure?: string;
  property_type?: string;
  postal_district?: number;
  postal_code?: string;
  category?: string;
  last_transacted?: { date: string; price: number; psf: number };
  message?: string;
}

interface Comparable {
  address: string;
  sale_date: string;
  transacted_price: number;
  unit_price_psf: number;
  area_sqft: number;
  type_of_sale: string;
}

interface ValuationEstimate {
  low: number;
  mid: number;
  high: number;
  avg_psf: number;
  sd_psf: number;
  basis: string;
  sample_count: number;
  confidence: string;
}

interface ValuationResult {
  estimate: ValuationEstimate;
  comparables: Comparable[];
  generated_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return 'S$' + n.toLocaleString('en-SG', { maximumFractionDigits: 0 });
}

function fmtPsf(n: number) {
  return 'S$' + n.toLocaleString('en-SG', { maximumFractionDigits: 0 }) + ' psf';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function confidenceColor(c: string) {
  if (c === 'High')     return { bg: 'color-mix(in srgb, var(--pa-emerald) 18%, transparent)', color: 'var(--pa-emerald)' };
  if (c === 'Moderate') return { bg: 'color-mix(in srgb, var(--pa-amber) 18%, transparent)', color: 'var(--pa-amber)' };
  return                       { bg: 'var(--pa-bg)', color: 'var(--pa-text-2)' };
}

const WHATSAPP_NUMBER = '6591234567'; // TODO: replace with PropAlpha business number

const STEP_LABELS = ['Property', 'Confirm', 'Contact', 'Code', 'Terms', 'Report'];

// ── Styles (from the design's form fields and buttons) ───────────────────────
const inputStyle: CSSProperties = {
  width: '100%', height: 40, padding: '0 12px', borderRadius: 9, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)',
  color: 'var(--pa-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const labelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--pa-text-2)' };

const primaryBtn: CSSProperties = {
  width: '100%', height: 44, borderRadius: 10, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
};

const ghostBtn: CSSProperties = {
  width: '100%', height: 38, borderRadius: 9, border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
};

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...cardStyle, padding: 22, display: 'flex', flexDirection: 'column', gap: 14, ...style }}>{children}</div>;
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--pa-text-3)' }}>{label}</span>
      <strong style={{ fontSize: 14 }}>{value}</strong>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIValuationPage() {
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // The shell only renders its children after mount, so reading localStorage in a lazy initialiser is safe.
  const [user] = useState<AuthUser | null>(() => getUser());
  const hasMobileOnFile = !!(user && (user as { mobile?: string }).mobile);

  // Step 1 — lookup inputs
  const [postal, setPostal]       = useState('');
  const [unitNo, setUnitNo]       = useState('');
  const [property, setProperty]   = useState<PropertyInfo | null>(null);
  // Manual entry fallback
  const [manualArea, setManualArea] = useState('');
  const [manualProject, setManualProject] = useState('');

  // Step 3 — contact (name pre-filled from the signed-in user)
  const [name, setName]           = useState(() => getUser()?.name ?? '');
  const [mobile, setMobile]       = useState('');

  // Step 4 — OTP; a verified number keeps a 30-day session token in localStorage
  const [otp, setOtp]             = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sessionToken, setSessionToken]     = useState(() => {
    try { return localStorage.getItem('valuation_token') ?? ''; } catch { return ''; }
  });

  // Step 5 — disclaimer
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Step 6 — result
  const [result, setResult]       = useState<ValuationResult | null>(null);

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // ── Step 1: Property lookup ─────────────────────────────────────────────────
  async function handleLookup() {
    if (!postal.trim() || !unitNo.trim()) {
      setError('Please enter both postal code and unit number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/valuation/lookup', {
        params: { postal: postal.trim(), unit: unitNo.trim().replace(/^#/, '') },
      });
      setProperty(res.data);
      setStep(2);
    } catch {
      setError('Failed to look up property. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2 → 3 or 5 ─────────────────────────────────────────────────────────
  function handleContinueFromProperty() {
    if (sessionToken) { setStep(5); return; }
    if (hasMobileOnFile) { setStep(5); return; }
    setStep(3);
  }

  // ── Step 3: Send OTP ─────────────────────────────────────────────────────────
  async function handleSendOtp() {
    if (!mobile.trim()) { setError('Please enter your mobile number.'); return; }
    if (!name.trim())   { setError('Please enter your name.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/valuation/otp/send', { mobile: mobile.trim() });
      setStep(4);
      startResendCooldown();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function startResendCooldown() {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { if (cooldownRef.current) clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Step 4: Verify OTP ───────────────────────────────────────────────────────
  async function handleVerifyOtp() {
    if (otp.length !== 6) { setError('Please enter the 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/valuation/otp/verify', {
        mobile: mobile.trim(),
        code: otp.trim(),
        name: name.trim(),
      });
      const token = res.data.token;
      setSessionToken(token);
      localStorage.setItem('valuation_token', token);
      setStep(5);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 5 → 6: Generate valuation ──────────────────────────────────────────
  async function handleGenerate() {
    if (!disclaimerAccepted) return;
    setError('');
    setLoading(true);
    try {
      const area   = property?.area_sqft || parseFloat(manualArea) || 0;
      const proj   = property?.project_name || manualProject;
      const dist   = property?.postal_district;
      const cat    = property?.category || 'resi_strata';

      const res = await api.post('/valuation/generate', {
        token:                sessionToken,
        user_id:              user?.id || null,
        postal_code:          postal,
        unit_no:              unitNo,
        project_name:         proj,
        area_sqft:            area,
        postal_district:      dist,
        category:             cat,
        disclaimer_accepted:  true,
      });
      setResult(res.data.result);
      setStep(6);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error || 'Failed to generate valuation. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1); setProperty(null); setResult(null); setError(''); setPostal(''); setUnitNo(''); setDisclaimerAccepted(false); setOtp('');
  }

  const areaForPsf = property?.area_sqft || parseFloat(manualArea) || 1;
  const narrow: CSSProperties = { width: '100%', maxWidth: step === 6 ? 760 : 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 };

  return (
    <AppLayout title="AI Valuation" subtitle="Indicative only">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1100, width: '100%', margin: '0 auto', minWidth: 0 }}>
        <BackLink />

        <div style={narrow}>
          {/* Header + step indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ ...kickerStyle, color: 'var(--pa-amber)' }}>Report</span>
            <h2 style={{ fontSize: 24 }}>Instant indicative value, from URA transactions.</h2>
            <p style={{ fontSize: 13.5, color: 'var(--pa-text-2)' }}>A report that carries the client&apos;s agent. Six short steps; a verified number is remembered for 30 days.</p>
            <ol style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }} aria-label="Progress">
              {STEP_LABELS.map((l, i) => {
                const n = i + 1;
                const on = n === step, done = n < step;
                return (
                  <li key={l} aria-current={on ? 'step' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ height: 4, borderRadius: 2, background: done || on ? 'var(--pa-primary)' : 'var(--pa-border)', opacity: done ? 0.6 : 1, transition: 'background .3s' }} />
                    <span className="pa-hide-m" style={{ fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: on ? 'var(--pa-text)' : 'var(--pa-text-3)', fontWeight: on ? 700 : 600 }}>{l}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          {error && <ErrorBlock title="That did not go through.">{error}</ErrorBlock>}

          {/* ── STEP 1: Lookup ── */}
          {step === 1 && (
            <Card>
              <div>
                <strong style={{ fontSize: 16, display: 'block' }}>Find the property</strong>
                <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>Postal code and unit number fill in the project, floor area and tenure from PropAlpha&apos;s records.</span>
              </div>
              <label style={labelStyle}>Postal code
                <input style={inputStyle} type="text" inputMode="numeric" placeholder="e.g. 439964" value={postal} onChange={(e) => setPostal(e.target.value)} maxLength={6} />
              </label>
              <label style={labelStyle}>Unit number
                <input style={inputStyle} type="text" placeholder="e.g. 13-06 or #13-06" value={unitNo} onChange={(e) => setUnitNo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }} />
              </label>
              <button type="button" className="pa-btn" style={{ ...primaryBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} onClick={handleLookup} disabled={loading}>
                {loading && <span className="pa-spin" aria-hidden="true" style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff' }} />}
                {loading ? 'Looking up…' : 'Look up the property'}
              </button>
              <span style={noteStyle}>Private non-landed and commercial strata units. HDB flats are not covered yet.</span>
            </Card>
          )}

          {/* ── STEP 2: Property confirmed + teaser ── */}
          {step === 2 && property && (
            <Card>
              {property.found ? (
                <>
                  <span style={{ alignSelf: 'flex-start', display: 'inline-flex', padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', background: 'color-mix(in srgb, var(--pa-emerald) 18%, transparent)', color: 'var(--pa-emerald)' }}>Property found</span>
                  <div>
                    <strong style={{ fontSize: 18, display: 'block' }}>{property.project_name}</strong>
                    <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>{property.address}</span>
                  </div>
                  <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Fact label="Floor area" value={property.area_sqft ? `${property.area_sqft.toLocaleString()} sqft` : '—'} />
                    <Fact label="Floor level" value={property.floor ? `Level ${property.floor}` : '—'} />
                    <Fact label="Tenure" value={property.tenure || '—'} />
                    <Fact label="Type" value={property.property_type || '—'} />
                  </div>
                  {/* Blurred teaser */}
                  <div style={{ position: 'relative', overflow: 'hidden', padding: 20, borderRadius: 14, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)', textAlign: 'center' }}>
                    <span style={{ ...kickerStyle, display: 'block', marginBottom: 6 }}>Estimated market value</span>
                    <strong aria-hidden="true" style={{ display: 'block', fontSize: 36, letterSpacing: '-0.02em', color: 'var(--pa-amber)', filter: 'blur(8px)', userSelect: 'none' }}>S$1.48M</strong>
                    <span aria-hidden="true" style={{ display: 'block', fontSize: 12, color: 'var(--pa-text-3)', marginTop: 6, filter: 'blur(5px)' }}>Verify to unlock your full report</span>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" style={{ color: 'var(--pa-text-2)' }}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                      <span style={{ fontSize: 12, color: 'var(--pa-text-2)', fontWeight: 600 }}>Verify to unlock</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ alignSelf: 'flex-start', display: 'inline-flex', padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', background: 'color-mix(in srgb, var(--pa-amber) 18%, transparent)', color: 'var(--pa-amber)' }}>No record found</span>
                  <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>{property.message || 'Enter the project and floor area to continue with a manual valuation.'}</span>
                  <label style={labelStyle}>Project or development
                    <input style={inputStyle} placeholder="e.g. AMBER HOUSE" value={manualProject} onChange={(e) => setManualProject(e.target.value)} />
                  </label>
                  <label style={labelStyle}>Floor area (sqft)
                    <input style={inputStyle} type="number" inputMode="decimal" placeholder="e.g. 1200" value={manualArea} onChange={(e) => setManualArea(e.target.value)} />
                  </label>
                </>
              )}
              <button type="button" className="pa-btn" style={primaryBtn} onClick={handleContinueFromProperty}>Get the AI valuation</button>
              <button type="button" style={ghostBtn} onClick={() => { setStep(1); setProperty(null); setError(''); }}>Search again</button>
            </Card>
          )}

          {/* ── STEP 3: Contact details ── */}
          {step === 3 && (
            <Card>
              <div>
                <strong style={{ fontSize: 16, display: 'block' }}>Verify your number</strong>
                <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>A one-time code goes to your WhatsApp to unlock the report. Your number is used only for verification.</span>
              </div>
              <label style={labelStyle}>Your name
                <input style={inputStyle} placeholder="e.g. Alex Tan" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label style={labelStyle}>Singapore mobile number
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ ...inputStyle, width: 'auto', display: 'inline-flex', alignItems: 'center', color: 'var(--pa-text-2)', flex: 'none' }}>+65</span>
                  <input style={inputStyle} type="tel" inputMode="numeric" placeholder="9123 4567" value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={8} onKeyDown={(e) => { if (e.key === 'Enter') handleSendOtp(); }} />
                </div>
              </label>
              <button type="button" className="pa-btn" style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSendOtp} disabled={loading}>
                {loading ? 'Sending…' : 'Send code via WhatsApp'}
              </button>
              <button type="button" style={ghostBtn} onClick={() => { setStep(2); setError(''); }}>Back</button>
            </Card>
          )}

          {/* ── STEP 4: OTP Entry ── */}
          {step === 4 && (
            <Card>
              <div>
                <strong style={{ fontSize: 16, display: 'block' }}>Enter the code</strong>
                <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>We sent a 6-digit code to WhatsApp +65 {mobile}. It expires in 10 minutes.</span>
              </div>
              <label style={labelStyle}>Verification code
                <input
                  style={{ ...inputStyle, height: 52, fontSize: 24, letterSpacing: '.3em', textAlign: 'center', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyOtp(); }}
                />
              </label>
              <button type="button" className="pa-btn" style={{ ...primaryBtn, opacity: loading || otp.length !== 6 ? 0.6 : 1, cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer' }} onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying…' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => { if (resendCooldown === 0) { setOtp(''); handleSendOtp(); } }}
                disabled={resendCooldown > 0}
                style={{ ...ghostBtn, border: 0, color: resendCooldown > 0 ? 'var(--pa-text-3)' : 'var(--pa-text-2)', cursor: resendCooldown > 0 ? 'default' : 'pointer' }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </Card>
          )}

          {/* ── STEP 5: Disclaimer ── */}
          {step === 5 && (
            <Card>
              <strong style={{ fontSize: 16 }}>Before the report</strong>
              <div style={{ padding: 16, borderRadius: 12, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)', fontSize: 13, color: 'var(--pa-text-2)', lineHeight: 1.7, maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p>The estimated market value provided by PropAlpha is <strong style={{ color: 'var(--pa-text)' }}>indicative only</strong> and does not constitute a formal property valuation.</p>
                <p>This estimate is derived from recent transaction data sourced from the Urban Redevelopment Authority (URA) and is calculated using a statistical average of comparable transactions. It does not account for the specific condition, renovation, fittings, orientation, facing, or unique characteristics of your property.</p>
                <p><strong style={{ color: 'var(--pa-text)' }}>Luminaire Proptech (Private) Limited (UEN: 202620751D) is not a licensed valuer</strong> under the Appraisers Act (Cap. 16) and this report should not be relied upon for mortgage applications, legal proceedings, insurance purposes, or any financial decision.</p>
                <p>Market conditions may have changed since the last available transaction data. Actual transacted prices may differ materially from this estimate.</p>
                <p>For a formal valuation, please engage a licensed property valuer accredited by the <strong style={{ color: 'var(--pa-text)' }}>Singapore Institute of Surveyors and Valuers (SISV)</strong>.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 13, color: 'var(--pa-text-2)', lineHeight: 1.5 }}>
                <input type="checkbox" checked={disclaimerAccepted} onChange={(e) => setDisclaimerAccepted(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: 'var(--pa-primary)', flex: 'none' }} />
                I understand this is an indicative estimate only and not a formal property valuation.
              </label>
              <button
                type="button" className="pa-btn"
                style={{ ...primaryBtn, opacity: disclaimerAccepted && !loading ? 1 : 0.45, cursor: disclaimerAccepted && !loading ? 'pointer' : 'not-allowed' }}
                onClick={handleGenerate} disabled={!disclaimerAccepted || loading}
              >
                {loading && <span className="pa-spin" aria-hidden="true" style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff' }} />}
                {loading ? 'Generating…' : 'Unlock the AI valuation'}
              </button>
            </Card>
          )}

          {/* ── STEP 6: Full Report ── */}
          {step === 6 && result && (
            <>
              <Card style={{ gap: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={kickerStyle}>AI Valuation report</span>
                    <strong style={{ fontSize: 20, letterSpacing: '-0.02em' }}>{property?.project_name || manualProject}</strong>
                    <span style={{ fontSize: 13, color: 'var(--pa-text-2)' }}>
                      {property?.address || `${postal} #${unitNo}`}
                      {property?.area_sqft ? ` · ${property.area_sqft.toLocaleString()} sqft` : ''}
                    </span>
                  </div>
                  {(() => {
                    const c = confidenceColor(result.estimate.confidence);
                    return <span style={{ display: 'inline-flex', padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', background: c.bg, color: c.color }}>{result.estimate.confidence} confidence</span>;
                  })()}
                </div>

                <div className="pa-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Low', value: result.estimate.low, hi: false },
                    { label: 'Estimated value', value: result.estimate.mid, hi: true },
                    { label: 'High', value: result.estimate.high, hi: false },
                  ].map(({ label, value, hi }) => (
                    <div key={label} style={{ padding: 16, borderRadius: 12, border: `1px solid ${hi ? 'var(--pa-primary)' : 'var(--pa-border)'}`, background: hi ? 'color-mix(in srgb, var(--pa-primary) 14%, transparent)' : 'var(--pa-bg)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ ...kickerStyle, color: hi ? 'var(--pa-text-2)' : 'var(--pa-text-3)' }}>{label}</span>
                      <strong style={{ fontSize: hi ? 26 : 17, letterSpacing: '-0.02em', color: hi ? 'var(--pa-amber)' : 'var(--pa-text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(value)}</strong>
                      <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>{fmtPsf(Math.round(value / areaForPsf))}</span>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--pa-border)', background: 'var(--pa-bg)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 13, color: 'var(--pa-text-2)' }}>
                  <span>Based on <strong style={{ color: 'var(--pa-text)' }}>{result.estimate.sample_count} transactions</strong> · {result.estimate.basis}</span>
                  <span>Avg {fmtPsf(result.estimate.avg_psf)}</span>
                </div>
              </Card>

              {result.comparables.length > 0 && (
                <div style={{ ...cardStyle, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--pa-border)' }}><strong style={{ fontSize: 14 }}>Comparable transactions</strong></div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Address</th>
                          <th style={thStyle}>Date</th>
                          <th style={thRight}>Price</th>
                          <th style={thRight}>psf</th>
                          <th style={thRight}>Area sqft</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.comparables.map((c, i) => (
                          <tr key={i} className="pa-row">
                            <td style={{ ...tdStyle, whiteSpace: 'normal', minWidth: 160 }}>{c.address}</td>
                            <td style={{ ...tdStyle, color: 'var(--pa-text-2)' }}>{fmtDate(c.sale_date)}</td>
                            <td style={{ ...tdNum, fontWeight: 600 }}>{fmt(c.transacted_price)}</td>
                            <td style={{ ...tdNum, color: 'var(--pa-amber)', fontWeight: 700 }}>{fmtPsf(c.unit_price_psf)}</td>
                            <td style={{ ...tdNum, color: 'var(--pa-text-2)' }}>{c.area_sqft?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '10px 14px', ...noteStyle }}>Comparables from PropAlpha&apos;s transaction database as at the latest URA release.</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a
                  className="pa-btn"
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi PropAlpha, I just got an AI Valuation for ${property?.project_name || manualProject}. I'd like to know more.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, minWidth: 200, height: 44, borderRadius: 10, background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  Chat with PropAlpha on WhatsApp
                </a>
                <button type="button" className="pa-btn" onClick={reset} style={{ flex: 1, minWidth: 160, height: 44, borderRadius: 10, border: '1px solid var(--pa-border)', background: 'transparent', color: 'var(--pa-text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Value another property
                </button>
              </div>

              <p style={{ ...noteStyle, lineHeight: 1.6, textAlign: 'center' }}>
                This AI valuation is issued by Luminaire Proptech (Private) Limited (UEN: 202620751D).
                Indicative only, not a formal valuation under the Appraisers Act (Cap. 16).
                Not for use in mortgage applications, legal proceedings, or financial decisions.
                Generated on {new Date(result.generated_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </p>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
