/** One place for every colour. Bright, low-saturation, airy: the Souls in Abyss
 *  parchment family lifted toward a cyan daylight sky. Values are sRGB and used raw
 *  (colour management is off), so what is written here is what the shader sees. */
export const PAL = {
  skyTop: 0x4b84b6,
  skyMid: 0x7ea5cb,
  skyLow: 0xc6d7e5,
  cloud: 0xedf0f1,
  cloudShade: 0x86a6c7,
  halo: 0xdfe9f2,
  cloudWarm: 0xefc4b4,
  sun: 0xffe6cc,
  shadowTint: 0x6472b2,
  rim: 0xd8e3ee,
  outline: 0x3e3a5c,

  grass: 0x9bb07f,
  grassDark: 0x7f9a72,
  grassLight: 0xb8c493,
  sand: 0xb48a70,
  path: 0x9c6b56,

  wall: 0xf2e8d3,
  roof: 0xcc8a72,
  roofDark: 0xa86b5c,
  wood: 0xa98466,
  woodDark: 0x846452,
  stone: 0xb3b0c4,
  stoneDark: 0x9592ad,
  moss: 0x9fb07f,
  boulder: 0xa8a6bd,
  boulderDark: 0x8d8aa6,
  windowGlow: 0xffeab0,

  leafA: 0x7f9c6e,
  leafB: 0x93ad7a,
  leafC: 0x6b8a66,
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
