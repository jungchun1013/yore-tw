/** Tiny i18n: two languages, string keys for UI, id-keyed tables for content. Switching re-renders via the 'mc:lang' event. */
import { HERO_NAME_ZH } from './content/zh';

export type Lang = 'en' | 'zh';

const UI: Record<string, { en: string; zh: string }> = {
  macarons: { en: 'macarons', zh: '個馬卡龍' },
  perSecond: { en: 'per second', zh: '每秒' },
  perPat: { en: 'per pat', zh: '每拍' },
  catnipRush: { en: 'Catnip rush', zh: '貓草加速' },
  rushTitle: { en: 'Watch a short ad for 2× production for 2 minutes', zh: '看一段短廣告，2 分鐘內產量 ×2' },
  brand: { en: 'Meowcaron', zh: '喵卡龍' },
  upgrades: { en: 'Upgrades', zh: '升級' },
  upgradesHint: { en: '— shop & kitchen upgrades appear here', zh: '— 店面與廚具升級會出現在這裡' },
  equipUpgrades: { en: 'Kitchen', zh: '廚具升級' },
  patUpgrades: { en: 'Patting', zh: '拍拍升級' },
  equipHint: { en: '— next machine at {n} baked', zh: '— 累計 {n} 出現下一台' },
  equipDone: { en: '— every machine is maxed', zh: '— 廚具全部滿級' },
  patHint: { en: '— next at {n} pats', zh: '— 再拍到 {n} 次出現' },
  patHintEarned: { en: '— next at {n} baked', zh: '— 累計 {n} 出現' },
  patDone: { en: '— paws fully trained', zh: '— 肉球已滿級' },
  cats: { en: 'Cats', zh: '貓咪' },
  hire: { en: 'Hire', zh: '雇用' },
  total: { en: 'total', zh: '合計' },
  sec: { en: 's', zh: '秒' },
  each: { en: 'each', zh: '每隻' },
  unlocksAround: { en: 'Unlocks around {n} macarons baked', zh: '累計烤到約 {n} 個馬卡龍解鎖' },
  affordableIn: { en: 'Affordable in {t}', zh: '再 {t} 就買得起' },
  keepPatting: { en: 'Keep patting the cat', zh: '繼續拍店長' },
  petted: { en: '♥ +{p}%', zh: '♥ +{p}%' },
  pettedAll: { en: '♥ +{p}%', zh: '♥ +{p}%' },
  newShop: { en: 'New shop', zh: '開新店' },
  prestigeText: { en: 'Close this bakery and open a new one. Keep your <b>stars</b>: each star gives <b id="star-bonus">+25%</b> production forever.', zh: '關掉這家店、開一家新的。<b>星星</b>會保留：每顆星永久 <b id="star-bonus">+25%</b> 產量。' },
  openNewShop: { en: 'Open new shop', zh: '開新店' },
  firstStarHint: { en: 'Bake {base} macarons across all your shops to earn your first star ({sofar} so far).', zh: '所有店累計烤到 {base} 個馬卡龍可得第一顆星（目前 {sofar}）。' },
  nextStarHint: { en: 'Next star at {n} baked across all shops.', zh: '下一顆星：所有店累計 {n} 個。' },
  footer: { en: 'v0.3 · Saves automatically · played {t}', zh: 'v0.3 · 自動存檔 · 已遊玩 {t}' },
  tipJournal: { en: 'Cat journal', zh: '貓咪日誌' },
  tipCodex: { en: 'Customer codex', zh: '客人圖鑑' },
  tipFeed: { en: 'Meowstagram', zh: '店家 IG' },
  tipFurniture: { en: 'Furniture', zh: '家具' },
  tipAchievements: { en: 'Achievements', zh: '成就' },
  tipSound: { en: 'Toggle sound', zh: '音效開關' },
  tipSettings: { en: 'Settings', zh: '設定' },
  tipLang: { en: 'Language / 語言', zh: '語言 / Language' },
  // modals
  prestigeQ: { en: 'Open a new shop?', zh: '要開新店嗎？' },
  prestigeBody: { en: 'Your macarons, cats and upgrades reset. You keep achievements and gain:', zh: '馬卡龍、貓咪與升級會歸零；成就保留，並獲得：' },
  prestigeAfter: { en: 'Each star gives +{p}% production forever. After this: {n} ★ = ×{m}.', zh: '每顆星永久 +{p}% 產量。開完後：{n} ★ = ×{m}。' },
  notYet: { en: 'Not yet', zh: '再等等' },
  close: { en: 'Close', zh: '關閉' },
  welcomeBack: { en: 'Welcome back!', zh: '歡迎回來！' },
  offlineBody: { en: 'Your cats kept baking for {t} at {p}% speed:', zh: '貓咪們幫你烤了 {t}，速度 {p}%：' },
  offlineBodyLong: { en: 'You were away {t}. The cats baked {h} h at {p}% speed, then dozed off ({tail}%):', zh: '你離開了 {t}。貓咪們以 {p}% 的速度烤了 {h} 小時，之後就打瞌睡了（{tail}%）：' },
  collect: { en: 'Collect', zh: '領取' },
  collect2x: { en: 'Collect 2× (watch ad)', zh: '領取 2×（看廣告）' },
  adUnavailable: { en: 'Ad unavailable — collected 1×', zh: '廣告暫時無法播放，已領取 1×' },
  rushOn: { en: 'Catnip rush! 2× production for 2 minutes', zh: '貓草加速！2 分鐘內產量 ×2' },
  rushFail: { en: 'Ad unavailable right now — try again later', zh: '廣告暫時無法播放，晚點再試' },
  settings: { en: 'Settings', zh: '設定' },
  settingsBody: { en: 'Platform: {p} · Saved automatically every 10 seconds and when you leave.', zh: '平台：{p} · 每 10 秒與離開時自動存檔。' },
  language: { en: 'Language', zh: '語言' },
  wipe: { en: 'Wipe save', zh: '清除存檔' },
  wipeConfirm: { en: 'Really wipe everything?', zh: '真的要全部清除？' },
  wiped: { en: 'Save wiped', zh: '存檔已清除' },
  achievements: { en: 'Achievements {a}/{b}', zh: '成就 {a}/{b}' },
  achBody: { en: 'Each achievement adds +1% production. Current bonus: +{n}%.', zh: '每個成就 +1% 產量。目前加成：+{n}%。' },
  newShopOpened: { en: 'New shop opened! +{n} ★', zh: '新店開張！+{n} ★' },
  blessToast: { en: '✨ ×{m} · +{n}', zh: '✨ ×{m} · +{n}' },
  warpToast: { en: '⏳ ×{m}', zh: '⏳ ×{m}' },
  dustFull: { en: '✦ Stardust complete: +1 ★ forever!', zh: '✦ 星塵集滿：永久 +1 ★！' },
  dust: { en: '✦ Stardust {n}/10', zh: '✦ 星塵 {n}/10' },
  nyanDash: { en: '🌈 Nyan dash! +{n}', zh: '🌈 Nyan dash！+{n}' },
  rainbowFound: { en: '🌈 Nya nya nya! A Rainbow Cat is for hire.', zh: '🌈 喵喵喵！彩虹貓可以雇用了。' },
  // journal / codex / feed / furniture
  journalBlank: { en: 'This page is still blank…', zh: '這一頁還是空白的…' },
  hiredStat: { en: 'Hired ×{n} · {p}/s', zh: '雇用 ×{n} · {p}/秒' },
  pattedStat: { en: 'Patted {n} times', zh: '被拍了 {n} 次' },
  meetAfter: { en: 'Meet this cat after ~{n} macarons', zh: '累計約 {n} 個馬卡龍後會遇到' },
  keepBaking: { en: 'Keep baking. Every cat finds the bakery eventually.', zh: '繼續烤吧，每隻貓最後都會找到這家店。' },
  likes: { en: 'Likes', zh: '喜歡' },
  favourite: { en: 'Favourite macaron', zh: '最愛的馬卡龍' },
  whenPetted: { en: 'When petted', zh: '被摸的時候' },
  prev: { en: '‹', zh: '‹' }, next: { en: '›', zh: '›' },
  whoWasThat: { en: 'Who was that?', zh: '那是誰？' },
  notMet: { en: 'Not met yet', zh: '還沒見過' },
  visited: { en: 'Visited ×{a} · Served ×{b}', zh: '來訪 ×{a} · 成交 ×{b}' },
  orders: { en: 'Orders', zh: '訂單' },
  ordersOf: { en: '×{n} of a normal order', zh: '一般訂單的 ×{n}' },
  keepCounter: { en: 'Keep the counter open. Everyone in town gets hungry eventually.', zh: '櫃檯繼續開著，鎮上每個人總有一天會餓。' },
  often1: { en: 'Drops by all the time', zh: '三天兩頭就來' },
  often2: { en: 'A regular', zh: '常客' },
  often3: { en: 'Rare visitor', zh: '稀客' },
  feedLocked: { en: 'The shop account opens once you hire an Influencer Cat. Every cuddle, nap and blessing in the bakery gets posted here.', zh: '雇到網紅貓後，店家帳號才會開張。店裡每一次貼貼、打盹、聖光都會發在這裡。' },
  notOpen: { en: 'not open yet', zh: '尚未開張' },
  followersPosts: { en: '{f} followers · {p} posts', zh: '{f} 粉絲 · {p} 則貼文' },
  followersNew: { en: '{f} followers · new post', zh: '{f} 粉絲 · 新貼文' },
  likesN: { en: '♥ {n} likes', zh: '♥ {n} 個讚' },
  noPosts: { en: 'No posts yet. Leave the cats alone for a while…', zh: '還沒有貼文，讓貓咪們自己待一會兒…' },
  justNow: { en: 'just now', zh: '剛剛' }, minAgo: { en: '{n} min ago', zh: '{n} 分鐘前' }, hAgo: { en: '{n} h ago', zh: '{n} 小時前' }, dAgo: { en: '{n} d ago', zh: '{n} 天前' },
  furniture: { en: 'Furniture', zh: '家具' },
  furnitureBody: { en: 'Four spots on the floor. Each piece on the floor: +{p}% production (now +{n}%). Cats nap, rest and hide in them.', zh: '地板上有四個位置。每放一件：+{p}% 產量（目前 +{n}%）。貓咪會在裡面打盹、休息、躲藏。' },
  spot: { en: 'Spot {n}', zh: '位置 {n}' }, empty: { en: 'empty', zh: '空的' },
  putAway: { en: 'Put away', zh: '收起來' }, place: { en: 'Place', zh: '放到場上' },
  allSpotsFull: { en: 'All four spots are taken — put something away first', zh: '四個位置都滿了，先收一件' },
  tapToPutAway: { en: 'Tap to put this piece away', zh: '點一下收起來' }, emptySpot: { en: 'Empty spot', zh: '空位' },
  // scene banners
  bannerBless: { en: '✨ Blessing of light ×{m} · 45 s', zh: '✨ 聖光加護 ×{m} · 45 秒' },
  bannerWarp: { en: '⏳ Time warp ×{m} · {s} s', zh: '⏳ 時間加速 ×{m} · {s} 秒' },
  bannerStar: { en: '✦ Stardust rain!', zh: '✦ 星塵雨！' },
  bannerNyan: { en: '🌈 Nyan dash!', zh: '🌈 Nyan dash！' },
  bannerPost: { en: '📸 Posted to Meowstagram', zh: '📸 發到店家 IG 了' },
  bannerSnap: { en: '📸 Snap!', zh: '📸 拍到了！' },
  bannerTagged: { en: '📸 A customer tagged the shop', zh: '📸 客人標記了店家' },
  taggedYou: { en: 'tagged meowcaron.official', zh: '標記了 meowcaron.official' },
  warpFloat: { en: '⏳ ×{m}', zh: '⏳ ×{m}' },
  owner: { en: 'Owner', zh: '店長' },
  cpsText: { en: '{n}/s', zh: '{n}/秒' },
  clickText: { en: ' · {n} per pat', zh: ' · 每拍 {n}' },
  brandSub: { en: 'cat macaron bakery', zh: '貓咪馬卡龍店' },
  starsTip: { en: 'Stars boost all production permanently', zh: '星星永久提升所有產量' },
  gramTip: { en: 'Meowstagram followers', zh: '店家 IG 粉絲' },
  max: { en: 'Max', zh: '最多' },
  owned: { en: 'Owned', zh: '已擁有' },
  openJournal: { en: 'Open journal', zh: '打開日誌' },
  blessedPill: { en: '✨ blessed ×{m} · {t}', zh: '✨ 加護 ×{m} · {t}' },
  rushShort: { en: '🌿 {m}× rush', zh: '🌿 {m}× 加速' },
  rushLong: { en: '🌿 Catnip rush ({m}×)', zh: '🌿 貓草加速（{m}×）' },
  ourCat: { en: 'our {name}', zh: '我們的{name}' },
  prevPage: { en: 'Previous page', zh: '上一頁' }, nextPage: { en: 'Next page', zh: '下一頁' },
  langName: { en: 'English', zh: '繁體中文' },
  langShort: { en: '中', zh: 'EN' },
  switchLang: { en: '切換為繁體中文', zh: 'Switch to English' },
  platform: { en: 'Platform', zh: '平台' },
  tutPat: { en: 'Pat the owner! Every pat bakes a macaron.', zh: '拍拍店長！每拍一下就烤出一顆馬卡龍。' },
  tutHire: { en: 'Hire your first cat. It bakes while you rest.', zh: '雇第一隻貓，牠會自己烤。' },
  tutUpgrade: { en: 'Your first upgrade is ready. Tap it!', zh: '第一個升級出現了，點它！' },
  tutFeed: { en: 'The Influencer Cat is here! Pet it when it glows to post a photo. Followers bring customers. Tap 📸 to see the shop account.', zh: '網紅貓來了！牠發光的時候摸牠會發一篇文，粉絲越多客人越常來。點 📸 看店家粉專。' },
  gotIt: { en: 'Got it', zh: '知道了' },
  heatPill: { en: '🔥 +{n}%', zh: '🔥 +{n}%' },
  slackTip: { en: 'Slacking: −{n}% production. One tap snaps the cat out of it; the next tap is a pat.', zh: '有貓在偷懶：產量 −{n}%。點一下打斷，再點一下才是拍拍。' },
  sound: { en: 'Sound', zh: '音效' }, on: { en: 'On', zh: '開' }, off: { en: 'Off', zh: '關' },
  buyAmount: { en: 'Buy amount', zh: '購買數量' },
};

