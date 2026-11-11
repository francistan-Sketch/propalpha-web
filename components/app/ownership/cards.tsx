'use client';

import { useState } from 'react';
import type { CondoItem, CondoRecord, GcbItem, GcbWho, StreetItem } from '@/lib/ownership';
import {
  CardHead, FlagTag, GREEN, GREY, MoreLink, PersonRow, PhoneLink, RecordCard, RED, ROLE, RoleBadge, SKY, StatusTag, Transactions,
  dim, dimInline, fmtDay, fmtMoney, lineRow, nameMatches, plural, sectionLabel,
} from '@/components/app/ownership/ui';

// The three result cards, field for field as the app draws them (LandedStreetScreen.AddressCard,
// LandedGcbScreen.GcbCard, CondoIntelScreen.UnitCard). Data is shown as the backend shapes it: the
// outdated/current flag, GCB `tenanted` and condo `occupancy` are all computed server-side.

const OWNERS_SHOWN = 4;
const TENANTS_SHOWN = 3;

// ── Landed: one card per address. Every name on file is an owner; a land line is shown where listed. ──
export function AddressCard({ item }: { item: StreetItem }) {
  const [showAll, setShowAll] = useState(false);
  const out = item.flag === 'outdated';
  const owners = Array.isArray(item.owners) ? item.owners : [];
  // Owners the search hit come first; the rest fold away so an address with many names does not bury the list.
  const sorted = [...owners].sort((a, b) => Number(!!b.hit) - Number(!!a.hit));
  const shown = showAll ? sorted : sorted.slice(0, OWNERS_SHOWN);
  const hidden = sorted.length - shown.length;

  return (
    <RecordCard flag={item.flag}>
      <CardHead title={`${item.house_no} ${item.street}`} tags={<FlagTag flag={item.flag} />} />
      <span style={dim}>{item.postal_code ? `S${item.postal_code}` : 'No postal'}</span>

      <span style={sectionLabel}>{owners.length === 1 ? 'Owner' : `Owners · ${owners.length}`}</span>
      {!owners.length ? <PersonRow role="owner" name="No name on record" dim /> : null}
      {shown.map((o, i) => (
        <PersonRow key={i} role="owner" name={o.name || '(no name)'} hit={!!o.hit}>
          <div style={{ ...lineRow, marginTop: 3 }}>
            {o.phone ? <><span style={dimInline}>Land line </span><PhoneLink number={o.phone} /></> : <span style={dimInline}>No land line listed</span>}
          </div>
        </PersonRow>
      ))}
      {hidden > 0 || showAll ? (
        <MoreLink onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer' : `Show ${hidden} more ${plural(hidden, 'owner', 'owners')}`}</MoreLink>
      ) : null}

      <Transactions list={item.transactions} hot={out ? RED : null} />
    </RecordCard>
  );
}

