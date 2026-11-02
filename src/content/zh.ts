/** Traditional Chinese (Taiwan) content. Keyed by the same ids as the English content files. */
import type { DiaryKind } from '../core/types';

export const CAT_ZH: Record<string, { name: string; desc: string }> = {
  kitten:     { name: '小奶貓', desc: '拍麵團玩。大致上算有幫忙。' },
  apprentice: { name: '學徒貓', desc: '讀了半本食譜，另一半「應該差不多」。' },
  baker:      { name: '烘焙貓', desc: '擠出完美的殼，秘訣從不外傳。' },
  courier:    { name: '外送貓', desc: '凌晨三點也在送馬卡龍。' },
  patissier:  { name: '甜點師貓', desc: '巴黎受訓，會評論你的甘納許。' },
  manager:    { name: '店長貓', desc: '用極高效率排午睡班表。' },
  influencer: { name: '網紅貓', desc: '一張照片，一萬張訂單。' },
  deity:      { name: '貓貓神', desc: '馬卡龍自己出現了，別問。' },
  timecat:    { name: '時間貓', desc: '把明天的那批今天先烤好。' },
  cosmic:     { name: '宇宙貓', desc: '整個星系，輕輕打發。' },
  rainbow:    { name: '彩虹貓', desc: '喵喵喵。只有夠執著的人找得到。' },
};
export const HERO_NAME_ZH = '麻糬';

export const SPECIAL_ZH: Record<string, { label: string; blurb: string }> = {
  influencer: { label: '店家 IG', blurb: '發光時摸牠：發一張照片，粉絲越多客人越常來。' },
  deity:      { label: '聖光加護', blurb: '發光時摸牠：45 秒內全店 ×1.5（每多一隻 +0.1，上限 ×2），外加 20 秒產量。' },
  timecat:    { label: '時間加速', blurb: '發光時摸牠：20 秒內全店 ×2 速。每隻永久 +2 小時離線上限。' },
  cosmic:     { label: '星塵', blurb: '發光時摸牠：下一場星塵雨，直接 +1 星塵（10 顆換 1 顆永久星星）並外加 15 秒產量。開新店時每隻多給 10% 星星。' },
  rainbow:    { label: 'Nyan dash', blurb: '發光時摸牠：拖著彩虹飛過店裡，放一段旋律，外加 10 秒產量。' },
};

export const PET_TEXT_ZH = {
  happy: '原地跳來跳去，超開心（> <）',
  purr: '瞇著眼扭來扭去呼嚕呼嚕（> <）',
  lie: '翻肚躺下打個盹，zzz，再爬起來（> <）',
  sparkle: '發光發亮。不解釋（> <）',
  flat: '壓成一片餅，再ㄉㄨㄞㄉㄨㄞ彈三下回來（> <）',
};

