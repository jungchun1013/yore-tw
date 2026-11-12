# 開發日誌：結構與素材整理

給 Joan 和 Codex 用。這份只整理「放在哪裡、長什麼樣、有哪些事實可寫」。文章本身由 Joan 用 Codex 寫。

## 目前的做法（2026-11-13）

每日日誌由 `docs/devlog-gen.py` 的 POSTS 清單產生，跑 `python3 -X utf8 docs/devlog-gen.py` 會重寫 `site/devlog/`。新的一天就在 POSTS 加一筆（日期、中英標題、各專案的中英句子）。白描，短句，不加情緒。長篇文章仍可用下面的模板另外寫。

## 放在哪裡

- 每篇一個檔案：`site/devlog/YYYY-MM-DD-slug.html`，例如 `site/devlog/2026-11-12-site-launch.html`。
- 目錄頁：`site/devlog/index.html`，手動列出每篇（新的在上面）。
- 圖片：`site/assets/devlog/`，webp 或 png，每張 200 KB 以內，寬 1200px 以內。
- 模板：`docs/devlog-template.html`，複製後改內容。
- 第一篇上線時，首頁和 footer 要加「開發日誌 / Devlog」連結（`site/index.html`、各頁 footer）。

## 建置會自動做的事

`npm run site` 跑 `site/build.cjs`，對 `site/` 底下每個 html：

- 產出中文版在 `/zh/devlog/...`，英文版在 `/en/devlog/...`。同一個原始檔寫中英兩份，用 `lang="zh"` 和 `lang="en"` 標在元素上，建置時各留一種。
- 自動加 canonical、hreflang、og:url，把 `.html` 連結改成無副檔名。
- 自動加進 sitemap.xml，lastmod 取該檔最後一次 commit 的日期。

所以新增一篇只要：複製模板、寫內容、在 index.html 加一列、commit、push。

## 文章格式

- `<title>` 只能有一個，中英共用，所以用英文短語：`Site launch | yore game studio`。文內的 h1 中英各一個。
- `<meta name="description" lang="zh">` 和 `lang="en"` 各一個，120 字以內。
- 文內第一行是日期和遊戲名，例如 `2026-11-12 · Souls in Abyss`。
- 正文 300 到 800 字。標題最多兩層（h1、h2）。
- 一到三張圖，有圖說。截圖直接放遊戲畫面，不加邊框和裝飾。
- 英文從中文翻，不另外寫。
- 沒有 emoji，沒有驚嘆號，不寫「超級」「爆炸」「溫暖」一類形容詞。
- 每篇結尾放一行遊戲連結：`遊玩：/souls-in-abyss/`。

## 可以寫的事實

### 時間軸（來自 git）

| 日期 | 事 |
| --- | --- |
| 2026-11-02 | 第一個 commit：Meowcaron v45，入口網站 |
| 2026-11-03 ~ 11-06 | Meowcaron v60 到 v67：像素編輯器匯入精靈、輸送帶、經濟改成按遊玩時段計算、偷吃、烤箱溫度、四步教學 |
| 2026-11-06 | 網站搬到 Cloudflare Workers，yore-tw.com 和 www 上線 |
| 2026-11-06 | Meowcaron 預設英文，加 CrazyGames adapter |
| 2026-11-07 | 第二款遊戲開工，原名 Aeon Brave，同日改名 Souls in Abyss |
| 2026-11-07 | AdSense 驗證碼和 ads.txt 上線 |
| 2026-11-08 | Souls in Abyss 一天內 60 多個 commit：角色創建、裝備盤、鐵匠、地圖、寵物、SAN、戰鬥背景 |
| 2026-11-08 | repo 拆成 workspaces：meowcaron、souls-in-abyss、site |
| 2026-11-08 | Planet Wanderer 開工，three.js 小星球，一開始就是多場景 |
| 2026-11-09 | Planet Wanderer 以美術 demo 身分上線，第三種渲染「Sky」 |
| 2026-11-09 | 網站換色：深色和陰影改用 Souls in Abyss 的色票，icon 改用 Pixelarticons |
| 2026-11-10 | Souls in Abyss：SAN 規則（高於等級死亡才扣、歸零昏迷回草原）、瘋狂的祝福與詛咒 |
| 2026-11-11 | Google Analytics 全站，Souls in Abyss 中文名改為奈落魂迴，網站文案全部改寫 |
| 2026-11-11 | 網站拆成中英兩棵頁面樹，加 hreflang 和 sitemap |