// ── GCB: one card per sale record. A land line subscriber with a different name marks the bungalow TENANTED. ──
export function GcbCard({ item, terms, complete, who }: { item: GcbItem; terms: string[]; complete: boolean; who: GcbWho }) {
  const [showAll, setShowAll] = useState(false);
  const out = item.flag === 'outdated';
  const price = fmtMoney(item.amount);
  const amount = Number(item.amount);
  const sqft = Number(item.land_area_sqft);
  const psf = amount > 0 && sqft > 0 ? Math.round(amount / sqft) : null;
  const owners = Array.isArray(item.owners) ? item.owners : [];

  // Tenants the search hit come first; the rest fold away so one busy property does not bury the list.
  const tenants = [...(Array.isArray(item.tenants) ? item.tenants : [])]
    .sort((a, b) => Number(nameMatches(b.name, terms, complete)) - Number(nameMatches(a.name, terms, complete)));
  const shown = showAll ? tenants : tenants.slice(0, TENANTS_SHOWN);
  const hidden = tenants.length - shown.length;
  const contract = fmtDay(item.contract_date);

  return (
    <RecordCard flag={item.flag}>
      <CardHead
        title={item.property_address}
        tags={<>
          <FlagTag flag={item.flag} />
          {item.tenanted ? <StatusTag color={ROLE.tenant.color}>TENANTED</StatusTag> : null}
        </>}
      />
      <span style={dim}>
        {item.postal_code ? `S${item.postal_code}` : 'No postal'}
        {item.land_area_sqm ? `  ·  ${Math.round(Number(item.land_area_sqm)).toLocaleString('en-SG')} sqm` : ''}
        {item.land_area_sqft ? `  ·  ${Math.round(Number(item.land_area_sqft)).toLocaleString('en-SG')} sqft` : ''}
      </span>
      <span style={dim}>
        {contract ? `Contract ${contract}` : 'No contract date'}
        {price ? `  ·  ${price}` : '  ·  price not stated'}
        {psf ? `  ·  $${psf.toLocaleString('en-SG')} psf land` : ''}
      </span>

      <span style={sectionLabel}>Owners · {owners.length}</span>
      {owners.map((o, i) => (
        <PersonRow key={`o${i}`} role="owner" name={o.name || '(no name)'} hit={who !== 'tenant' && nameMatches(o.name, terms, complete)}>
          {o.home_address ? <span style={{ ...dim, display: 'block' }}>Home: {o.home_address}</span> : null}
          {o.home_phone ? (
            <div style={{ ...lineRow, marginTop: 3 }}>
              {o.staying ? <span style={{ color: GREEN, fontSize: 11, fontWeight: 700 }}>Staying here  ·  </span> : null}
              <span style={dimInline}>land line </span>
              <PhoneLink number={o.home_phone} />
            </div>
          ) : null}
        </PersonRow>
      ))}

      {tenants.length ? (
        <>
          <span style={sectionLabel}>Tenants · {tenants.length}</span>
          {shown.map((x, i) => (
            <PersonRow key={`t${i}`} role="tenant" name={x.name || '(no name)'} hit={who !== 'owner' && nameMatches(x.name, terms, complete)}>
              <div style={{ ...lineRow, marginTop: 3 }}>
                {x.phone ? <><span style={dimInline}>Land line </span><PhoneLink number={x.phone} /></> : null}
                {x.via === 'landline' ? <span style={dimInline}>{x.phone ? '  ·  ' : ''}land line subscriber at the bungalow</span> : null}
              </div>
            </PersonRow>
          ))}
          {hidden > 0 || showAll ? (
            <MoreLink onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer tenants' : `Show ${hidden} more ${plural(hidden, 'tenant', 'tenants')}`}</MoreLink>
          ) : null}
        </>
      ) : null}

      <Transactions list={item.transactions} hot={out ? RED : null} />
    </RecordCard>
  );
}

// ── Condo: one card per unit. Occupancy from the latest record (server-side). ──
export const OCC: Record<string, { label: string; color: string }> = {
  own_stay: { label: 'OWN STAY', color: GREEN },
  tenanted: { label: 'TENANTED', color: ROLE.tenant.color },
  lives_elsewhere: { label: 'OWNER LIVES ELSEWHERE', color: SKY },
  unknown: { label: 'OCCUPANCY UNKNOWN', color: GREY },
};

