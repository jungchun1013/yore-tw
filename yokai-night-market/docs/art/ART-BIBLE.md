# 美術規格 Art Bible

府城夜巡地圖 Tainan Gazetteer。所有新圖照這份做；需求單（`art-source/requests/`）每張都附上下面的統一 prompt。

## 已核可的基準圖

使用者在 2026-11-18 核可，風格以這些為準：

| 類別 | 基準 | 位置 |
|---|---|---|
| 建築 | 第三輪重畫（赤崁樓、神農街屋、林百貨、孔廟門庭、日式町屋、擔仔麵攤） | `public/art/tainan/{chihkan,shennong,hayashi,confucius,machiya,noodleStall}.png` |
| 人物 | 墨印版小滿、狐狸 | `public/art/tainan/{miko,fox}.png` |
| 小吃、小物 | 墨印版 | `public/art/tainan/{milkfish,pengbing,dango,lantern,tileFlower,censer}.png` |

使用者的評語：喜歡建築、兩個人物和食物的風格；神明要重畫成和人物一致；第二批太立體、像泡棉膠的不要。

質感參考（只看質感，不沿用角色、文字、標誌）：`art-source/ref-yokaiya-1.png`、`ref-yokaiya-2.jpg`。

## 統一 prompt（每張需求單開頭都貼）

```
Original Taiwanese game art for "Tainan Gazetteer" (府城夜巡地圖), set in Tainan around 1930.
Style: layered kirie paper cut-outs with fine printed pigment. Thin washi sheets pressed almost
flush; visible, intentional overlaps between cut shapes; very faint short warm contact shadows
under only some edges. Flat matte spot colours with subtle ink-density variation and an
extremely fine low-contrast stencil grain. Palette: warm cream, vermilion, coral, sage, mustard,
indigo, wood brown; slightly muted.
Do NOT use: bevels, foam thickness, 3D extrusion, glow, glossy shading, crumpled or spongy
texture, black outline strokes, gradients, photographic depth of field.
Output: fully TRANSPARENT background, every object complete and separated by clear transparent
gutters, no ground, no base, no cast shadow outside the object, no text, no captions, no logos.
View: front-facing, very slight three-quarter, the same for every object on the sheet.
```

## 各類別的規則

- **建築**：正面略側；同一張表上高度比例一致（地圖與大街上會排成一排）。保留辨識特徵，刪掉陪襯的盆栽、底座。不寫招牌文字。
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
3. 風格對得上基準圖：平、薄、有印刷顆粒，沒有泡棉厚度。
4. 縮到遊戲內高度仍清楚。
5. 沒有文字、標誌，沒有照搬其他作品的角色。
6. 通過後截圖給使用者，使用者核可才上線。
