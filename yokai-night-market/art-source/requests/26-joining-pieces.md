# 會依鄰居相接的柵欄零件、超出格子的花草叢

- 需求單：`26-joining-pieces`
- 交付到：`art-inbox/26-joining-pieces/`（附 `batch.json`）
- 檔案：`fences.png`（4x2）、`clumps.png`（3x2）
- 先讀 `docs/art/ART-BIBLE.md` 通用原則，尤其新加的 12a、12b、12c。風格輸入圖：`public/art/paper-atlas.png`、`art-inbox/23-looser-pieces/flowers.png`（紙質對，但被畫成方塊）。
- 版面參考（只看結構與質感，不照抄）：`art-source/refs/yokaiya/fence-plank.webp`、`fence-cross.webp`、`bush-2x2.png`、`flowers-2x2.png`。

## 怎麼用

院子是方格（寬 24、深 20，略俯視）。程式在每一格畫一根「柱」；如果右邊那格也是同一種柵欄，就在兩根柱之間畫一段「連接段」。所以：

- 「柱」：只有一根柱子（或一片直板），置中，四周透明，底部對齊畫布底。
- 「連接段」：只有橫桿／板子／交叉木，寬度剛好等於一格（左端對齊畫布左緣、右端對齊右緣），高度位置要和柱子對得上，左右兩端可以藏在柱子後面一點點。
- 所有柱子同一個畫布大小，所有連接段同一個畫布大小，方便對齊。

## `fences.png`（4x2：上排是四種的柱，下排是對應的連接段）

1. `fencePlank`：直立木板柱（板頂斜切）＋連接段是一道上橫木（參考 fence-plank）。
2. `fenceCross`：粗方木柱＋連接段是一個 X 交叉木（參考 fence-cross）。
3. `fenceRail`：細圓木樁＋連接段是兩道細橫桿（現有 `fencePiece` 的樣子）。
4. `fenceBamboo`：一根竹竿柱＋連接段是兩道綁繩的細竹。

木頭是剪紙、有紙纖維與顆粒，帶一點風化的淺色；各種顏色略不同。原生透明背景。

## `clumps.png`（3x2，一格一團，畫布每格相同大小）

1. `bushA`：一團綠色灌木（四片葉組成的小團，參考 bush-2x2），比格子大約 25%、輪廓圓潤不規則。
2. `bushB`：同上但形狀不同的一團，讓兩種混鋪不重複。
3. `flowerWhite`：一團白花（三四朵四瓣花）加葉子，比格子大約 25%（參考 flowers-2x2 的上排）。
4. `flowerYellow`：一團黃花（參考 flowers-2x2 的下排）。
5. `flowerPink`：一團粉紅小花。
6. `grassTuft`：一小撮草（比格子小，用來點綴）。

每團的底部（靠鏡頭那側）略寬、頂部略窄，相鄰兩團擺在一起時邊緣自然重疊。不要畫方形草地底。原生透明背景，無光暈。
