import { PALETTE } from './palette';

/** Fur definition for the pixel cat generator. Early cats are natural coats; late cats are macaron "magic" colours. */
export interface Coat {
  fill: string;
  /** stripe / shade pixels in the base template */
  stripe: string;
  /** patch pattern mask (see sprites/pixel.ts PATTERNS) with its colours */
  pattern?: 'bicolor' | 'calico' | 'cow' | 'belly';
  patchA?: string;
  patchAStripe?: string;
  patchB?: string;
  eye?: string;
  /** colour of the mouth and closed-eye lines; dark coats need a light one so the face reads */
  face?: string;
}

const WHITE = '#FFFDFB', WHITE_STRIPE = '#F1E8E0';
const ORANGE = '#F6B26B', ORANGE_STRIPE = '#E08E3C';
const BLACK = '#4A3F3D', BLACK_STRIPE = '#5C504D';
const GRAY = '#B9B1AD', GRAY_STRIPE = '#A39A95';

export const COATS: Record<string, Coat> = {
  cream:       { fill: '#FFF8F0', stripe: '#F3E6DA' },
  orangewhite: { fill: WHITE, stripe: WHITE_STRIPE, pattern: 'bicolor', patchA: ORANGE, patchAStripe: ORANGE_STRIPE },
  calico:      { fill: WHITE, stripe: WHITE, pattern: 'calico', patchA: ORANGE, patchAStripe: ORANGE, patchB: BLACK }, // plain patches, no tabby stripes
  white:       { fill: WHITE, stripe: WHITE_STRIPE },
  black:       { fill: BLACK, stripe: BLACK_STRIPE, eye: '#FFE866', face: '#FFFFFF' },
  cow:         { fill: WHITE, stripe: WHITE, pattern: 'cow', patchB: BLACK }, // no tabby stripes
  orangetabby: { fill: ORANGE, stripe: ORANGE_STRIPE },
  graywhite:   { fill: WHITE, stripe: WHITE_STRIPE, pattern: 'bicolor', patchA: GRAY, patchAStripe: GRAY_STRIPE },
  gold:        { fill: '#FFD54A', stripe: '#E8B423', eye: '#5A3A10' }, // the Deity: bright, saturated gold
  blueberry:   { fill: PALETTE.blueberry.fill, stripe: PALETTE.blueberry.shade },
  pistachio:   { fill: PALETTE.pistachio.fill, stripe: PALETTE.pistachio.shade },
  cosmic:      { fill: PALETTE.cosmic.fill, stripe: PALETTE.cosmic.shade, eye: '#FFE866', face: '#FFFFFF' }, // deep space indigo, star-yellow eyes
  rainbow:     { fill: '#F9CBD6', stripe: '#E7A3B4' },
  // other animals (customers)
  shiba:       { fill: '#F2B06B', stripe: '#E39A4E' },
  beagle:      { fill: '#F1E3C8', stripe: '#DCC9A6' },
  bunnywhite:  { fill: WHITE, stripe: WHITE_STRIPE },
  bunnygray:   { fill: '#D9D2CC', stripe: '#C2B9B2' },
  bear:        { fill: '#C9A27E', stripe: '#B58C66' },
  polar:       { fill: '#F6F3EE', stripe: '#E6E0D8' },
  duck:        { fill: '#F6D86B', stripe: '#E6C24F' },
  hamster:     { fill: '#F4C890', stripe: '#E2B070' },
  penguin:     { fill: '#4A3F3D', stripe: '#5C504D' },
};

/** Coats used for walk-in customers (always ordinary house cats). */
export const CUSTOMER_COATS = ['orangewhite', 'calico', 'white', 'black', 'cow', 'orangetabby', 'graywhite'];