export const JOURNAL_ZH: Record<string, { title: string; story: string[]; likes: string; flavour: string }> = {
  shopcat: { title: '店長。吉祥物。睡在收銀機上。', story: ['沒有人記得是誰雇了麻糬。某天早上櫃檯上就有一隻貓，從此櫃檯就是牠的了。', '每拍一下就生出一顆馬卡龍。沒有人知道原理，麻糬拒絕所有採訪。'], likes: '剛好在陽光落下的地方被拍', flavour: '香草，因為那是麻糬的顏色' },
  kitten: { title: '實習助手（無薪，用碎屑支付）', story: ['小奶貓是裝在紙箱裡送來的。那些紙箱本來是裝馬卡龍的。此事仍有爭議。', '牠們拍麵團、追擠花袋，偶爾在攪拌機裡睡著。產量普通，士氣極高。'], likes: '烘焙紙的沙沙聲', flavour: '剛掉到地上的那一顆' },
  apprentice: { title: '學徒，九年計畫的第一年', story: ['戴蝴蝶結是為了看起來認真。讀了半本食譜，堅稱另一半「基本上一樣」。', '曾經把糖換成鹽烤了一批。結果照樣賣光，大家因此學到錯誤的教訓。'], likes: '被誤叫成「主廚」', flavour: '薄荷，「像重新開始」' },
  baker: { title: '外殼專家', story: ['閉著眼睛也能擠出完美的殼。字面意思，因為牠通常邊做邊睡。', '拒絕透露秘訣。根據小奶貓的說法，秘訣是「當一隻烘焙貓」。'], likes: '乾淨的工作台和安靜', flavour: '檸檬，酸到可以叫醒人' },
  courier: { title: '夜間外送，風雨無阻', story: ['凌晨三點跨城送貨，大多送給兩點五十九分下單的其他貓。', '帽子是為了空氣動力學。牠從沒解釋過什麼是空氣動力學，也沒人敢問。'], likes: '濕路面的反光', flavour: '藍莓，在屋頂上吃' },
  patissier: { title: '甜點師，巴黎受訓（據說）', story: ['帶著高帽、一箱迷你打蛋器和對你甘納許的意見來的。', '帽子從沒拿下來過。員工懷疑裡面有第二隻更小的貓在真正掌廚。'], likes: '糾正別人「馬卡龍」的發音', flavour: '薰衣草，「當然」' },
  manager: { title: '營運經理', story: ['排午睡班表。全部的午睡。有一張表，表上有一個午睡。', '戴著沒有鏡片的眼鏡，因為「這樣試算表會聽話」。牠來的那週產量翻倍，所以沒人反駁。'], likes: '分顏色的便利貼', flavour: '蜜桃，歸檔在「第三季重點」' },
  influencer: { title: '230 萬粉絲，1 間店', story: ['一張照片，一萬張訂單。墨鏡在室內、冷藏庫、顯然連洗澡都戴著。', '從沒烤過任何東西，嚐過所有東西，每顆馬卡龍都評「超愛」加愛心。'], likes: '黃金時刻，以及有人跟牠講黃金時刻', flavour: '玫瑰，為了畫面' },
  deity: { title: '貓貓神（兼職）', story: ['馬卡龍自己出現在架上。別問。幾位問過的員工現在都非常有禮貌。', '光環摸起來是溫的，淡淡焦糖味。神喜歡被叫「欸你」。'], likes: '各種尺寸的紙箱供品', flavour: '海鹽焦糖，天降的' },
  timecat: { title: '時間物流', story: ['把明天的那批今天先烤好。懷錶每到星期二就倒著走，牠說「沒事」。', '偶爾會跟還沒到的客人打招呼。他們總是會出現，一臉困惑，然後買一打。'], likes: '廣義的準時', flavour: '藍莓，下週的收成' },
  cosmic: { title: '宇宙貓，宇宙的鬍鬚', story: ['整個星系，輕輕打發。皇冠是用一顆「隨便撿到」的星星做的。', '呼嚕的頻率會讓烤箱自己預熱。電費單已經變成哲學問題。'], likes: '坐在所有東西的正中央', flavour: '藍莓，「星雲的藍」' },
  rainbow: { title: '喵喵喵（別問）', story: ['有人把店長拍了太多下之後出現的。從那時起就一直在變色。', '跑過的地方都留下彩虹。小奶貓追著牠跑，店長貓已經放棄寫報告。'], likes: '剛好被拍十二下', flavour: '全部。一次。' },
};

export const SPECIES_ZH: Record<string, { name: string; blurb: string }> = {
  cat: { name: '鄰居貓', blurb: '清楚知道自己要哪一顆，但不會說。' },
  dog: { name: '柴犬常客', blurb: '對著展示櫃搖尾巴，幫全家買。' },
  rabbit: { name: '兔兔', blurb: '只要開心果的。永遠只要開心果的。' },
  bear: { name: '熊（很有禮貌）', blurb: '把整個門口都佔滿，一次點兩打。' },
  duck: { name: '鴨鴨', blurb: '付剛好的零錢。沒人知道牠零錢放哪。' },
  hamster: { name: '倉鼠', blurb: '買一顆，塞在腮幫子裡晚點吃。' },
  penguin: { name: '企鵝（觀光客）', blurb: '走了很遠的路來，把整櫃買走。' },
};

export const FURNITURE_ZH: Record<string, { name: string; desc: string }> = {
  cushion: { name: '圓坐墊', desc: '貓會翻倒在上面打盹。' },
  scratcher: { name: '柱狀貓抓板', desc: '伸出爪子，抓個過癮。' },
  cattree: { name: '貓跳台', desc: '有貓會爬上去監督整間店。' },
  hangball: { name: '懸吊球球', desc: '揮一下就盪回來。再一下。再一下。' },
  cathouse: { name: '紅頂貓屋', desc: '貓躲進去；整間屋子跟著打呼。' },
  tent: { name: '藍帳篷', desc: '裡面會亮小燈，偶爾有毛線球。' },
  bed: { name: '甜甜圈睡窩', desc: '全店最軟的午睡。' },
  fish: { name: '大魚乾布偶', desc: '被抱著踢踢腿。看過很多事。' },
};

