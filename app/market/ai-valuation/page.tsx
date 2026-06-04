'use client';

import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

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
  if (c === 'High')       return { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80' };
  if (c === 'Moderate')   return { bg: 'rgba(234,179,8,0.15)',  color: '#fbbf24' };
  return                         { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' };
}

const WHATSAPP_NUMBER = '6591234567'; // TODO: replace with PropAlpha business number

// ── Input style ───────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  backgroundColor: 'var(--surface2)',
  color: 'var(--text)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--muted)',
  fontSize: '13px',
  marginBottom: '6px',
  fontWeight: 500,
};

// ── Main component ────────────────────────────────────────────────────────────
export default function AIValuationPage() {
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Step 1 — lookup inputs
  const [postal, setPostal]       = useState('');
  const [unitNo, setUnitNo]       = useState('');
  const [property, setProperty]   = useState<PropertyInfo | null>(null);
  // Manual entry fallback
  const [manualArea, setManualArea] = useState('');
  const [manualProject, setManualProject] = useState('');

  // Step 3 — contact
  const [name, setName]           = useState('');
  const [mobile, setMobile]       = useState('');

  // Step 4 — OTP
  const [otp, setOtp]             = useState('');
  const [otpSent, setOtpSent]     = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sessionToken, setSessionToken]     = useState('');

  // Step 5 — disclaimer
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Step 6 — result
  const [result, setResult]       = useState<ValuationResult | null>(null);

  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing 30-day session token in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('valuation_token');
    if (stored) setSessionToken(stored);

    // Pre-fill name from logged-in user
    const user = getUser();
    if (user?.name) setName(user.name);
  }, []);

  // Determine if OTP step can be skipped (logged-in user with mobile on file)
  const user = typeof window !== 'undefined' ? getUser() : null;
  const hasMobileOnFile = !!(user && (user as { mobile?: string }).mobile);

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
    // Check if we have a valid 30-day session token
    if (sessionToken) {
      setStep(5);
      return;
    }
    // Logged-in user with mobile on file → skip OTP
    if (hasMobileOnFile) {
      setStep(5);
      return;
    }
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
      setOtpSent(true);
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
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
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

  // ── Render steps ─────────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '18px',
    padding: '36px',
    maxWidth: '560px',
    width: '100%',
    margin: '0 auto',
  };

  const btnPrimary: React.CSSProperties = {
    width: '100%',
    padding: '13px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'var(--accent)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    marginTop: '8px',
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '12px' }}>

        {/* Header */}
        <div style={{ width: '100%', maxWidth: '560px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px' }}>🤖</span>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)' }}>
              AI Valuation
            </h1>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
            Instant indicative market value powered by URA transaction data.
          </p>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
            {[1,2,3,4,5,6].map((s) => (
              <div key={s} style={{
                height: '4px',
                flex: 1,
                borderRadius: '2px',
                backgroundColor: s <= step ? 'var(--accent)' : 'var(--border)',
                transition: 'background-color 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            width: '100%', maxWidth: '560px', marginBottom: '16px',
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', padding: '10px 16px',
            color: '#f87171', fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* ── STEP 1: Lookup ── */}
        {step === 1 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Find your property
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px' }}>
              Enter your postal code and unit number to auto-populate your property details.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Postal Code</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="e.g. 439964"
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
                maxLength={6}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Unit Number</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="e.g. 13-06 or #13-06"
                value={unitNo}
                onChange={(e) => setUnitNo(e.target.value)}
              />
            </div>

            <button style={btnPrimary} onClick={handleLookup} disabled={loading}>
              {loading ? 'Looking up…' : 'Look Up My Property →'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Property confirmed + teaser ── */}
        {step === 2 && property && (
          <div style={cardStyle}>
            {property.found ? (
              <>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '20px',
                  backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80',
                  fontSize: '12px', fontWeight: 700, marginBottom: '20px',
                }}>
                  ✓ Property found
                </div>

                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                  {property.project_name}
                </h2>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
                  {property.address}
                </p>

                {/* Property details grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '12px', marginBottom: '24px',
                }}>
                  {[
                    { label: 'Floor Area', value: `${property.area_sqft?.toLocaleString()} sqft` },
                    { label: 'Floor Level', value: property.floor ? `${property.floor}th floor` : '—' },
                    { label: 'Tenure', value: property.tenure || '—' },
                    { label: 'Type', value: property.property_type || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      backgroundColor: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px', padding: '12px 14px',
                    }}>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Blurred teaser */}
                <div style={{
                  backgroundColor: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '20px',
                  textAlign: 'center', marginBottom: '24px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                    Estimated Market Value
                  </div>
                  <div style={{
                    fontSize: '36px', fontWeight: 800, color: 'var(--text)',
                    filter: 'blur(8px)', userSelect: 'none',
                    letterSpacing: '-0.02em',
                  }}>
                    S$1.48M
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px', filter: 'blur(5px)' }}>
                    Verify to unlock your full report
                  </div>
                  {/* Lock overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: '6px',
                  }}>
                    <span style={{ fontSize: '24px' }}>🔒</span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                      Verify to unlock
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* Not found — manual entry */
              <>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '20px',
                  backgroundColor: 'rgba(234,179,8,0.12)', color: '#fbbf24',
                  fontSize: '12px', fontWeight: 700, marginBottom: '20px',
                }}>
                  ⚠ No record found — enter details manually
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
                  {property.message}
                </p>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Project / Development Name</label>
                  <input style={inputStyle} placeholder="e.g. AMBER HOUSE" value={manualProject} onChange={(e) => setManualProject(e.target.value)} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Floor Area (sqft)</label>
                  <input style={inputStyle} type="number" placeholder="e.g. 1200" value={manualArea} onChange={(e) => setManualArea(e.target.value)} />
                </div>
              </>
            )}

            <button style={btnPrimary} onClick={handleContinueFromProperty}>
              Get My AI Valuation →
            </button>

            <button
              onClick={() => { setStep(1); setProperty(null); setError(''); }}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: 'transparent', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer', marginTop: '8px' }}
            >
              ← Search again
            </button>
          </div>
        )}

        {/* ── STEP 3: Contact details ── */}
        {step === 3 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Verify your identity
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px' }}>
              We'll send a one-time code to your WhatsApp to unlock your valuation report.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Your name</label>
              <input style={inputStyle} placeholder="e.g. Francis Tan" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={labelStyle}>Singapore mobile number</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{
                  padding: '11px 14px', borderRadius: '10px',
                  border: '1px solid var(--border)', backgroundColor: 'var(--surface2)',
                  color: 'var(--muted)', fontSize: '14px', flexShrink: 0,
                }}>
                  +65
                </div>
                <input
                  style={{ ...inputStyle }}
                  type="tel"
                  placeholder="9123 4567"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  maxLength={8}
                />
              </div>
            </div>

            <p style={{ color: 'var(--muted)', fontSize: '12px', marginBottom: '24px' }}>
              A 6-digit OTP will be sent via WhatsApp. Your number is used only for verification.
            </p>

            <button style={btnPrimary} onClick={handleSendOtp} disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP via WhatsApp →'}
            </button>
          </div>
        )}

        {/* ── STEP 4: OTP Entry ── */}
        {step === 4 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Enter your OTP
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px' }}>
              We sent a 6-digit code to your WhatsApp (+65 {mobile}). It expires in 10 minutes.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Verification code</label>
              <input
                style={{ ...inputStyle, fontSize: '24px', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 700 }}
                type="text"
                inputMode="numeric"
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            </div>

            <button style={btnPrimary} onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying…' : 'Verify →'}
            </button>

            <button
              onClick={() => { if (resendCooldown === 0) { setOtp(''); handleSendOtp(); } }}
              disabled={resendCooldown > 0}
              style={{
                width: '100%', padding: '10px', border: 'none',
                backgroundColor: 'transparent',
                color: resendCooldown > 0 ? 'var(--muted)' : 'var(--accent)',
                fontSize: '13px', cursor: resendCooldown > 0 ? 'default' : 'pointer', marginTop: '8px',
              }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>
        )}

        {/* ── STEP 5: Disclaimer ── */}
        {step === 5 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
              AI Valuation Disclaimer
            </h2>

            <div style={{
              backgroundColor: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px',
              fontSize: '13px', color: 'var(--muted)',
              lineHeight: 1.7, marginBottom: '24px',
              maxHeight: '300px', overflowY: 'auto',
            }}>
              <p style={{ marginBottom: '12px' }}>
                The estimated market value provided by PropAlpha is <strong style={{ color: 'var(--text)' }}>indicative only</strong> and does not constitute a formal property valuation.
              </p>
              <p style={{ marginBottom: '12px' }}>
                This estimate is derived from recent transaction data sourced from the Urban Redevelopment Authority (URA) and is calculated using a statistical average of comparable transactions. It does not account for the specific condition, renovation, fittings, orientation, facing, or unique characteristics of your property.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: 'var(--text)' }}>Luminaire Proptech (Private) Limited (UEN: 202620751D) is not a licensed valuer</strong> under the Appraisers Act (Cap. 16) and this report should not be relied upon for mortgage applications, legal proceedings, insurance purposes, or any financial decision.
              </p>
              <p style={{ marginBottom: '12px' }}>
                Market conditions may have changed since the last available transaction data. Actual transacted prices may differ materially from this estimate.
              </p>
              <p>
                For a formal valuation, please engage a licensed property valuer accredited by the <strong style={{ color: 'var(--text)' }}>Singapore Institute of Surveyors and Valuers (SISV)</strong>.
              </p>
            </div>

            {/* Checkbox */}
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              cursor: 'pointer', marginBottom: '24px',
            }}>
              <div
                onClick={() => setDisclaimerAccepted(!disclaimerAccepted)}
                style={{
                  width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0, marginTop: '1px',
                  border: `2px solid ${disclaimerAccepted ? 'var(--accent)' : 'var(--border)'}`,
                  backgroundColor: disclaimerAccepted ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', cursor: 'pointer',
                }}
              >
                {disclaimerAccepted && <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                I understand this is an indicative estimate only and not a formal property valuation.
              </span>
            </label>

            <button
              style={{ ...btnPrimary, opacity: disclaimerAccepted && !loading ? 1 : 0.4, cursor: disclaimerAccepted && !loading ? 'pointer' : 'not-allowed' }}
              onClick={handleGenerate}
              disabled={!disclaimerAccepted || loading}
            >
              {loading ? 'Generating…' : '🤖 Unlock My AI Valuation →'}
            </button>
          </div>
        )}

        {/* ── STEP 6: Full Report ── */}
        {step === 6 && result && (
          <div style={{ width: '100%', maxWidth: '680px' }}>
            {/* Report header */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '18px', padding: '28px 32px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    AI Valuation Report
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>
                    {property?.project_name || manualProject}
                  </h2>
                  <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
                    {property?.address || `${postal} #${unitNo}`}
                    {property?.area_sqft && ` · ${property.area_sqft.toLocaleString()} sqft`}
                  </p>
                </div>
                {/* Confidence badge */}
                {(() => {
                  const c = confidenceColor(result.estimate.confidence);
                  return (
                    <span style={{
                      padding: '5px 14px', borderRadius: '20px',
                      backgroundColor: c.bg, color: c.color,
                      fontSize: '12px', fontWeight: 700,
                    }}>
                      {result.estimate.confidence} confidence
                    </span>
                  );
                })()}
              </div>

              {/* Value range */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px', marginBottom: '20px',
              }}>
                {[
                  { label: 'Low', value: result.estimate.low, muted: true },
                  { label: 'Estimated Value', value: result.estimate.mid, highlight: true },
                  { label: 'High', value: result.estimate.high, muted: true },
                ].map(({ label, value, highlight, muted }) => (
                  <div key={label} style={{
                    backgroundColor: highlight ? 'rgba(79,142,247,0.1)' : 'var(--surface2)',
                    border: `1px solid ${highlight ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '12px', padding: '16px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: highlight ? 'var(--accent)' : 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: highlight ? '22px' : '16px', fontWeight: 800, color: muted ? 'var(--muted)' : 'var(--text)', letterSpacing: '-0.02em' }}>
                      {fmt(value)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                      {fmtPsf(Math.round(value / (property?.area_sqft || parseFloat(manualArea) || 1)))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Basis */}
              <div style={{
                backgroundColor: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                  📊 Based on <strong style={{ color: 'var(--text)' }}>{result.estimate.sample_count} transactions</strong> — {result.estimate.basis}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Avg PSF: {fmtPsf(result.estimate.avg_psf)}
                </span>
              </div>
            </div>

            {/* Comparable transactions */}
            {result.comparables.length > 0 && (
              <div style={{
                backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '18px', padding: '24px 28px', marginBottom: '16px',
              }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
                  Comparable Transactions
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr>
                        {['Address', 'Date', 'Price', 'PSF', 'Area (sqft)'].map((h) => (
                          <th key={h} style={{
                            textAlign: 'left', padding: '8px 12px',
                            color: 'var(--muted)', fontWeight: 600,
                            borderBottom: '1px solid var(--border)',
                            fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparables.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--surface2)'}
                          onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '10px 12px', color: 'var(--text)' }}>{c.address}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtDate(c.sale_date)}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(c.transacted_price)}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtPsf(c.unit_price_psf)}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{c.area_sqft?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi PropAlpha, I just got an AI Valuation for ${property?.project_name || manualProject}. I'd like to know more.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, minWidth: '200px',
                  padding: '14px 20px', borderRadius: '12px',
                  backgroundColor: '#25D366', color: '#fff',
                  fontSize: '14px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  textDecoration: 'none', transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85'}
                onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
              >
                💬 Chat with PropAlpha
              </a>

              {/* Redo valuation */}
              <button
                onClick={() => { setStep(1); setProperty(null); setResult(null); setError(''); setPostal(''); setUnitNo(''); setDisclaimerAccepted(false); }}
                style={{
                  flex: 1, minWidth: '160px',
                  padding: '14px 20px', borderRadius: '12px',
                  border: '1px solid var(--border)', backgroundColor: 'transparent',
                  color: 'var(--muted)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Value another property
              </button>
            </div>

            {/* Disclaimer footer */}
            <p style={{
              color: 'var(--muted)', fontSize: '11px', marginTop: '20px',
              lineHeight: 1.6, textAlign: 'center',
            }}>
              This AI valuation is issued by Luminaire Proptech (Private) Limited (UEN: 202620751D).
              Indicative only — not a formal valuation under the Appraisers Act (Cap. 16).
              Not for use in mortgage applications, legal proceedings, or financial decisions.
              Generated on {new Date(result.generated_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