function CondoRecordView({ r, hits, faded }: { r: CondoRecord; hits: Set<string>; faded?: boolean }) {
  const contract = fmtDay(r.contract_date);
  const money = fmtMoney(r.amount);
  return (
    <div style={{ opacity: faded ? 0.75 : 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span style={{ ...dim, marginBottom: 2 }}>
        {contract ? `Contract ${contract}` : 'No contract date'}
        {money ? `  ·  ${money}` : ''}
        {r.area_sqm ? `  ·  ${Math.round(Number(r.area_sqm) * 10.764).toLocaleString('en-SG')} sqft` : ''}
      </span>
      {(r.purchasers || []).map((n, i) => (
        <PersonRow key={i} role="owner" name={n} hit={hits.has(n)}>
          {i === 0 && r.purchaser_address && !r.purchaser_at_unit ? <span style={{ ...dim, display: 'block' }}>Lives at: {r.purchaser_address}</span> : null}
          {i === 0 && r.purchaser_at_unit ? <span style={{ ...dim, display: 'block' }}>Address on caveat: this unit</span> : null}
        </PersonRow>
      ))}
      {r.unit_subscriber ? (
        <div style={lineRow}>
          <RoleBadge role={r.occupancy === 'own_stay' ? 'owner' : 'tenant'} />
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 0, overflowWrap: 'anywhere' }}>{r.unit_subscriber}</span>
          <span style={dimInline}>line at unit </span><PhoneLink number={r.unit_tel} />
        </div>
      ) : null}
      {r.home_subscriber ? (
        <div style={lineRow}>
          <span style={dimInline}>Owner&rsquo;s line elsewhere: </span>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 0, overflowWrap: 'anywhere' }}>{r.home_subscriber}</span>
          <PhoneLink number={r.home_tel} />
        </div>
      ) : null}
      {(r.mobiles || []).map((m, i) => (
        <div key={i} style={lineRow}><span style={dimInline}>Mobile </span><PhoneLink number={m} /><span style={dimInline}>  (caveat sheet)</span></div>
      ))}
      {r.remarks ? <span style={dim}>{r.remarks}</span> : null}
    </div>
  );
}

export function UnitCard({ item }: { item: CondoItem }) {
  const [showAll, setShowAll] = useState(false);
  const out = item.flag === 'outdated';
  const recs = Array.isArray(item.records) ? item.records : [];
  const latest: CondoRecord = recs[0] || { contract_date: null, amount: null, area_sqm: null, purchasers: [], purchaser_address: null, purchaser_at_unit: null, unit_subscriber: null, unit_tel: null, home_subscriber: null, home_tel: null, occupancy: null, mobiles: [], remarks: null, file_date: null };
  const occ = OCC[item.occupancy] || OCC.unknown;
  const hits = new Set(item.hits || []);
  const contacts = Array.isArray(item.contacts) ? item.contacts : [];
  const older = recs.slice(1);

  return (
    <RecordCard flag={item.flag}>
      <CardHead
        title={item.project}
        sub={`#${item.unit}${item.blk ? `  ·  Blk ${item.blk}` : ''}${item.street ? `  ·  ${item.street}` : ''}`}
        tags={<>
          <FlagTag flag={item.flag} />
          <StatusTag color={occ.color}>{occ.label}</StatusTag>
        </>}
      />
      <span style={dim}>{item.postal_code ? `S${item.postal_code}` : 'No postal'}{item.district ? `  ·  D${item.district}` : ''}</span>

      <span style={sectionLabel}>Purchaser{(latest.purchasers || []).length > 1 ? 's' : ''}</span>
      <CondoRecordView r={latest} hits={hits} />

      {contacts.length ? (
        <>
          <span style={sectionLabel}>Contacts · {contacts.length}</span>
          {contacts.map((k, i) => (
            <div key={i} style={lineRow}>
              <span style={{ fontSize: 13, fontWeight: 600, minWidth: 0, overflowWrap: 'anywhere' }}>{k.name || '(no name)'}</span>
              {k.mobile ? <PhoneLink number={k.mobile} /> : null}
              {k.home_phone ? <PhoneLink number={k.home_phone} label="home" /> : null}
              <span style={dimInline}>  {k.source === 'listing' ? 'listing sheet' : 'contacts sheet'}{k.email ? ` · ${k.email}` : ''}{k.asking ? ` · ${k.asking}` : ''}</span>
            </div>
          ))}
        </>
      ) : null}

      {older.length ? (
        <>
          <MoreLink onClick={() => setShowAll(!showAll)}>{showAll ? 'Hide earlier caveats' : `Show ${older.length} earlier ${plural(older.length, 'caveat', 'caveats')}`}</MoreLink>
          {showAll ? older.map((r, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--pa-border)', paddingTop: 8, marginTop: 8 }}><CondoRecordView r={r} hits={hits} faded /></div>
          )) : null}
        </>
      ) : null}

      <Transactions list={item.transactions} hot={out ? RED : null} />
    </RecordCard>
  );
}
