'use client';

import { useEffect, useRef, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { BackLink } from '@/components/app/market/ui';
import { Field, FormSection, ToggleGroup } from '@/components/app/valuation/Field';
import { PRINT_CSS, ValuationResults, type ResultsStatus } from '@/components/app/valuation/ValuationResults';
import {
  ASSET_CLASSES, DEFAULT_FORM, applyPreset, computeValuation, isValuationError, moneyFull, pct, toInputs,
  type AssetClass, type ValuationForm, type ValuationResult,
} from '@/lib/valuation';

// Income Valuation (Tech Tools): inputs on the left, results on the right, computed entirely in the browser
// from lib/valuation.ts (the same maths as the mobile screen). "Generate PDF report" prints the results column.

type FieldKey = keyof ValuationForm;

/** Which input a blocking error belongs to, so the red border lands on the right field. */
function errorField(message: string, mode: ValuationForm['mode']): FieldKey[] {
  if (message.startsWith('Enter the area')) return mode === 'build' ? ['area', 'rent'] : ['noi'];
  if (message.startsWith('Enter a positive annual NOI')) return ['noi'];
  if (message.startsWith('Enter a going-in cap')) return ['cap'];
  return [];
}

export default function IncomeValuationPage() {
  const [form, setForm] = useState<ValuationForm>(DEFAULT_FORM);
  // The illustrative defaults are valid, so the page opens on results (as the mobile screen and the design do).
  const [result, setResult] = useState<ValuationResult | null>(() => {
    const r = computeValuation(toInputs(DEFAULT_FORM));
    return isValuationError(r) ? null : r;
  });
  // The inputs the current result was computed from; the report prints these, not the live edits.
  const [runForm, setRunForm] = useState<ValuationForm>(DEFAULT_FORM);
  const [status, setStatus] = useState<ResultsStatus>(result ? 'results' : 'empty');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorFields, setErrorFields] = useState<FieldKey[]>([]);
  const [stale, setStale] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function set<K extends FieldKey>(key: K, value: ValuationForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setStale(status === 'results');
    if (errorFields.includes(key)) setErrorFields((e) => e.filter((k) => k !== key));
  }

  function pickAsset(asset: AssetClass) {
    setForm((f) => applyPreset(f, asset));
    setStale(status === 'results');
  }

  function calculate() {
    if (timer.current) clearTimeout(timer.current);
    const r = computeValuation(toInputs(form));
    if (isValuationError(r)) {
      setErrorMessage(r.errors[0]);
      setErrorFields(r.errors.flatMap((m) => errorField(m, form.mode)));
      setStatus('error');
      setStale(false);
      return;
    }
    setErrorFields([]);
    setStale(false);
    setStatus('calculating');
    const snapshot = form;
    timer.current = setTimeout(() => { setResult(r); setRunForm(snapshot); setStatus('results'); }, 450);
  }

  function clearAll() {
    if (timer.current) clearTimeout(timer.current);
    setForm({ ...applyPreset(DEFAULT_FORM, form.asset), noi: '', name: '', preparedFor: '' });
    setResult(null);
    setErrorFields([]);
    setStale(false);
    setStatus('empty');
  }

  const err = (k: FieldKey) => (errorFields.includes(k) ? 'Enter a positive amount.' : undefined);
  const live = computeValuation(toInputs(form));
  const liveOk = !isValuationError(live);
  const assetLabel = ASSET_CLASSES.find((a) => a.value === form.asset)?.label ?? 'Commercial';

  return (
    <AppLayout title="Income Valuation" subtitle="Direct cap · DCF · IRR">
      <style>{PRINT_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
        <BackLink href="/tools">Tech Tools</BackLink>

        <div className="pa-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.9fr) minmax(0,1.1fr)', gap: 20, alignItems: 'start' }}>
          <form
            onSubmit={(e) => { e.preventDefault(); calculate(); }}
            style={{ border: '1px solid var(--pa-border)', borderRadius: 16, background: 'var(--pa-card)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <strong style={{ fontSize: 15 }}>Inputs</strong>
              <button type="button" onClick={clearAll} style={{ border: 0, background: 'transparent', color: 'var(--pa-text-3)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Clear</button>
            </div>

            <ToggleGroup ariaLabel="Asset class" options={ASSET_CLASSES} value={form.asset} onChange={pickAsset} />
            <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>Switching class reloads illustrative starting assumptions. Every number is editable.</span>

            <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Property" kind="text" value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Tampines Retail Unit" />
              <Field label="Prepared for" kind="text" value={form.preparedFor} onChange={(v) => set('preparedFor', v)} placeholder="Client name" />
            </div>

            <FormSection title="Income (NOI)">
              <ToggleGroup ariaLabel="NOI mode" options={[{ value: 'noi' as const, label: 'Enter NOI' }, { value: 'build' as const, label: 'Build up from rent' }]} value={form.mode} onChange={(v) => set('mode', v)} />
            </FormSection>
            {form.mode === 'noi' ? (
              <Field label="Annual NOI" kind="money" value={form.noi} onChange={(v) => set('noi', v)} suffix="$ / yr" placeholder="100k" error={err('noi')} hint="Accepts 100k, 2.5m or 100,000." />
            ) : (
              <>
                <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Lettable area" kind="money" value={form.area} onChange={(v) => set('area', v)} suffix="sqft" placeholder="10,000" error={err('area')} />
                  <Field label="Rent" kind="money" value={form.rent} onChange={(v) => set('rent', v)} suffix="$ psf/mth" placeholder="6.00" error={err('rent')} />
                  <Field label="Other income" kind="money" value={form.other} onChange={(v) => set('other', v)} suffix="$ / yr" placeholder="0" />
                  <Field label="Vacancy" value={form.vacancy} onChange={(v) => set('vacancy', v)} suffix="%" />
                </div>
                <Field label="Operating expenses" value={form.opex} onChange={(v) => set('opex', v)} suffix="% of EGI" hint="Property tax, maintenance, management, insurance." />
                {liveOk && live.build && (
                  <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--pa-bg)', border: '1px solid var(--pa-border)', fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 3, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--pa-text-2)' }}>Gross rent</span><span>{moneyFull(live.build.gpr)}</span></span>
                    <span style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--pa-text-2)' }}>Effective income</span><span>{moneyFull(live.build.egi)}</span></span>
                    <span style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}><span>NOI</span><span style={{ color: 'var(--pa-amber)' }}>{moneyFull(live.build.noi)}</span></span>
                  </div>
                )}
              </>
            )}

            <FormSection title="Direct capitalisation" />
            <Field label="Cap rate" value={form.cap} onChange={(v) => set('cap', v)} suffix="%" error={err('cap')} hint={liveOk ? `${moneyFull(live.noi)} ÷ ${pct(toInputs(form).cap)} = ${moneyFull(live.direct.value)}` : undefined} />

            <FormSection title="DCF & exit" />
            <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="NOI growth p.a." value={form.growth} onChange={(v) => set('growth', v)} suffix="%" />
              <Field label="Holding period" value={form.years} onChange={(v) => set('years', v)} suffix="years" />
              <Field label="Discount rate" value={form.discount} onChange={(v) => set('discount', v)} suffix="%" />
              <Field label="Exit cap rate" value={form.exitCap} onChange={(v) => set('exitCap', v)} suffix="%" hint="Usually at or above the going-in cap rate." />
              <Field label="Sale costs" value={form.saleCost} onChange={(v) => set('saleCost', v)} suffix="%" />
              <Field label="Remaining lease" value={form.lease} onChange={(v) => set('lease', v)} suffix="years" placeholder="blank = freehold" />
            </div>
            <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)', lineHeight: 1.4 }}>Leasehold income stops at expiry; no sale value is assumed if the lease ends inside the holding period.</span>

            <FormSection title="Investment (IRR)">
              <ToggleGroup ariaLabel="Financing" options={[{ value: false, label: 'All equity' }, { value: true, label: 'With loan' }]} value={form.financed} onChange={(v) => set('financed', v)} />
            </FormSection>
            <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Purchase price" kind="money" value={form.price} onChange={(v) => set('price', v)} suffix="$" placeholder="blank = direct cap value" />
              <Field label="Acquisition costs (estimate)" value={form.acq} onChange={(v) => set('acq', v)} suffix="% of price" />
            </div>
            {form.financed && (
              <>
                <div className="pa-4col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Loan-to-value" value={form.ltv} onChange={(v) => set('ltv', v)} suffix="%" />
                  <Field label="Interest rate" value={form.loanRate} onChange={(v) => set('loanRate', v)} suffix="% p.a." />
                  <Field label="Loan tenure" value={form.loanYears} onChange={(v) => set('loanYears', v)} suffix="years" />
                </div>
                <ToggleGroup ariaLabel="Repayment" options={[{ value: false, label: 'Principal + interest' }, { value: true, label: 'Interest only' }]} value={form.interestOnly} onChange={(v) => set('interestOnly', v)} />
              </>
            )}
            <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>Acquisition costs are an editable estimate covering stamp duty, legal and agent fees. ABSD is not included.</span>

            <button type="submit" className="pa-btn" style={{ height: 44, borderRadius: 10, border: 0, background: 'var(--pa-primary)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Calculate
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <ValuationResults
              status={status}
              result={result}
              form={runForm}
              errorMessage={errorMessage}
              stale={stale}
              onPrint={() => window.print()}
            />
            {status === 'results' && (
              <span style={{ fontSize: 11.5, color: 'var(--pa-text-3)' }}>{assetLabel} assumptions{runForm.name ? ` · ${runForm.name}` : ''}{runForm.preparedFor ? ` · prepared for ${runForm.preparedFor}` : ''}.</span>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
