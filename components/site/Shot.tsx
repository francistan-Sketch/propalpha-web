import Image from 'next/image';
import type { CSSProperties } from 'react';

// The app screenshots. Files live in /public/site/shots; store sets are the App Store uploads (sRGB, no alpha).
export const SHOTS = {
  'iphone69-01': { w: 1320, h: 2868, alt: 'PropAlpha welcome screen: AI Socrates, Classic Search and Tech Tools' },
  'iphone69-02': { w: 1320, h: 2868, alt: 'AI Socrates answers with an interactive tower view for Arina East Residences' },
  'iphone69-03': { w: 1320, h: 2868, alt: 'AI Socrates table of the top five District 15 new launches, with Copy and Save Image' },
  'iphone69-04': { w: 1320, h: 2868, alt: 'Flyer Maker preview of the Prestige market letter for Pavilion Park' },
  'iphone69-05': { w: 1320, h: 2868, alt: 'Flyer Maker template picker with ten templates' },
  'iphone69-06': { w: 1320, h: 2868, alt: 'Market Updates hub with Industrial Rents' },
  'iphone69-07': { w: 1320, h: 2868, alt: 'Resale Market, District 15, two years, monthly view' },
  'iphone69-08': { w: 1320, h: 2868, alt: 'Income Valuation: direct cap and DCF values, IRR and sensitivity' },
  'iphone69-09': { w: 1320, h: 2868, alt: 'Executive Condo loan cap with the TDSR and MSR warning' },
  'iphone69-10': { w: 1320, h: 2868, alt: 'Map of District 8 with psf pins' },
  'ipad13-01': { w: 2064, h: 2752, alt: 'PropAlpha welcome screen on iPad' },
  'ipad13-02': { w: 2064, h: 2752, alt: 'AI Socrates tower view on iPad' },
  'ipad13-03': { w: 2064, h: 2752, alt: 'AI Socrates table on iPad' },
  'ipad13-04': { w: 2064, h: 2752, alt: 'Flyer Maker Prestige preview on iPad' },
  'ipad13-05': { w: 2064, h: 2752, alt: 'Flyer Maker template picker on iPad' },
  'ipad13-06': { w: 2064, h: 2752, alt: 'Market Updates hub on iPad' },
  'ipad13-07': { w: 2064, h: 2752, alt: 'Resale Market monthly view on iPad' },
  'ipad13-08': { w: 2064, h: 2752, alt: 'Income Valuation on iPad' },
  'ipad13-09': { w: 2064, h: 2752, alt: 'Executive Condo loan cap on iPad' },
  'ipad13-10': { w: 2064, h: 2752, alt: 'Map with District 8 pins on iPad' },
  // extra iPad captures for the website (may be absent until captured; check /public/site/shots)
  'ipad-x01-socrates-chart': { w: 2064, h: 2752, alt: 'AI Socrates answers with a chart of District 15 resale psf' },
  'ipad-x02-socrates-industrial': { w: 2064, h: 2752, alt: 'AI Socrates answers a question about industrial rents in Ubi' },
  'ipad-x03-socrates-yield': { w: 2064, h: 2752, alt: 'AI Socrates answers with a rental yield card' },
  'ipad-x04-industrial-rents': { w: 2064, h: 2752, alt: 'Industrial Rents: URA J-SPACE quartiles by district, size and level' },
  'ipad-x05-tech-tools': { w: 2064, h: 2752, alt: 'Tech Tools hub' },
  'ipad-x06-ai-disclosure': { w: 2064, h: 2752, alt: 'About AI Socrates disclosure screen' },
} as const;

export type ShotId = keyof typeof SHOTS;

type Props = {
  id: ShotId;
  /** CSS object-position for crops, e.g. "50% 0%" (top), "50% 38%". Default top. */
  position?: string;
  /** Extra inline style for the well (aspect-ratio, width, transforms…). The well is position:relative. */
  style?: CSSProperties;
  className?: string;
  /** Above-the-fold images should set priority. */
  priority?: boolean;
  /** next/image sizes hint, e.g. "(max-width: 860px) 90vw, 40vw" */
  sizes?: string;
  alt?: string;
};

/**
 * A screenshot in the one frame every app screenshot uses: #120D2A well, 1px #2D1F6E border, 24px radius,
 * purple-tinted shadow, in both themes. Give it an aspect-ratio (or explicit size) through `style`;
 * the image fills it with object-fit: cover, so `position` picks the crop.
 */
export default function Shot({ id, position = '50% 0%', style, className, priority, sizes = '(max-width: 860px) 90vw, 40vw', alt }: Props) {
  const meta = SHOTS[id];
  return (
    <div className={`pa-well ${className ?? ''}`} style={style}>
      <Image
        src={`/site/shots/${id}.png`}
        alt={alt ?? meta.alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={82}
        style={{ objectFit: 'cover', objectPosition: position }}
      />
    </div>
  );
}

/** Natural aspect ratio string for a shot id, for `style={{ aspectRatio: shotRatio(id) }}`. */
export function shotRatio(id: ShotId): string {
  const m = SHOTS[id];
  return `${m.w} / ${m.h}`;
}
