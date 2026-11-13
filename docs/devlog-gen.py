# Generates site/devlog/index.html and one page per day from POSTS. Run from the repo root: python3 -X utf8 docs/devlog-gen.py
import pathlib, html

# (date, title zh, title en, [(project zh, project en, [zh sentences], [en sentences]), ...])
POSTS = [
 ("2026-11-02", "Meowcaron v45 和入口網站進 repo", "Meowcaron v45 and the entry site enter the repo", [
  ("Meowcaron", "Meowcaron", [
   "Meowcaron v45 和入口網站一起進了 repo。這時候的遊戲已經有店貓可以拍、可以僱貓、四台機器各三級升級、會上門的客人、每隻貓的日誌、離線收益和轉生星星。",
   "入口網站只有一頁，列出遊戲。"],
   ["Meowcaron v45 and the entry site went into the repo together. By this point the game already had a shop cat to pat, cats for hire, four machines with three upgrade tiers each, walk-in customers, a journal page per cat, offline earnings and prestige stars.",
    "The entry site was a single page listing the games."]),
 ]),
 ("2026-11-03", "Meowcaron v60：像素編輯器匯入、輸送帶外框", "Meowcaron v60: editor sprite imports, belt frame", [
  ("Meowcaron", "Meowcaron", [
   "v60。精靈可以從線上像素編輯器匯入，輸送帶有了外框，圖層順序的錯誤修掉。"],
   ["v60. Sprites can be imported from the online pixel editor, the conveyor belt got a frame, and layer-order bugs were fixed."]),
 ]),
 ("2026-11-05", "Meowcaron v61 到 v66：按時段的經濟、偷吃、烤箱溫度", "Meowcaron v61 to v66: session-paced economy, sneak-eating, oven warmth", [
  ("Meowcaron", "Meowcaron", [
   "v61 到 v66，一天六版。",
   "經濟改成按遊玩時段計算。貓會偷吃，烤箱有溫度。第一次點擊就結束偷懶，客人會標記店家。",
   "機器底下鋪了鋼板，圖示改成肉球，繩子加長，手機版修了幾個排版。鋼桌站在地板上，比架子再深一點。",
   "效果條改成像素的，貓有嚼食動畫，架子整理過，音效和語言搬進設定。輸送帶改跑在包裝機前面，蒸氣是真的粒子。"],
   ["v61 to v66, six builds in one day.",
    "The economy is now paced by play session. Cats sneak food, the oven has warmth. The first tap ends slacking, and customers tag the shop.",
    "Steel plates went under the machines, icons became paw pads, the rope got longer, and several phone layouts were fixed. Steel tables stand on the floor, a touch deeper than the rack.",
    "Effect bars are pixel now, cats chew, the shelf was tidied, and sound and language moved into settings. The belt runs in front of the packaging machine, and the steam is real particles."]),
 ]),
 ("2026-11-06", "yore-tw.com 上線；Meowcaron v67 四步教學", "yore-tw.com goes live; Meowcaron v67 onboarding", [
  ("網站", "Site", [
   "網站搬到 Cloudflare Workers，yore-tw.com 和 www 都接上了。"],
   ["The site moved to Cloudflare Workers, with yore-tw.com and www attached."]),
  ("Meowcaron", "Meowcaron", [
   "v67。四步教學，沒有框，可以重播。攪拌機往左移一格。",
   "Codex 重畫了家具、機器、輸送帶和肉球圖示，順便做了一輪密度調整和文字修改。",
   "預設語言改成英文。被 CrazyGames 嵌入時會載入他們的 adapter。上傳資料夾和截圖更新。"],
   ["v67. A four-step onboarding without frames, replayable. The mixer moved one cell left.",
    "Codex redrew the furniture, machines, conveyor and paw icons, with a density pass and UI text changes.",
    "English is the default language. When framed by CrazyGames the game loads their adapter. Upload folder and screenshots refreshed."]),
 ]),
 ("2026-11-07", "Souls in Abyss 開工：白底自動 RPG、祝福與詛咒、理智", "Souls in Abyss begins: white auto-RPG, gifts and curses, sanity", [
  ("Souls in Abyss", "Souls in Abyss", [
   "新遊戲開工，原名 Aeon Brave，是 BWE 那類白底自動 RPG 的結構。當天改名 Souls in Abyss，文案全部換成深淵的語氣：區域、轉生、死亡、旁白。",
   "白色版面，瑪奇式的能力值和年齡成長，紙娃娃，依等級排的技能分頁，Cubic 11 像素字體。",
   "中文名暫定輪迴無止盡。轉生時有祝福與詛咒可選，加了理智值。"],
   ["A new game started, first named Aeon Brave, built on the white auto-RPG layout of the BWE kind. It was renamed Souls in Abyss the same day, and every line of copy switched to the Abyss voice: areas, rebirth, deaths, narrator.",
    "White layout, Mabinogi-style stats and age growth, a paper doll, skill tabs ranked by level, the Cubic 11 pixel font.",
    "The Chinese name was provisionally 輪迴無止盡. Rebirth offers gifts and curses, and a sanity stat was added."]),
  ("網站", "Site", [
   "放上 AdSense 驗證碼和 ads.txt。廣告位先藏著，等審查過再開。"],
   ["AdSense verification code and ads.txt went up. Ad slots are hidden until the review passes."]),
 ]),
 ("2026-11-08", "Souls 六十個 commit：創角、裝備盤、鐵匠、地圖、寵物；Planet Wanderer 開工", "Sixty Souls commits: creation, equipment board, smith, map, pals; Planet Wanderer begins", [
  ("Souls in Abyss", "Souls in Abyss", [
   "六十多個 commit。",
   "角色創建：BWE 式橫幅，選種族和年齡，能力表，SAO 式拉丁字體，後來全部改回 Cubic 11。年齡數字浮在人物上方，手機版排成一欄。",
   "圖示全部換成 game-icons.net 的，英文模式不再夾中文。像素字體對齊到格線。",
   "戰鬥面板：戰力領頭，經驗和理智條不閃，紀錄一行一殺。攻速改成敏捷衍生，掉寶率詞綴換成幸運。",
   "地圖先改成圖示節點，晚上換成 Codex 畫的世界地圖，節點點了就走，去過的變深，當前位置金框，越往深處越紫。",
   "裝備盤改成 Minecraft 式格子，加護腿、護符、盾。鐵匠強化，+9 以上失敗會毀掉。寵物有 HP 和 MP，會替你擋四分之一的攻擊，MP 滿了放大招。",
   "技能可以點開關。背包獨立一頁。八個區域都有 Codex 畫的戰鬥背景，兩層捲動。稀有度拿掉 Magic，存檔升到 v5 自動遷移。金幣顯示完整數字。"],
   ["Sixty-odd commits.",
    "Character creation: a BWE-style banner, race and age picks, a stat table, a SAO-like Latin font that was later replaced by Cubic 11 throughout. The age number floats above the figure; the phone layout is one column.",
    "Every icon now comes from game-icons.net, and English mode no longer mixes in Chinese. Pixel text snaps to the grid.",
    "Battle panel: combat power leads, EXP and SAN bars no longer flicker, the log writes one line per kill. Attack speed derives from SPD; the drop-rate affix became LUCK.",
    "The map first became icon nodes, then that evening Codex's painted world map: click a node to travel, visited nodes darken, the current one gets a gold frame, and the shade deepens to violet toward the Abyss.",
    "The equipment board became Minecraft-style cells with leggings, charms and shields. Blacksmith upgrades: a failure at +9 or higher destroys the item. Pals have HP and MP, take a quarter of the blows, and go all out on a full MP bar.",
    "Skills can be toggled. The bag is its own page. All eight areas have Codex's painted battle backgrounds scrolling in two layers. The Magic rarity tier is gone; saves migrate to v5. Gold shows the full number."]),
  ("Repo", "Repo", [
   "拆成 workspaces：meowcaron、souls-in-abyss、site。Cloudflare 改成用 npm run site 建置後部署。"],
   ["Split into workspaces: meowcaron, souls-in-abyss, site. Cloudflare now builds with npm run site before deploying."]),
  ("網站", "Site", [
   "為了 AdSense 審查改版：每款遊戲一頁介紹，關於頁和聯絡頁。Souls 的封面用世界地圖底部，Meowcaron 的封面是整間店。"],
   ["Reworked for the AdSense review: a page per game, an about page and a contact page. The Souls cover is the bottom of the world map; the Meowcaron cover is the whole shop."]),
  ("Planet Wanderer", "Planet Wanderer", [
   "第三個專案開工。three.js 小星球，一開始就是多場景。木屋、籬笆、長大的樹、碎石小路、石圈遺跡、湖邊岩石。預設是柔和的卡通渲染，像素風可以切換。苔綠和薰衣草的配色，雲影，頂光邊緣。"],
   ["A third project started. A three.js tiny planet, multi-scene from the first commit. A cabin, a fence, grown trees, cobbled paths, a ring ruin, lakeside rocks. Soft cel shading by default, a pixel style as a toggle. Moss and lavender palette, cloud shadows, top-lit edges."]),
 ]),
 ("2026-11-09", "Planet Wanderer 上線，第三種渲染 Sky；網站換深淵色票", "Planet Wanderer goes live with the Sky render; site darks from the Abyss palette", [
  ("Planet Wanderer", "Planet Wanderer", [
   "像素風的描邊改在全解析度畫。天空換成虫羊氏那種鋼藍到長春花的漸層，雲是一塊塊的筆觸。第三種渲染叫 Sky：逆光、太陽眩光、光束。",
   "以沙盒的身分上線。Codex 做了一輪美術：旅人、木屋、雲杉，接縫處才混像素。旅人改成窄肩斗篷，加了一隻靈鹿。開發日誌開始記每一輪的指令和結果。"],
   ["The pixel style draws its outlines at full resolution. The sky became the Chongyang-shi gradient, steel blue to periwinkle, with clouds as flat brush blocks. A third render style, Sky: backlight, sun glare, god rays.",
    "It went live as a sandbox. Codex did an art pass: traveller, cabins, spruces, with pixel mixing only at the seams. The traveller became a narrow-shouldered cape figure, and a spirit deer arrived. A dev journal started recording each round's instruction and result."]),
  ("網站", "Site", [
   "深色和陰影改用 Souls 的色票，馬卡龍的填色留著。▶ → ♥ ✨ 這些符號換成 Pixelarticons 的像素圖示。"],
   ["Darks and shadows now come from the Souls palette; the macaron fills stay. The ▶ → ♥ ✨ glyphs became Pixelarticons pixel icons."]),
 ]),
 ("2026-11-10", "Souls 理智規則改版；Planet 靈獸換平滑模型", "Souls sanity rework; Planet spirit animals on smooth models", [
  ("Souls in Abyss", "Souls in Abyss", [
   "找回前幾天被蓋掉的技能開關、背包列、裝備清單、間距和技能顏色。",
   "理智改版：被高於自己等級的敵人殺死才會扣。瘋狂的時候能力有祝福也有詛咒。歸零會昏迷，醒來在草原上，東西變少。瘋狂的暗角最多壓到八成，開場不低於四成五，角色表要看得見。"],
   ["Restored the skill toggle, bag rows, equipment list, spacing and skill colours that had been overwritten days earlier.",
    "Sanity reworked: you lose it only when killed by an enemy above your level. Madness blesses and curses abilities. At zero you black out and wake on the meadow with less. The madness vignette darkens at most 80%, and never under 45% at its opening, so the sheet stays readable."]),
  ("Planet Wanderer", "Planet Wanderer", [
   "靈獸改用平滑過的 CC0 模型，材質像守護神咒。鹿身重做好幾輪：Taubin 平滑、深度預通道、瘦長的靜態身體、鹿角重新安在頭骨上，最後決定讓公鹿用模型自己的角，不再嫁接。"],
   ["Spirit animals now use smoothed CC0 base models with a Patronus-like material. The deer body went through several rounds: Taubin relaxation, a depth prepass, slender static bodies, antlers re-seated on the skull, and finally the stag keeps its model's own antlers instead of grafted ones."]),
 ]),
 ("2026-11-11", "全站文案改寫、GA 上線、中英分頁；Souls 改名奈落魂迴", "Site copy rewritten, GA on, zh/en split; Souls renamed 奈落魂迴", [
  ("網站", "Site", [
   "Google Analytics 全站上線，三款遊戲也有。",
   "文案全部重寫。拿掉店貓旁白，改成工作室的口吻，首頁和關於頁的字由 Joan 寫，英文從中文翻。",
   "存檔與隱私分三層：首頁兩段，遊戲頁一列，隱私權政策全文。",
   "中英文拆成兩棵頁面樹，每頁有 canonical 和 hreflang，sitemap 改成建置時產生。"],
   ["Google Analytics is on every page, the three games included.",
    "All copy rewritten. The cat narrator is gone; the home and about pages are in the studio's voice, written by Joan, with English translated from the Chinese.",
    "Saves and privacy in three layers: two paragraphs on the home page, one row on each game page, the full text in the privacy policy.",
    "Chinese and English split into two page trees, each page with canonical and hreflang, and the sitemap generated at build time."]),
  ("Souls in Abyss", "Souls in Abyss", [
   "中文名改成奈落魂迴。標語只剩一句：所有靈魂最後都會落入深淵。"],
   ["The Chinese name became 奈落魂迴. The tagline is one line: every soul falls into the Abyss in the end."]),
  ("Planet Wanderer", "Planet Wanderer", [
   "像素風改回一倍。池塘裡有錦鯉和蓮花，多了兩頂帳篷，草地安靜一點。"],
   ["The pixel look is back at 1x. The pond has koi and lotus, two canvas tents were added, and the meadow is calmer."]),
 ]),
 ("2026-11-12", "Prism Defense 上線並改深色；網站換藍色強調與地球選單", "Prism Defense goes live and goes dark; site gets the blue accent and globe menu", [
  ("Prism Defense", "Prism Defense", [
   "塔防遊戲上線。六種塔，二十波，三張地圖，十五項永久研究。",
   "整個遊戲改成低飽和的深色。塔縮小到 35px，敵人縮一成。精靈改用自己的輪廓定位，底盤真的踩在格子上，穿光塔再往上兩像素。",
   "晚上併入 Codex 的新版：地圖可以縮放和平移，Boss 出場時場地會暗下來，自動開波，波次情報，地圖預覽。"],
   ["The tower defence went live. Six towers, twenty waves, three maps, fifteen permanent research items.",
    "The whole game moved to a low-saturation dark theme. Towers shrank to 35px, enemies by a tenth. Sprites are now anchored by their own footprint, so bases sit on the tile; the beam tower sits two pixels higher.",
    "In the evening Codex's newer build was merged in: the board zooms and pans, the field dims when a boss arrives, auto waves, wave intel, a map preview."]),
  ("網站", "Site", [
   "中文搬到 /zh/，和 /en/ 對稱。首頁分成遊戲和沙盒兩區。",
   "換色：星球天空的藍當強調色，底色是米白，卡片和按鈕沒有邊框，陰影用深淵的綠。語言切換改成地球圖示的下拉選單。網站圖示換成店貓。頁尾只留關於、聯絡、隱私。",
   "區塊標題前加了手把和城堡的圖示。"],
   ["Chinese moved to /zh/, symmetric with /en/. The home page split into Games and Sandbox.",
    "New colours: the Planet Wanderer sky blue as the accent, an off-white background, borderless cards and buttons, Abyss green for shadows. The language switch is a globe with a dropdown. The site icon is the shop cat. The footer keeps About, Contact and Privacy.",
    "A game controller and a castle icon sit before the section headings."]),
 ]),
 ("2026-11-13", "英文改為預設語言；開發日誌上線", "English becomes the default; the devlog goes live", [
  ("網站", "Site", [
   "英文改成預設語言。根網址轉到 /en/，搜尋引擎的 x-default 也指向英文頁。",
   "開發日誌上線，就是這一頁。從第一個 commit 開始，每天一篇。"],
   ["English is now the default. The root URL goes to /en/, and the x-default hint for search engines points at the English pages.",
    "The devlog went live, this page included. One entry per day, from the first commit on."]),
 ]),
]

