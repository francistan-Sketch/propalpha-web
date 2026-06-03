'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';

// ── Stamp duty calculations (2024 rates) ──────────────────────────────────────

function calcBSD(price: number): number {
  // 1% on first $180k, 2% on next $180k, 3% on next $640k, 4% on next $500k, 5% on next $1.5M, 6% above
  const brackets = [
    { limit: 180_000, rate: 0.01 },
    { limit: 180_000, rate: 0.02 },
    { limit: 640_000, rate: 0.03 },
    { limit: 500_000, rate: 0.04 },
    { limit: 1_500_000, rate: 0.05 },
    { limit: Infinity, rate: 0.06 },
  ];
  let remaining = price;
  let tax = 0;
  for (const b of brackets) {
    const chunk = Math.min(remaining, b.limit);
    tax += chunk * b.rate;
    remaining -= chunk;
    if (remaining <= 0) break;
  }
  return tax;
}

type BuyerType = 'sc1' | 'sc2' | 'sc3' | 'pr1' | 'pr2' | 'foreigner';

function calcABSD(price: number, buyerType: BuyerType): number {
  const rates: Record<BuyerType, number> = {
    sc1: 0,
    sc2: 0.20,
    sc3: 0.30,
    pr1: 0.05,
    pr2: 0.30,
    foreigner: 0.60,
  };
  return price * (rates[buyerType] ?? 0);
}

function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-SG');
}

const BUYER_OPTIONS = [
  { value: 'sc1', label: 'Singapore Citizen — 1st property' },
  { value: 'sc2', label: 'Singapore Citizen — 2nd property' },
  { value: 'sc3', label: 'Singapore Citizen — 3rd+ property' },
  { value: 'pr1', label: 'Permanent Resident — 1st property' },
  { value: 'pr2', label: 'Permanent Resident — 2nd+ property' },
  { value: 'foreigner', label: 'Foreigner' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function ComingSoonCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '24px',
      opacity: 0.7,
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '12px' }}>{description}</p>
      <span style={{
        fontSize: '11px',
        padding: '3px 8px',
        borderRadius: '4px',
        backgroundColor: 'rgba(245,158,11,0.15)',
        color: 'var(--gold)',
        fontWeight: 600,
        letterSpacing: '0.05em',
      }}>
        MOBILE APP
      </span>
    </div>
  );
}

function BuyerCalculator() {
  const [priceStr, setPriceStr] = useState('');
  const [buyerType, setBuyerType] = useState<BuyerType>('sc1');
  const [result, setResult] = useState<{ bsd: number; absd: number; total: number } | null>(null);

  function calculate() {
    const price = parseFloat(priceStr.replace(/,/g, ''));
    if (!price || price <= 0) return;
    const bsd = calcBSD(price);
    const absd = calcABSD(price, buyerType);
    setResult({ bsd, absd, total: bsd + absd });
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--surface2)',
    color: 'var(--text)',
    fontSize: '14px',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block' as const,
    color: 'var(--muted)',
    fontSize: '12px',
    marginBottom: '5px',
    fontWeight: 500 as const,
  };

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '24px',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧮</div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
        Buyer Stamp Duty Calculator
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
        BSD + ABSD based on 2024 Singapore rates.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
        <div>
          <label style={labelStyle}>Property Price (SGD)</label>
          <input
            type="text"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            placeholder="e.g. 1500000"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Buyer Profile</label>
          <select
            value={buyerType}
            onChange={(e) => setBuyerType(e.target.value as BuyerType)}
            style={inputStyle}
          >
            {BUYER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={calculate}
        style={{
          padding: '11px 24px',
          borderRadius: '9px',
          border: 'none',
          backgroundColor: 'var(--accent)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '20px',
          width: '100%',
        }}
      >
        Calculate
      </button>

      {result && (
        <div style={{
          backgroundColor: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Buyer&apos;s Stamp Duty (BSD)</span>
            <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '13px' }}>{fmt(result.bsd)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Additional BSD (ABSD)</span>
            <span style={{ color: result.absd > 0 ? '#f87171' : 'var(--green)', fontWeight: 600, fontSize: '13px' }}>
              {result.absd === 0 ? 'Nil' : fmt(result.absd)}
            </span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 700 }}>Total Stamp Duty</span>
            <span style={{ color: 'var(--accent)', fontSize: '16px', fontWeight: 700 }}>{fmt(result.total)}</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '10px' }}>
            * Indicative only. BSD rates: 1% up to $180k, 2% next $180k, 3% next $640k, 4% next $500k, 5% next $1.5M, 6% above. ABSD rates per buyer profile. Verify with IRAS.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  return (
    <AppLayout>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
          Agent Tools
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>
          Productivity tools for Singapore real estate professionals.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
          alignItems: 'start',
        }}>
          {/* CEA Forms — mobile only */}
          <ComingSoonCard
            icon="📜"
            title="CEA Forms"
            description="Form 5 — Exclusive Agency Agreement — PDF generation. Available on the PropAlpha mobile app."
          />

          {/* Buyer Calculator — inline */}
          <BuyerCalculator />

          {/* Tenancy — mobile only */}
          <ComingSoonCard
            icon="🏠"
            title="Tenancy Agreement"
            description="Generate LOI &amp; TA documents, room inventory reports, and tenancy summaries. Available on the PropAlpha mobile app."
          />
        </div>
      </div>
    </AppLayout>
  );
}
