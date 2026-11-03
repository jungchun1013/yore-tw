import type { DiaryKind } from '../core/types';

/** Diary line templates. {a} and {b} are cat names; {n} a number. One is picked at random. */
export const DIARY_TEXT: Record<DiaryKind, string[]> = {
  cuddle: [
    '{a} and {b} squished together in the middle of the floor and refused to move. Production continued around them.',
    'Caught {a} grooming {b}. {b} pretended not to enjoy it. {b} enjoyed it.',
    '{a} fell asleep leaning on {b}. Nobody had the heart to start the mixer.',
  ],
  fight: [
    '{a} and {b} had a very serious wrestling match over a crumb. No winner. Both got macarons.',
    'Zoomies broke out between {a} and {b}. A tray survived. Barely.',
    '{a} ambushed {b} from behind the counter. {b} retaliated with a bonk. Peace restored in nine seconds.',
  ],
  nap: [
    '{a} snuck into the cat house for a secret nap. Only the tail was visible.',
    '{a} snuck off behind the oven for a secret nap. The oven is warm. This is apparently allowed.',
    'Found {a} asleep on the conveyor side. Rotated gently back to the floor.',
    '{a} declared a nap. The shop respected it.',
  ],
  rest: [
    '{a} climbed to the top of the cat tree and supervised the whole bakery from there.',
    '{a} sat at the counter and watched the street for a while. Said it was "checking on customers."',
    '{a} took a break by the display case and stared at the macarons like a customer.',
  ],
  bless: [
    'The Cat Deity raised one paw. Everything glowed gold. Everyone baked ×{n} faster for a minute. Do not question it.',
    'A blessing of light. The kittens have never been so productive. The Deity went back to sleep.',
  ],
  timeskip: [
    'Time Cat turned its hourglass over and the whole shop ran ×{n} for half a minute. The oven is confused but full.',
    'Everything blurred. The conveyor hummed. Time Cat looked very pleased with itself. ×{n} speed.',
  ],
  star: [
    '{a} shook its fur and a rain of stardust fell over the whole shop. {n}/10 collected.',
    'Stardust on the trays, the oven and every cat. {a} looked very pleased. {n}/10.',
  ],
  post: [
    '{a}',
  ],
  customer: [
    'A rare visitor today: {a}. Ordered a lot. Left very happy.',
  ],
  chat: [
    '{a} chatted with {b} at the counter for a while. Nobody ordered anything. Everyone had a lovely time.',
    '{b} came in for macarons and left with a twenty-minute story from {a}. Came back the next day.',
    '{a} and {b} are apparently old friends now. The counter is a social club.',
  ],
  boxwalk: [
    '{a} hugged the giant fish plush and bunny-kicked it for a full minute. The fish has seen things.',
    'The fish plush is {a}\'s now. Everyone else may apply in writing.',
  ],
  treasure: [
    '{a} went into the tent and came out with a ball of yarn. Where did it come from. The tent is empty.',
    'Tent secret: {a} found something in there. We have stopped asking.',
  ],
  play: [
    '{a} played until it forgot about work.',
    '{a} calls this training.',
  ],
  rainbow: [
    'Something happened to {a} after too many pats. Rainbows. Chiptune. Nobody is explaining.',
    '{a} went full rainbow for eight seconds. The kittens tried to catch the trail.',
  ],
  prestige: [
    'Closed the shop and opened a new one. +{n} ★. The cats followed, obviously.',
  ],
};

/** Lines tied to the exact piece of furniture / spot a cat used, so the post matches the photo. */
export const SPOT_TEXT: Record<string, string[]> = {
  cushion: ['{a} flopped onto the round cushion, belly up, and snored.', 'The round cushion is {a}\'s today. Everyone else may queue.'],
  bed: ['{a} curled into the donut bed; only the ears showed.', 'The donut bed was occupied by {a} all afternoon.'],
  cathouse: ['{a} slipped into the red-roof house. The whole house snored.', 'Only {a}\'s tail was visible in the doorway.'],
  tent: ['{a} crawled into the blue tent and the little lamp came on.', 'Purring from inside the tent: {a}.'],
  fish: ['{a} hugged the giant fish and bunny-kicked it for a full minute, then fell asleep.', 'The fish plush went home with {a} today.'],
  cattree: ['{a} climbed to the top of the post and supervised the whole bakery from there.', 'From the top of the post, {a} judged everyone.'],
  basket: ['{a} curled up in the wicker basket. Exactly one basketful.', 'The basket today contains: {a}.'],
  counter: ['{a} sat at the counter and watched the street for a while. "Checking on customers."', '{a} took a break by the display case and stared at the macarons like a customer.'],
  oven: ['{a} fell asleep beside the oven. The oven is warm. This is apparently allowed.', 'Found {a} asleep by the oven.'],
  window: ['{a} stared out of the window for a long time. There was nothing outside.', '{a} says it was watching for customers. It was a pigeon.'],
  scratcher: ['{a} left a fresh new groove in the log. Very satisfied.', '{a} clawed the log until it forgot about work.'],
  fishbowl: ['{a} watched the goldfish for ten minutes. The goldfish watched back.', '{a} says it was checking the bowl for anything unusual. There was nothing.'],
  hangball: ['{a} swatted the hanging ball twenty times. It swung back every time.', '{a} and the hanging ball: a draw.'],
};

export function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
