# 植物變體：讓花叢、灌木、草叢不重複

- 需求單：`31-plant-variants`
- 交付到：`art-inbox/31-plant-variants/`（附 `batch.json`）
- 檔案：每一件單獨一張 PNG（不要拼成格子表），檔名見下。
- 先讀 `docs/art/ART-BIBLE.md` 通用原則，特別是 10a（照實際大小、元素大小固定）、12a（超出格子、相鄰重疊）、新加的 9a（變體）。

## 為什麼

使用者 2026-11-22：「其他植物 asset 也可以多生成幾個，這樣看起來也不會太重複。」遊戲會依位置自動在同一種植物的幾個版本之間輪流挑，所以每種要再多兩三個版本。

## 標準

- 畫法照使用者核可的 `art-source/refs/plumeria-approved-old.png` 與 `art-inbox/29-plumeria-true-size/candidate-1.png`：葉叢飽滿成團、紙纖維明顯；不要像 29 的 candidate-2 到 4 那樣稀疏（使用者覺得太寫實、看起來很虛）。把它們和 `public/art/paper-atlas.png` 當風格輸入圖。
- 現有版本在 `public/art/tainan/<key>.png`，新版本要是「同一種植物的另一株」：同樣的顏色和葉子大小，但輪廓、葉子排法、花的位置和數量都不同。
- 尺寸：花叢、灌木在遊戲裡約 24 單位高，存檔 6 倍，每張約 144 px 高、寬約 170 px；草叢約 16 單位，約 96 px 高。葉子約 6–9 單位（36–54 px）、花約 5–8 單位（30–48 px）。

## 內容（每個檔一件）

- 灌木：`bushC.png`、`bushD.png`
- 白花叢：`flowerWhite2.png`、`flowerWhite3.png`
- 黃花叢：`flowerYellow2.png`、`flowerYellow3.png`
- 粉花叢：`flowerPink2.png`、`flowerPink3.png`
- 草叢：`grassTuft2.png`、`grassTuft3.png`、`grassTuft4.png`（高矮、葉數、彎的方向不同）

原生透明背景，無光暈、無底色。如果某件生成多次，候選也一起放進資料夾（`<檔名>-candidate-N.png`）。
