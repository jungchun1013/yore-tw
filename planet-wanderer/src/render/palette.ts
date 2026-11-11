/** One place for every colour. Bright, low-saturation, airy: the Souls in Abyss
 *  parchment family lifted toward a cyan daylight sky. Values are sRGB and used raw
 *  (colour management is off), so what is written here is what the shader sees. */
export const PAL = {
  skyTop: 0x858ec2,
  skyMid: 0xb2c3dc,
  skyLow: 0xede4e4,
  cloud: 0xf5eee7,
  cloudShade: 0xb3b4d4,
  halo: 0xdfe9f2,
  cloudWarm: 0xefc4b4,
  sun: 0xffe6cc,
  shadowTint: 0x9690c5,
  rim: 0xd8e3ee,
  outline: 0x3e3a5c,

  grass: 0xa9c5ad,
  grassDark: 0x8dbb9c,
  grassLight: 0xc6d8a8,
  sand: 0xdac8bc,
  path: 0xc2b2b0,

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

  coat: 0x6b9f9d,
  scarf: 0xe7bf85,
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