let current: Lang = detect();
function detect(): Lang {
  try { const saved = localStorage.getItem('meowcaron.lang'); if (saved === 'en' || saved === 'zh') return saved; } catch { /* ignore */ }
  return typeof navigator !== 'undefined' && /^zh/i.test(navigator.language) ? 'zh' : 'en';
}
export function lang(): Lang { return current; }
export function setLang(l: Lang): void {
  current = l;
  try { localStorage.setItem('meowcaron.lang', l); } catch { /* ignore */ }
  document.documentElement.lang = l === 'zh' ? 'zh-TW' : 'en';
  window.dispatchEvent(new CustomEvent('mc:lang'));
}
export function t(key: string, vars: Record<string, string | number> = {}): string {
  const entry = UI[key];
  let s = entry ? entry[current] : key;
  for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  return s;
}
/** Localized name / description of a content def that carries an optional zh block. */
export function nameOf(d: { name: string; zh?: { name: string } }): string { return current === 'zh' && d.zh ? d.zh.name : d.name; }
export function descOf(d: { desc: string; zh?: { desc: string } }): string { return current === 'zh' && d.zh ? d.zh.desc : d.desc; }
/** The owner's display name (the default English name is localized; a custom one is kept). */
export function heroName(saved: string): string { return current === 'zh' && saved === 'Mochi' ? HERO_NAME_ZH : saved; }
/** Fill static text in index.html: elements with data-i18n (text) and data-i18n-title (title attribute). */
export function applyStatic(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((e) => { e.textContent = t(e.dataset.i18n!); });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((e) => { e.innerHTML = t(e.dataset.i18nHtml!); });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((e) => { e.title = t(e.dataset.i18nTitle!); });
  document.documentElement.lang = current === 'zh' ? 'zh-TW' : 'en';
  document.title = t('brand');
}
/** Pick a localized string from a {en, zh} pair. */
export function L<T>(pair: { en: T; zh: T }): T { return pair[current]; }