GTM = '''  <!-- Google tag (gtm) -->
  <script async src="https://www.googletagmanager.com/gtm.js?id=GTM-T59Q3ZDN"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
  </script>'''
HEAD = '''<!doctype html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
%s
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>%s</title>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2972514108022599" crossorigin="anonymous"></script>
  <meta name="yore-ad-slot" content="" />
  <meta name="description" lang="zh" content="%s" />
  <meta name="description" lang="en" content="%s" />
  <meta property="og:title" content="%s" />
  <meta property="og:description" lang="zh" content="%s" />
  <meta property="og:description" lang="en" content="%s" />
  <meta property="og:image" content="https://yore-tw.com/assets/souls-cover.png" />
  <link rel="icon" href="../favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="../style.css" />
  <script src="../_shared.js"></script>
</head>
<body>
  <div class="wrap">
    <header class="top">
      <a class="brand" href="../"><img src="../favicon.svg" alt="" />yore.tw</a>
      <nav><a href="../#games"><span lang="zh">遊戲</span><span lang="en">Games</span></a><a href="index.html"><span lang="zh">日誌</span><span lang="en">Devlog</span></a><a href="../about.html"><span lang="zh">關於</span><span lang="en">About</span></a><a href="../contact.html"><span lang="zh">聯絡</span><span lang="en">Contact</span></a><button id="lang" class="lang-btn" type="button">EN</button></nav>
    </header>
'''
FOOT = '''    <div class="ad-slot" aria-label="ad"></div>
    <footer>
      <div>© 2026 yore.tw</div>
      <div><a href="index.html"><span lang="zh">開發日誌</span><span lang="en">Devlog</span></a> · <a href="../about.html"><span lang="zh">關於</span><span lang="en">About</span></a> · <a href="../contact.html"><span lang="zh">聯絡</span><span lang="en">Contact</span></a> · <a href="../privacy.html"><span lang="zh">隱私權政策</span><span lang="en">Privacy</span></a></div>
    </footer>
  </div>
</body>
</html>
'''
def esc(s): return html.escape(s, quote=True)
out = pathlib.Path('site/devlog'); out.mkdir(exist_ok=True)
posts = list(reversed(POSTS))  # newest first
for i, (date, tzh, ten, groups) in enumerate(posts):
    first_zh = groups[0][2][0]; first_en = groups[0][3][0]
    body = HEAD % (GTM, esc(date + ' ' + ten + ' | yore game studio'), esc(first_zh), esc(first_en), esc(date + ' ' + ten + ' | yore game studio'), esc(first_zh), esc(first_en))
    body += '    <article class="doc prose">\n'
    body += '      <p class="crumbs"><a href="../"><span lang="zh">首頁</span><span lang="en">Home</span></a> / <a href="index.html"><span lang="zh">開發日誌</span><span lang="en">Devlog</span></a></p>\n'
    body += '      <h1 lang="zh">%s</h1><h1 lang="en">%s</h1>\n      <p class="meta">%s</p>\n' % (esc(tzh), esc(ten), date)
    for pzh, pen, zh, en in groups:
        body += '      <h3 lang="zh">%s</h3><h3 lang="en">%s</h3>\n' % (esc(pzh), esc(pen))
        for s in zh: body += '      <p lang="zh">%s</p>\n' % esc(s)
        for s in en: body += '      <p lang="en">%s</p>\n' % esc(s)
    newer = posts[i - 1] if i > 0 else None; older = posts[i + 1] if i + 1 < len(posts) else None
    body += '      <p class="next">'
    body += ('<a href="%s.html"><span lang="zh">← %s</span><span lang="en">← %s</span></a>' % (older[0], older[0], older[0])) if older else '<span></span>'
    body += ('<a href="%s.html"><span lang="zh">%s →</span><span lang="en">%s →</span></a>' % (newer[0], newer[0], newer[0])) if newer else '<span></span>'
    body += '</p>\n    </article>\n' + FOOT
    (out / (date + '.html')).write_text(body, encoding='utf8')


