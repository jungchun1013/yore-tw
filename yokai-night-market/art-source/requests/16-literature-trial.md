# 試畫一張：臺灣文學館（確認建築的紙雕畫法）

- 需求單：`16-literature-trial`
- 檔案：`literature.png`（single）
- 交付到：`art-inbox/16-literature-trial/`（附 `batch.json`）
- 風格與格式：`docs/art/ART-BIBLE.md`，提示以其中的統一 prompt 開頭

## 為什麼再畫一次

`15-redo-paper` 的文學館顏色、材質、compact 的比例都對了，這些保留。被退回的原因只有一個：它是 3D 建築模型的畫法（有透視、側面、斜角、立體光影），不是紙雕。林百貨和孔廟門也是同樣的問題。這張先試出正確畫法，其他建築再照做。

## 這次的做法（重點）

1. 用 image_gen 的「參考圖／編輯」方式，把已核可的建築當風格輸入圖一起送進去：`public/art/tainan/machiya.png`、`public/art/tainan/shennong.png`。要求新圖和這兩張是同一套畫法、同一種紙、同一種顆粒，擺在一起像同一個人做的。只靠文字描述不夠。
2. 正立面（orthographic front elevation）：完全沒有透視，看不到任何側面和屋頂的頂面；兩側角塔也畫成正面的平面形狀。
3. 立體感只來自三到四層平的剪紙相疊（牆面一層、柱與窗框一層、門廊一層、屋頂一層），每層邊緣有很小的接觸陰影。不要圓柱的漸層明暗、不要簷口的立體線腳、不要石材的 3D 凹凸。
4. 細節用小塊剪紙表現：磚是一小塊一小塊的紙，窗格是鏤空的紙框，柱頭簡化成剪出來的渦卷形。
5. 每一塊紙都看得到紙纖維和明顯的印刷顆粒。

## 內容（和上一張相同）

- 參考：`art-source/refs/literature-photo.jpg`、`literature-aerial.jpg`、`literature-side.jpg`、`literature-illustration.jpg`；上一張 `art-inbox/15-redo-paper/literature.png` 的顏色與比例可以沿用。
- 顏色：灰白石材為主；淡紅磚只在二樓牆面；屋頂灰綠（淡銅綠）。
- 一樓整層灰白石材，二樓紅磚配白色柱與窗框；中央門廊、成對的柱、拱窗、三角山牆、大屋頂與老虎窗；左右各一座圓頂角塔。
- compact：寬高比約 4:3。不寫館名。
- 原生透明背景。