export const DIARY_ZH: Record<DiaryKind, string[]> = {
  cuddle: ['{a} 和 {b} 在地板正中間擠成一團，說什麼都不肯動。生產線只好繞著牠們走。', '抓到 {a} 在幫 {b} 理毛。{b} 假裝不喜歡。{b} 很喜歡。', '{a} 靠著 {b} 睡著了。沒有人忍心開攪拌機。'],
  fight: ['{a} 和 {b} 為了一塊碎屑認真摔了一場。沒有贏家，兩隻都拿到馬卡龍。', '{a} 和 {b} 突然開始跑酷。有一個托盤倖存，勉強。', '{a} 從櫃檯後面偷襲 {b}。{b} 用頭槌反擊。九秒後和平恢復。'],
  nap: ['{a} 偷溜進貓屋睡覺，只看得到尾巴。', '{a} 躲到烤箱後面偷睡。烤箱很暖。這顯然是被允許的。', '在輸送帶旁發現睡著的 {a}，輕輕轉回地板上。', '{a} 宣布午睡。全店尊重。'],
  rest: ['{a} 爬到貓跳台頂端，從那裡監督整家店。', '{a} 坐在櫃檯看了一會兒街道，說是在「關心客人」。', '{a} 在展示櫃旁休息，像客人一樣盯著馬卡龍看。'],
  bless: ['貓貓神舉起一隻手。所有東西都變金色了。全店 ×{n} 快烤了一分鐘。別問。', '一道光的祝福。小奶貓從沒這麼有生產力過。神回去睡了。'],
  timeskip: ['時間貓把沙漏翻過來，整間店用 ×{n} 速跑了半分鐘。烤箱很困惑但很滿。', '一切都糊了，輸送帶嗡嗡響，時間貓看起來非常滿意。×{n} 速。'],
  star: ['{a} 抖了抖毛，整間店下了一場星塵雨。已收集 {n}/10。', '星塵落在托盤、烤箱和每隻貓頭上。{a} 看起來很得意。{n}/10。'],
  post: ['{a}'],
  customer: ['今天來了稀客：{a}。點了很多，心滿意足地走了。'],
  prestige: ['關了舊店，開了新店。+{n} ★。貓咪們當然跟著來了。'],
  rainbow: ['{a} 被拍太多下之後發生了一些事。彩虹。晶片音樂。沒有人要解釋。', '{a} 全彩虹了八秒。小奶貓試圖抓住尾巴的彩虹。'],
  chat: ['{a} 和 {b} 在櫃檯聊了好一陣子。沒人點東西，大家都很開心。', '{b} 來買馬卡龍，帶著 {a} 二十分鐘的故事離開。隔天又來了。', '{a} 和 {b} 顯然已經是老朋友了。櫃檯變成社交俱樂部。'],
  boxwalk: ['{a} 抱著大魚乾踢了整整一分鐘。魚乾看過很多事。', '大魚乾現在是 {a} 的了。其他人請以書面申請。'],
  treasure: ['{a} 走進帳篷，叼了一顆毛線球出來。哪來的？帳篷是空的。', '帳篷的秘密：{a} 在裡面找到了什麼。我們已經不問了。'],
  play: ['{a} 玩到忘記上班。', '{a} 說這是在訓練。'],
};

/** Lines tied to the exact piece of furniture / spot a cat used, so the post matches the photo. */
export const SPOT_TEXT_ZH: Record<string, string[]> = {
  cushion: ['{a} 倒在圓坐墊上，肚子朝天，睡到打呼。', '圓坐墊今天是 {a} 的。其他人請排隊。'],
  bed: ['{a} 窩進甜甜圈睡窩，只剩耳朵露出來。', '甜甜圈睡窩被 {a} 佔據了一整個下午。'],
  cathouse: ['{a} 躲進紅頂貓屋，整間屋子跟著打呼。', '貓屋門口只看得到 {a} 的尾巴。'],
  tent: ['{a} 鑽進藍帳篷，裡面的小燈亮了。', '帳篷裡傳出 {a} 的呼嚕聲。'],
  fish: ['{a} 抱著大魚乾踢了整整一分鐘，然後睡著了。', '大魚乾今天被 {a} 抱走了。'],
  oven: ['{a} 窩在烤箱旁邊睡著了。烤箱很暖。這顯然是被允許的。', '在烤箱邊發現睡著的 {a}。'],
  window: ['{a} 盯著窗外看了很久。外面什麼都沒有。', '{a} 說牠在看客人。窗外是一隻鴿子。'],
  scratcher: ['{a} 把貓抓板抓出一道新的痕跡，很滿意。', '{a} 抓貓抓板抓到忘記上班。'],
  hangball: ['{a} 對懸吊球球揮了二十下。球球每次都盪回來。', '{a} 和懸吊球球打成平手。'],
};
export const CAPTIONS_ZH = [
  '今天只想看{subject} 💕', '幕後花絮：{subject} 📸', '不用濾鏡。{subject}。', 'POV：你在貓咪馬卡龍店上班，旁邊是{subject}', '幫{subject}打分數（滿分十分，是十分）',
  '這家店真正的老闆是{subject}', '櫃檯新品上架 · 還有{subject}', '滿腦子都是{subject} 🍪', '早晨的光 + {subject} = 完美', '標記一個需要{subject}的人',
];
export const SUBJECT_ZH: Record<string, string> = { mixer: '攪拌機', piping: '擠花台', oven: '烤箱', box: '剛裝好的箱子', shopcat: '店長' };