# ---- one page per project: that project's entries only, newest first
PROJECTS = [
 ('meowcaron', 'Meowcaron', 'Meowcaron', 'Meowcaron'),
 ('souls-in-abyss', 'Souls in Abyss', 'Souls in Abyss 奈落魂迴', 'Souls in Abyss'),
 ('prism-defense', 'Prism Defense', 'Prism Defense 稜光防線', 'Prism Defense'),
 ('planet-wanderer', 'Planet Wanderer', 'Planet Wanderer 小星球漫遊', 'Planet Wanderer'),
 ('site', '網站', '網站', 'Site'),
]
for slug, key, tzh, ten in PROJECTS:
    page = HEAD % (GTM, esc(ten + ' devlog | yore game studio'), esc(tzh + ' 每一天的更新紀錄。'), esc('What changed in ' + ten + ', day by day.'), esc(ten + ' devlog | yore game studio'), esc(tzh + ' 每一天的更新紀錄。'), esc('What changed in ' + ten + ', day by day.'))
    page += '    <article class="doc prose">\n'
    page += '      <p class="crumbs"><a href="../"><span lang="zh">首頁</span><span lang="en">Home</span></a> / <a href="index.html"><span lang="zh">開發日誌</span><span lang="en">Devlog</span></a></p>\n'
    page += '      <h1 lang="zh">%s 更新紀錄</h1><h1 lang="en">%s update log</h1>\n' % (esc(tzh), esc(ten))
    page += '      <p lang="zh">只列這個專案的部分，新的在上面。全部專案看<a href="index.html">開發日誌</a>。</p><p lang="en">This project only, newest first. See the <a href="index.html">devlog</a> for everything.</p>\n'
    n = 0
    for date, dzh, den, groups in posts:
        for pzh, pen, zh, en in groups:
            if pzh != key: continue
            n += 1
            page += '      <h3><a href="%s.html">%s</a></h3>\n' % (date, date)
            for x in zh: page += '      <p lang="zh">%s</p>\n' % esc(x)
            for x in en: page += '      <p lang="en">%s</p>\n' % esc(x)
    page += '    </article>\n' + FOOT
    (out / (slug + '.html')).write_text(page, encoding='utf8')
    print('project page', slug, n, 'days')

