# 給 Codex：這個資料夾的工作規則

專案：府城夜巡地圖 Tainan Gazetteer。你負責美術，Claude 負責程式、切圖與 review，使用者做最後核可。

## 你做什麼

1. 讀 `docs/art/ART-BIBLE.md`（風格、統一 prompt、交付格式）。紙偶零件再讀 `docs/art/RIG-SPEC.md`。
2. 照 `art-source/requests/<name>.md` 的需求單生圖。每次生圖的提示都以 ART-BIBLE 的統一 prompt 開頭，再接需求單的內容。
3. 成品放進 `art-inbox/<需求單名>/`：
   - 圖檔：需求單指定的檔名，PNG、透明背景。
   - `batch.json`：`{ "request": "<需求單名>", "files": [{ "file": "...", "keys": ["..."], "layout": "single | 3x2" }], "prompt": "<實際用的完整提示>", "notes": "..." }`

## 你不做什麼

- 不改 `src/`、`public/`、`tests/`、`docs/`、`art-source/`，不跑建置或測試，不提交 git。
- 不新增需求單以外的物件，不在圖上放文字或標誌。
- 不沿用其他遊戲或作品的角色。

## 之後的流程

Claude 檢查 `art-inbox/` 的圖（照 ART-BIBLE 的驗收），切成單張、登記進 `src/data/manifest.ts`，截圖給使用者。使用者核可後才上線；被退回的會在需求單上寫明原因再請你重畫。