/** Generated-upgrade wording */
export const TIER_SUFFIX_ZH = ['暖暖的肉球', '更好的打蛋器', '秘密配方', '黃金烤箱', '傳說中的午睡'];
export const CLICK_UPGRADE_ZH: Record<string, string> = { click1: '軟軟的肉球', click2: '粉紅肉墊', click3: '雙倍拍拍', click4: '呼嚕共鳴', click5: '貓咪跑酷' };
export const PCT_UPGRADE_ZH: Record<string, string> = { pct1: '鬍鬚感應', pct2: '廚房同步', pct3: '九條命' };
export const EQUIP_NAME_ZH: Record<string, [string, string, string]> = {
  mixer: ['杏仁粉過篩器', '蛋白霜攪拌機', 'Macaronage 刮刀台'],
  piping: ['圓花嘴擠花袋', '矽膠定位墊', '雙色擠花袋'],
  oven: ['晾皮架', '旋風烤箱', '層爐＋冷卻架'],
  box: ['甘納許夾餡台', '禮盒分格', '熟成冷藏櫃'],
};
export const EQUIP_FLAVOUR_ZH: Record<string, [string, string, string]> = {
  mixer: ['杏仁粉和糖粉一起過篩，沒有結塊，殼才會光滑。', '每次都打到硬性發泡，肉球不會酸。', '把麵糊壓拌到流下來像緞帶。貓咪說這是「最慢的那一步」。'],
  piping: ['同一個花嘴、同樣的力道，每顆殼一樣大。', '墊子上印好圓圈，照著擠，每一排都對齊。', '一袋裝兩色麵糊，擠出來的殼有條紋，每顆都不一樣。'],
  oven: ['擠好先晾到表面不黏手，結一層皮，裙邊就是這樣來的。', '風扇讓熱氣均勻，每顆殼烤得一樣。', '上下兩層同時烤，烤好的殼放到上面的網架放涼。'],
  box: ['擠一圈甘納許，兩片殼合起來。', '牛皮紙分格，每顆馬卡龍有自己的位置。', '冷藏一天回潮，殼變軟跟餡融在一起。客人吃得出來。'],
};
export const EQUIP_EFFECT_ZH: Record<string, string> = { mixer: '拍擊產出 +60%。', piping: '所有貓產量 +25%。', oven: '離線收益 +15% 全速。', box: '客人訂單 +60%。' };
export const STAR_UPGRADE_ZH: Record<string, { name: string; desc: string }> = {
  star_kittens: { name: '育兒室', desc: '每間新店開始就有 10 隻小奶貓。' },
  star_click: { name: '星星肉球', desc: '拍擊永久 ×2。' },
  star_offline: { name: '夜班', desc: '離線收益上限從 8 小時變 16 小時。' },
  star_global: { name: '星座', desc: '所有產量永久 +25%。' },
};
export const ACH_ZH = {
  clicks: ['熱身', '很投入', '肉球抽筋'],
  own: (name: string, n: number) => `${name} ×${n}`,
  ownDesc: (name: string, n: number) => `擁有 ${n} 隻${name}。`,
  earned: (n: string) => `${n} 個馬卡龍`, earnedDesc: (n: string) => `累計烤出 ${n} 個馬卡龍。`,
  cps: (n: string) => `${n}/秒`, cpsDesc: (n: string) => `達到每秒 ${n} 個馬卡龍。`,
  clicksDesc: (n: string) => `拍店長 ${n} 次。`,
  rainbow: { name: '喵喵喵', desc: '找到彩虹貓。' },
  prestige1: { name: '新店', desc: '開第二家店。' }, prestige5: { name: '連鎖', desc: '開到第六家店。' },
};
