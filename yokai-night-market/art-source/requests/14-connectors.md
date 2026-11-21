# 銜接建築的街邊物件

- 需求單：`14-connectors`
- 版面：3x2（六格，一張圖）
- key（左上到右下）：`woodFence`, `ixoraHedge`, `brickLowWall`, `bambooFence`, `potRow`, `greenHedge`
- 檔名：`connectors.png`
- 交付到：`art-inbox/14-connectors/`（附 `batch.json`）
- 風格與格式：`docs/art/ART-BIBLE.md`，提示以其中的統一 prompt 開頭

## 用途

放在大街上兩棟建築之間，把建築連起來，不讓街面空著。都是正側面、低矮、橫長的一段，左右兩端切齊，可以左右重複拼接。高度約為建築一樓的三分之一到一半。

## 先做的事

照 AGENTS.md：先搜尋實景照片再畫，尤其是矮仙丹（臺灣常見的綠籬植物）和臺南老街常見的圍籬、矮牆。`notes` 記下參考頁面。

## 內容

1. `woodFence` 木柵欄：日式宿舍常見的直條木板圍籬，深褐色，頂端有橫木。
2. `ixoraHedge` 矮仙丹樹叢：修剪成長條的矮綠籬，深綠小葉，上面一團一團的紅色小花球（每朵四瓣）。
3. `brickLowWall` 紅磚矮牆：清水紅磚、頂上一排壓頂磚，可以有一小段花磚透空。
4. `bambooFence` 竹籬：綁繩的竹編矮籬。
5. `potRow` 一排盆栽：三四個陶盆和青花瓷盆，種九重葛、蕨類、萬年青。
6. `greenHedge` 月橘（七里香）綠籬：修剪整齊的深綠長條，零星小白花。

## 畫法（上一批被指出的問題）

上一批 `13-landmarks-real` 外形正確，但畫得像 3D 浮雕模型。這一批必須是平面的紙雕：薄紙層疊、平塗色塊、幾乎沒有厚度，對照 `public/art/tainan/{machiya,noodleStall,lantern,tileFlower}.png`。不要斜角、不要立體光影、不要光暈。每格物件之間留足透明間距。
