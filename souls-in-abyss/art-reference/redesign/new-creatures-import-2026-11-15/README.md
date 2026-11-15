# 新生物匯入 · 2026-11-15

來源：Codex 交接包 `/private/tmp/codex-art/new-creatures-claude-handoff-2026-11-15/`（59 MB，未入 repo；`manifest.json`、`palette.json`、`HANDOFF.txt`、`all-originals.jpg` 是從裡面複製的副本）。23 隻原色、140 張色違；低語書是 Codex 後來重生的無鐵鍊版。

## 處理（全部機械，`tone.py` + `build.py`）

1. 離色票最近色 ΔE > 14 的像素往該色票移一半（天平的金、雷狼的閃電黃、熔岩橘、熊的暗紅）。
2. 暗部提亮 L' = L + 0.14(1−L)²、飽和 ×0.95，和舊 17 隻、五族人物同一條曲線。
3. 星群三隻（鯨、鹿、狐）另外 L + 0.22(1−L)、飽和 ×0.8（使用者要求再白）；天平飽和再 ×0.8。
4. 去 alpha < 24 的暈邊、裁切、以貓頭鷹 32 單位為尺縮到戰鬥條 2 倍密度（高度 = 單位 × 2），存 `public/sprites/mon/<slug>/<dye>.png`。單位表在 `build.py` 的 `UNITS`。
5. `tone-before-after.png`：每組左原圖、右處理後。

## 接進遊戲

- `src/data/creatures.ts`：`CREATURE_DYES` 新增 23 筆；`GLOW_ART`／`glows()` 讓星群三隻和金色光靈在戰鬥條有光暈；`DYE_WORD` 是色違前綴字。
- `src/data/areas.ts` 改成「怪物表 + 各區挑選」，一隻可以在多區；名稱、區域、顏色前綴照使用者在圖鑑 artifact（FToiTw8tB1PYqjzFUV7nkj）填的。火靈拆成草／火／水／天／光／闇六系，同一張圖以色違區分（`dyes` 限制）。
- 沒有圖的小樹人、巴西利斯克、深潛者已刪除。

## 已知未做

- 「主要區域機率較高」：目前同區等機率。
- 低語書解析度比其他 22 張低、邊緣較糊（Codex 選用的版本）。
