# 美術規格 Art Bible

府城夜巡地圖 Tainan Gazetteer。所有新圖照這份做；需求單（`art-source/requests/`）每張都附上下面的統一 prompt。

## 已核可的基準圖

使用者在 2026-11-18 核可，風格以這些為準：

| 類別 | 基準 | 位置 |
|---|---|---|
| 建築 | 第三輪重畫（神農街屋、日式町屋、擔仔麵攤）、墨印版紅磚洋樓與木屋 | `public/art/tainan/{shennong,machiya,noodleStall,brickHouse,woodHouse}.png` |
| 樹、花草、木頭 | 第一批九宮格的櫻花、楓樹、石燈籠 | `public/art/paper-atlas.png` |
| 人物 | 墨印版小滿、狐狸 | `public/art/tainan/{miko,fox}.png` |
| 小吃、小物 | 墨印版 | `public/art/tainan/{milkfish,pengbing,dango,lantern,tileFlower,censer}.png` |

使用者的評語：喜歡建築、兩個人物和食物的風格；神明要重畫成和人物一致；第二批太立體、像泡棉膠的不要。

不是基準（2026-11-22 使用者指出缺紙質感、印刷顆粒和細節，正在重畫）：孔廟門 `confucius.png`、林百貨 `hayashi.png`。赤崁樓 `chihkan.png` 是同一批畫法，也不要拿來對照。

質感參考（只看質感，不沿用角色、文字、標誌）：`art-source/ref-yokaiya-1.png`、`ref-yokaiya-2.jpg`。

## 實景考據

真實存在的建築、地標、動植物、小吃，動筆前先搜尋實景照片，外形、比例、材質、顏色以實物為準；使用者給的照片放在 `art-source/refs/`。只參考外形，不描圖。

## 每張圖都要過的三關（使用者 2026-11-22）

1. 紙質感與印刷顆粒感：看得出紙纖維、剪紙邊、紙層重疊；色塊上有細的印刷顆粒。像 3D 模型、像寫實插畫的都退回。建築、柵欄、樹叢、花草全部一樣是紙雕；木頭和花葉的畫法照 `public/art/paper-atlas.png` 的櫻花與楓樹。
2. 顏色照實物，偏淡、偏灰；不要把實物畫成飽和的對比色。
3. 透明背景一開始就由 image_gen 生成並保留原生 alpha，不要畫在色底上再去背；邊緣不得有紅、黃等彩色殘邊。

## 統一 prompt（每張需求單開頭都貼）

```
Original Taiwanese game art for "Tainan Gazetteer" (府城夜巡地圖), set in Tainan around 1930.
Style: handmade layered paper sculpture (紙雕 / kirie), the same for buildings, trees, plants,
fences and props. Every shape is a piece of cut paper: visible paper fibres, slightly soft
hand-cut edges, pieces overlapping in shallow layers with small soft contact shadows where one
sheet sits on another. Colour is printed on the paper: clearly visible risograph / stencil print
grain and uneven ink density across every flat area, never a clean digital fill.
Details are built from small cut pieces (roof tiles, bricks, window frames, leaves, petals,
wood planks), not painted lines.
Colour: follow the real object, then mute it: pale, slightly greyed, warm. Typical tones: warm
cream, pale brick red, coral, sage and grey-green, mustard, indigo, wood brown, stone grey.
No saturated red-against-green contrast.
Do NOT make: a 3D render or clay/plastic model, smooth bevelled relief, realistic or painterly
illustration, photo textures, thick foam layers, glow, glossy highlights, black outline strokes,
smooth gradients, depth of field.
Output: generated natively on a fully TRANSPARENT background (real alpha, no chroma-key colour
behind it, no coloured fringe), every object complete and separated by clear transparent
gutters, no ground, no base, no cast shadow outside the object, no text, no captions, no logos.
View: front-facing, very slight three-quarter, the same for every object on the sheet.
```

## 各類別的規則

- **建築**：正面略側；同一張表上高度比例一致（地圖與大街上會排成一排）。要 compact：只取最有辨識度的一段（例如中央入口加左右各一兩個開間），寬不超過高的 1.4 倍，不要畫成長長一排。保留辨識特徵和細節（屋瓦、磚縫、窗框、柱頭），刪掉陪襯的盆栽、底座。不寫招牌文字。
- **街邊物件（柵欄、矮牆、樹叢、盆栽）**：和樹同一種紙雕畫法；低矮橫長、左右可拼接；柵欄是木樁加橫桿、樁間透空。
- **人物**：大頭短身（約 2 到 2.5 頭身），大眼、有高光、有表情；和小滿、狐狸同一套臉與比例。
- **神明**：和人物同一套比例與臉；服飾、持物保留辨識度但不比人物繁複。只當神像或圖示，不當敵人。
- **妖怪、動物**：可愛、輪廓單純，縮到 30 到 50 px 高仍認得出來。
- **小吃**：商品圖示，一份一格，內容物看得清楚。
- **樹**：比建築略高，樹冠是一層層紙片；同一棵會同時用在背景和前景。

## 交付格式

- PNG，透明背景。一張表最多 6 個物件（3×2），或單張。
- 物件之間留透明間隔，不要互相碰到，不要碰到畫布邊緣。
- 紙偶零件的規格見 `RIG-SPEC.md`。
- 檔名用需求單上的英文 key。

## 驗收（Claude review）

1. 透明背景，沒有底紙、光暈、殘留色塊。
2. 物件完整、沒被裁切，數量和需求單一致。
3. 風格對得上基準圖：看得出紙纖維、剪紙邊和紙層；印刷顆粒明顯；不是 3D 模型、不是寫實插畫、沒有泡棉厚度。放大到 200% 檢查。
3a. 顏色照實物且偏淡；和使用者給的照片（`art-source/refs/`）並排比對。
3b. 邊緣沒有紅、黃等彩色殘邊。
4. 縮到遊戲內高度仍清楚。
5. 沒有文字、標誌，沒有照搬其他作品的角色。
6. 以上有一條不過就退回重畫，不遞給使用者。通過後截圖給使用者，使用者核可才上線。