### Meowcaron

- 像素風貓咪馬卡龍烘焙坊，放置點擊類。俯視 Overcooked 式 3/4 視角。
- 系統：拍店長、僱貓（會在店裡走動、在機器前工作）、四台機器各三級升級、客人每 35 到 70 秒上門、日誌（每隻貓的拍立得和小故事）、離線收益、成就、轉生星星。
- 貓是真的花色（橘白、三花、白、黑、乳牛、虎斑、灰白），不是換色。
- 技術：Phaser，Vite 4，Playwright 測試，經濟有無頭模擬器（`npm run sim`）跑節奏檢查。
- 平台：瀏覽器，電腦和手機。CrazyGames 版本準備中。
- 目前狀態：Beta。

### Souls in Abyss 奈落魂迴

- 放置 RPG，自動戰鬥。一句話：所有靈魂最後都會落入深淵。
- 系統：種族和年齡選擇、每歲和每級成長、裝備盤（Minecraft 式格子）、鐵匠強化（+9 以上失敗會毀掉）、稀有度五階、八個區域的地圖和戰鬥背景、寵物（有 HP/MP，會擋傷害）、技能可開關、SAN（理智）、轉生時的祝福與詛咒、輪迴繼承。
- 美術：Cubic 11 像素字體，game-icons.net 的 icon，Codex 畫的世界地圖和戰鬥背景。
- 靈感來源：BWE 類的白底自動 RPG 版面，借系統和版面概念，重新設計外觀和文字。
- 技術：TypeScript，無框架，存檔有版本遷移（v5 拿掉 Magic 稀有度）。
- 目前狀態：原型。

### Planet Wanderer 小星球漫遊

- three.js 小星球，三種渲染可切換：薩爾達式卡通、光遇式逆光、3D 像素。
- 場景是資料，多星球結構。木屋、籬笆、樹、石圈遺跡、湖邊岩石、池塘錦鯉、帳篷、靈獸（鹿）。
- 還不是遊戲：沒有任務、存檔、可撿的東西。
- 目前狀態：美術 Demo。

### 工作室

- 一人：Joan，美術、程式、文案。來自台南。
- 工具：Claude Code 和 Codex 兩個 AI 工具分工，Codex 畫像素圖和部分美術，Claude 處理程式和網站。這點可以寫，也可以不寫，由 Joan 決定。
- 部署：GitHub push 後 Cloudflare Workers 自動建置。

## 建議的前三篇

只列題目和該放的事實，不寫稿。

1. 網站上線和三款遊戲的現況。用時間軸表的前半，三款各一段，各一張截圖。
2. Souls in Abyss 的 SAN 系統。規則：高於自己等級的敵人殺死你才扣；瘋狂時能力有祝福也有詛咒；歸零會昏迷，醒來在草原上，身上東西變少。可以寫為什麼要有這個系統（放置遊戲通常沒有風險）。
3. Meowcaron 的經濟是怎麼調的。無頭模擬器、按遊玩時段計算、離線六小時後降到 10%、轉生用立方根。

## 給 Codex 的一段

> 寫 yore game studio 的開發日誌。讀 docs/devlog-brief.md 的事實和格式規範，用 docs/devlog-template.html 當結構。中文先寫，英文從中文翻。語氣平鋪直敘，像寫給另一個開發者看的筆記，不是宣傳文。不確定的事實不要補，留空問。
