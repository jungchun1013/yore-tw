/** One place for every colour. Bright, low-saturation, airy: the Souls in Abyss
 *  parchment family lifted toward a cyan daylight sky. Values are sRGB and used raw
 *  (colour management is off), so what is written here is what the shader sees. */
export const PAL = {
  skyTop: 0x4e9fc2,
  skyMid: 0x93d2dc,
  skyLow: 0xe4f4ec,
  cloud: 0xf8fbf4,
  cloudShade: 0xc9e6e6,
  halo: 0xe8fbf6,
  sun: 0xfff2d8,
  shadowTint: 0x5a64a8,
  rim: 0xbff0f2,
  outline: 0x34405e,

  grass: 0xa6c99a,
  grassDark: 0x8db895,
  grassLight: 0xc4dca4,
  sand: 0xe0d5b0,
  path: 0xd8c7a0,

  wall: 0xf2e8d3,
  roof: 0xcc8a72,
  roofDark: 0xa86b5c,
  wood: 0xa98466,
  woodDark: 0x846452,
  stone: 0xbcc2c0,
  stoneDark: 0x98a3a8,
  moss: 0xa9bd8c,
  boulder: 0xa7adb0,
  boulderDark: 0x8e979c,
  windowGlow: 0xffeab0,

  leafA: 0x86b58f,
  leafB: 0x9cc58e,
  leafC: 0x74a68c,
  trunk: 0x8d715f,

  water: 0x8fd0d6,
  waterDeep: 0x6eaebf,
  waterLight: 0xc6eeec,

  coat: 0x5f9a8c,
  scarf: 0xf3cf5c,
  hair: 0xf2d06b,
  skin: 0xf7e1cc,
  boots: 0x5d6b78,
  eye: 0x2f3442,

  hull: 0xf4ead6,
  gold: 0xe0b765,
  fin: 0x8fbccb,
  glass: 0x9fe8f0,

  wisp: 0xa8f4ff,
  rune: 0x8fe9f6,
  rose: 0xe2707c,
  volcano: 0xab9886,
  crater: 0x6d5f5a,
  flowerA: 0xfdf7ea,
  flowerB: 0xf5dc8a,
  flowerC: 0xf2b7c0,
} as const;