idx = HEAD % (GTM, 'Devlog | yore game studio', 'yore game studio 的開發日誌。從第一個 commit 開始，每天記下改了什麼。', 'The yore game studio devlog. What changed, day by day, from the first commit on.', 'Devlog | yore game studio', 'yore game studio 的開發日誌。從第一個 commit 開始，每天記下改了什麼。', 'The yore game studio devlog. What changed, day by day, from the first commit on.')
idx += '    <article class="doc prose">\n      <h1 lang="zh">開發日誌</h1><h1 lang="en">Devlog</h1>\n'
idx += '      <p lang="zh">每天改了什麼，照 commit 紀錄寫。</p><p lang="en">What changed each day, written from the commit log.</p>\n'
idx += '      <p class="proj-links">' + ' · '.join('<a href="%s.html">%s</a>' % (slug, html.escape(ten)) for slug, key, tzh, ten in PROJECTS) + '</p>\n'
idx += '      <ul class="log-list">\n'
for date, tzh, ten, groups in posts:
    names = ' · '.join(g[0] for g in groups); names_en = ' · '.join(g[1] for g in groups)
    idx += '        <li><time datetime="%s">%s</time><a href="%s.html"><span lang="zh">%s<small>%s</small></span><span lang="en">%s<small>%s</small></span></a></li>\n' % (date, date, date, esc(tzh), esc(names), esc(ten), esc(names_en))
idx += '      </ul>\n    </article>\n' + FOOT
(out / 'index.html').write_text(idx, encoding='utf8')
print('devlog pages', len(posts) + 1)
