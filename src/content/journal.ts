/** Cat personas shown in the Journal. Pure content: safe to rewrite for a new theme. */
export type PetReaction = 'happy' | 'purr' | 'lie' | 'sparkle' | 'flat';

export interface JournalEntry {
  id: string;           // generator id, or 'shopcat' for the hero
  pet: PetReaction;     // how this cat reacts to being petted on the floor
  title: string;        // role line under the name
  story: string[];      // short paragraphs
  likes: string;
  flavour: string;      // favourite macaron
}

export const JOURNAL: JournalEntry[] = [
  {
    id: 'shopcat', pet: 'happy', title: 'Owner. Mascot. Sleeps on the register.',
    story: [
      'Nobody remembers hiring Mochi. One morning the bakery had a cat on the counter, and the counter has been Mochi\'s ever since.',
      'Every pat produces a macaron. Nobody knows how. Mochi has declined all interviews.',
    ],
    likes: 'Being patted exactly where the sunbeam lands', flavour: 'Vanilla, because it is the colour of Mochi',
  },
  {
    id: 'kitten', pet: 'happy', title: 'Junior Assistant (unpaid, paid in crumbs)',
    story: [
      'Kittens arrive in boxes. The boxes were meant for macarons. This is an ongoing dispute.',
      'They bat at the dough, chase the piping bag, and occasionally fall asleep inside the mixer. Production is modest, but morale is extremely high.',
    ],
    likes: 'The crinkle of parchment paper', flavour: 'Whatever just fell on the floor',
  },
  {
    id: 'apprentice', pet: 'happy', title: 'Apprentice, Year One of Nine',
    story: [
      'Wears a bow to look serious. Has read half of one recipe and insists the second half is "basically the same."',
      'Once baked a batch with salt instead of sugar. Sold out anyway, which taught everyone the wrong lesson.',
    ],
    likes: 'Being called "chef" by mistake', flavour: 'Mint, "like a fresh start"',
  },
  {
    id: 'baker', pet: 'purr', title: 'Shell Specialist',
    story: [
      'Pipes perfect shells with their eyes closed. Literally — they are usually napping while doing it.',
      'Refuses to share the trick. The trick, according to the kittens, is "being a baker cat."',
    ],
    likes: 'A clean bench and silence', flavour: 'Lemon, sharp enough to wake up to',
  },
  {
    id: 'courier', pet: 'lie', title: 'Night Delivery, Rain or Shine',
    story: [
      'Delivers across town at 3 a.m., mostly to other cats who ordered at 2:59 a.m.',
      'The blue bandana is for aerodynamics. The courier has never explained what aerodynamics are, and nobody has dared to ask.',
    ],
    likes: 'Wet pavement reflections', flavour: 'Blueberry, eaten on a rooftop',
  },
  {
    id: 'patissier', pet: 'purr', title: 'Pâtissier, Trained in Paris (allegedly)',
    story: [
      'Arrived with a tall hat, a suitcase of tiny whisks, and opinions about your ganache.',
      'The hat has never been removed. Staff suspect there is a second, smaller cat inside it running the actual kitchen.',
    ],
    likes: 'Correcting people\'s pronunciation of "macaron"', flavour: 'Lavender, "obviously"',
  },
  {
    id: 'manager', pet: 'flat', title: 'Operations Manager',
    story: [
      'Schedules the naps. All of them. There is a chart. The chart has a nap on it.',
      'Wears glasses with no lenses because they "make the spreadsheets listen." Production doubled the week they were hired, so nobody argues.',
    ],
    likes: 'Colour-coded sticky notes', flavour: 'Peach, filed under "Q3 priorities"',
  },
  {
    id: 'influencer', pet: 'happy', title: '2.3M Followers, 1 Bakery',
    story: [
      'One photo, ten thousand orders. The sunglasses stay on indoors, in the walk-in fridge, and apparently in the bath.',
      'Has never baked anything. Has tasted everything. Rates every macaron "obsessed" with a heart emoji.',
    ],
    likes: 'Golden hour, and being told about golden hour', flavour: 'Rose, for the aesthetic',
  },
  {
    id: 'deity', pet: 'sparkle', title: 'Cat Deity (part-time)',
    story: [
      'Macarons simply appear on the shelves. Do not question it. Several staff who questioned it are now very polite.',
      'The halo is warm to the touch and smells faintly of caramel. The deity prefers to be addressed as "hey you."',
    ],
    likes: 'Offerings of boxes, any size', flavour: 'Salted caramel, from the heavens',
  },
  {
    id: 'timecat', pet: 'lie', title: 'Temporal Logistics',
    story: [
      'Bakes yesterday\'s batch tomorrow, today. The pocket watch runs backwards on Tuesdays, which it says is "fine."',
      'Occasionally greets customers who have not arrived yet. They always show up, confused, and buy a dozen.',
    ],
    likes: 'Punctuality, loosely defined', flavour: 'Blueberry, from next week\'s harvest',
  },
  {
    id: 'rainbow', pet: 'sparkle', title: 'Nya nya nya (do not ask)',
    story: [
      'Appeared after someone patted the owner far too many times. Has been cycling through every colour since.',
      'Leaves a rainbow wherever it runs. The kittens chase it. The manager has given up filing a report.',
    ],
    likes: 'Being patted exactly twelve times', flavour: 'All of them. At once.',
  },
  {
    id: 'cosmic', pet: 'sparkle', title: 'Cosmic Cat, Whisker of the Universe',
    story: [
      'Whole galaxies, lightly whisked. The crown is made of a star it found "lying around."',
      'Purrs at a frequency that makes the ovens preheat on their own. The electricity bill has become a philosophical question.',
    ],
    likes: 'Sitting in the exact centre of everything', flavour: 'Pistachio, "the green of nebulae"',
  },
];

export const JOURNAL_BY_ID: Record<string, JournalEntry> = Object.fromEntries(JOURNAL.map((j) => [j.id, j]));
