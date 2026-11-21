# 重畫：三個地標與街邊物件（紙雕質感）

- 需求單：`15-redo-paper`
- 交付到：`art-inbox/15-redo-paper/`（附 `batch.json`）
- 檔案：`literature.png`、`hayashi.png`、`confucius.png`（各一張 single），`connectors.png`（3x2，key 左上到右下：`woodFence`, `ixoraHedge`, `brickLowWall`, `bambooFence`, `potRow`, `greenHedge`）
- 風格與格式：`docs/art/ART-BIBLE.md`，提示以其中的統一 prompt 開頭

## 為什麼重畫（使用者 2026-11-22 的意見）

- `13-landmarks-real` 的臺灣文學館、林百貨：沒有紙的質感，沒有印刷顆粒感，像 3D 模型。
- 臺灣文學館顏色不對：畫成濃紅配濃綠。實物是偏淡的紅磚和偏淡的銅綠屋頂，而且一樓是灰白色石材，不是紅磚。
- 現行的孔廟門（`public/art/tainan/confucius.png`）也缺紙質感、印刷顆粒感和細節。
- `14-connectors` 的柵欄、樹叢、盆栽畫成寫實插畫了。要和其他美術一樣是紙雕：木頭和花草的表現照已核可的樹（`public/art/paper-atlas.png` 裡的櫻花、楓樹：一片一片剪紙疊出的花葉、有紙纖維的樹幹）。
- 交來的圖邊緣有紅色、黃色殘邊。必須一開始就用 image_gen 的透明背景生成並保留原生 alpha；不要先畫在色底上再去背。交付前自己放大檢查邊緣，沒有任何彩色殘邊才交。

## 每一張都必須有

- 看得出是紙：紙纖維、剪紙邊緣、紙層之間細小的重疊與接觸陰影。
- 印刷顆粒感：平塗色塊上有細的孔版／石版印刷顆粒和墨色濃淡。
- 平面：不要 3D 模型感、不要斜角浮雕、不要寫實光影。
- 對照圖（必看，畫之前先打開）：`public/art/tainan/machiya.png`、`shennong.png`、`noodleStall.png`、`public/art/paper-atlas.png`。不要對照 `confucius.png`、`hayashi.png`、`chihkan.png`。

## 內容

先搜尋實景照片再畫（AGENTS.md）。

1. `literature` 國立臺灣文學館
   - 使用者提供的參考（四張都必看）：`art-source/refs/literature-photo.jpg`（正面入口）、`literature-aerial.jpg`（空拍全貌：中央馬薩式大屋頂、兩側圓頂角塔）、`literature-side.jpg`（側面：一樓灰白石材、二樓紅磚）、`literature-illustration.jpg`（百週年紀念插畫：配色的取法可以參考，灰白為主、紅磚只在二樓牆面、屋頂灰綠；但不要照它的線稿畫法）。
   - 顏色：整棟以灰白石材為主；紅磚只出現在二樓的牆面，是淡紅磚（偏粉、偏灰）；屋頂是灰綠到石板灰（淡銅綠），不要飽和的紅和綠。
   - 一樓整層是灰白色石材（橫向石縫），二樓才是紅磚配白色石柱與窗框。
   - 中央入口：一樓突出的方形門廊、成對的白色方柱與圓柱，二樓成對的愛奧尼克圓柱與拱窗，三角山牆，上方是淡銅綠的大圓頂屋頂和老虎窗。
   - 要 compact：中央入口與上方的大屋頂為主，左右各一到兩個開間，可以把兩側的圓頂角塔收進來貼近中央；整體寬高比約 4:3，不要畫成長長一排。
   - 不要寫出館名的字。
2. `hayashi` 林百貨
   - 外形照 `13-landmarks-real` 那張的考據（淺褐溝面磚、圓弧轉角、橫向窗帶、圓窗、頂樓旗桿塔），但改成正面略帶一點點斜角的平面紙雕，補上紙質感和印刷顆粒。寬度也要 compact。
3. `confucius` 臺南孔廟門（東大成坊，「全臺首學」門）
   - 搜尋實景：紅牆、燕尾翹脊的屋頂、中央門洞。匾額留素面不寫字。
   - 比現行版本多細節（屋瓦、脊飾、牆基、門釘或門板紋），紙質感和印刷顆粒要明顯。
4. `connectors` 六件街邊物件，全部是紙雕，低矮橫長、左右可拼接
   - `woodFence` 木柵欄：使用者給的樣子在 `art-source/refs/fence-ref-1.png`、`fence-ref-2.png`（必看）。一根一根的木樁加一到兩道橫桿、樁與樁之間透空（透明），木樁高低略有不齊；不是整面木板牆。木頭的畫法照 atlas 裡樹幹的紙感。
   - `ixoraHedge` 矮仙丹樹叢：剪紙葉片一片片疊出的矮綠籬，上面幾團紅色小花球，畫法照 atlas 的櫻花樹。
   - `brickLowWall` 紅磚矮牆：紙雕的清水紅磚矮牆，一小段花磚透空。
   - `bambooFence` 竹籬。
   - `potRow` 一排盆栽（陶盆、青花盆；九重葛、蕨、萬年青），葉子是剪紙。
   - `greenHedge` 月橘綠籬，零星小白花。
