# 美術規格 Art Bible

府城夜巡地圖 Tainan Gazetteer。所有新圖照這份做；需求單（`art-source/requests/`）每張都附上下面的統一 prompt。

**這份是活的指南。** 使用者每一次對美術、版面、畫面的意見，Claude 都要先改寫進這份（通則寫進「通用原則」，特定物件寫進「各類別的規則」，舊規則與新意見衝突時以新意見為準並刪掉舊的），再寫需求單、再叫 Codex。需求單只寫這次要畫什麼，通則不在需求單裡重複。

## 通用原則（使用者歷次指示的整理，最新在 2026-11-22）

### 畫法
1. **全部是紙雕。** 建築、樹、花草、柵欄、地磚、圖示、人物都是層疊剪紙：看得出紙纖維、剪紙邊、紙層重疊，色塊上有明顯的印刷顆粒。3D 模型、黏土、寫實插畫、照片材質一律退回。
2. **平面立面。** 建築、牆、門一律完全正面、沒有透視，立體感只來自三到四層平的紙相疊。不畫側面、頂面、圓柱體明暗、浮雕。用程式把圖壓斜、變形來假裝角度也不行；需要角度就畫一張那個角度的圖。
3. **木頭和花葉** 照 `public/art/paper-atlas.png` 的櫻花、楓樹：一片片剪紙疊出的葉與花、有纖維的樹幹。
4. **舊、有風化感是好的。** 使用者喜歡孔廟紅牆那種斑駁、不規則的褪色塊（`art-source/refs/confuciusWall-liked.jpg`）；不要把牆面處理成乾淨的整片色，也不要用方方正正的貼塊表示風化。

5a. **樹幹是曲折的。** 使用者一直想要的樹幹：像折紙一樣有稜角、轉折分明的曲折枝幹，粗細一節一節變化，枝條斜斜岔出（參考 `art-source/refs/yokaiya/tree-trunk.png`）。取其概念、不取其形：每種樹照自己的實際樹形，但枝幹都用這種折線般的轉折來表現，不畫成平滑圓潤的管子或寫實樹皮。樹冠是幾大片圓弧的剪紙，不是密密麻麻的小葉。使用者認可的範例：`public/art/paper-atlas.png` 的櫻花樹與楓樹（2026-11-22：「櫻花樹就很好」「像櫻花樹和楓樹那樣」），樹幹的轉折與樹冠的大片剪紙以它為準。

### 真實與美感
5. **照實景。** 真實存在的建築、地標、動植物、小吃，先搜尋實景照片；外形、材質、顏色以實物為準。使用者給的照片在 `art-source/refs/`，必看。只參考外形，不描圖。不要自己編裝飾（例如替石坊加翹簷、葫蘆）。
6. **顏色照實物，再調淡、偏灰。** 不要把實物畫成飽和的對比色（例：文學館是淡紅磚、灰白石材、淡銅綠屋頂，不是濃紅配濃綠）。
7. **自然、不對稱。** 樹和植物要有真實感：左右不等長、層距不一、有缺枝、略微傾斜。像聖誕樹那樣完全對稱、等距的退回。

### 尺度與密度
8. **建築 compact。** 只取最有辨識度的一段，寬不超過高的 1.4 倍（例外寫在各類別）。需要長的建築就拆段：中段加可接的側翼（例：文學館攤開三面）。
9. **密度要低、元素要大。** 一格裡只放一兩個主體：一格一朵花（或一大一小）、一格一塊石板、柵欄木樁之間大片透空。細碎、擠滿的圖案退回。
9a. **常見的東西要有變體。** 植物（花叢、灌木、草叢、樹）每種準備二到四個版本，同顏色同葉子大小、但輪廓與花葉排法不同；遊戲依位置自動輪流挑（manifest 的 `variants`），大量擺放時不會一模一樣（2026-11-22 使用者）。
9a. **常見的東西要有變體。** 植物（花叢、灌木、草叢、樹）每種準備二到四個版本，同顏色同葉子大小、但輪廓與花葉排法不同；遊戲依位置自動輪流挑（manifest 的 `variants`），大量擺放時不會一模一樣（2026-11-22 使用者）。
10. **畫面要近、要滿。** 遊戲畫面裡建築和人物要大，不留大片空白；這主要由程式調整，但物件比例要能承受放大。

10a. **照遊戲裡的實際大小生成，不靠縮放。** 遊戲比例是壓縮過的（不照真實比例：人約 58 單位高）。每個物件照下表的遊戲尺寸單張生成，存檔解析度是遊戲尺寸的 6 倍（例如 150 單位高的樹畫成約 900 px 高），不放進 3×2 格子表再縮放。這樣每張圖的紙纖維、印刷顆粒和剪紙元素在畫面上一樣大，看不出縮放痕跡（2026-11-22 使用者：「材質和輪廓的表現一定會被看出有 scaling 的痕跡」）。
    - 元素大小大致固定：一片葉子約 6–9 單位、一朵花約 5–8 單位、一塊磚約 3×1.5 單位、一顆石板約 20 單位。
    - **但要飽滿，不要寫實得很虛。** 小樹的葉子可以略大（到 1.5 倍）、葉叢聚成幾團，樹冠讀起來是一塊，而不是稀疏的枝條加零星小葉（2026-11-22 使用者：雞蛋花「新版太真實看起來很虛，平衡一下」）。核可的範例：`art-source/refs/plumeria-approved-old.png`（主圖）與 `art-inbox/29-plumeria-true-size/candidate-1.png`（變體）；太稀疏的反例：29 的 candidate-2、3、4。
    - 尺寸表（遊戲單位，高度）：人 58；雞蛋花 90；全臺首學門 120；鳳凰木 130；建築 120–130；榕樹 150；雨豆樹 140；大王椰子 150；南洋杉 175；石燈籠 65；盆栽 26；花叢 24；柵欄 34。

### 可拼接
11. **地面與連續物件做成可重複拼接的圖塊**，像 RPG Maker 的地圖圖塊：上下左右無縫，邊緣與轉角另有收邊塊，收邊本身是一顆顆物件（石頭、草叢）漸疏，不是一條直線。院子是方格（每格寬 24、深 20，略俯視），擺放物件剛好佔整數格。

12a. **花草可以超出格子。** 草叢、花叢、灌木畫成一團一團的剪紙，比格子略大、邊緣超出格線（參考 `art-source/refs/yokaiya/bush-2x2.png`、`flowers-2x2.png`），相鄰時彼此重疊連成一片，不是方方正正的地磚。
12b. **相鄰會變形（像 Minecraft）。** 柵欄、圍牆、樹籬這類連續物件依左右鄰居換接法：單獨一格是一根柱子，旁邊有同類時柱子之間長出橫桿或板子連起來。所以這類物件拆成零件交（柱、連接段），由程式組合。
12c. **柵欄用我們自己的材質。** 柵欄沿用需求單 20 的木頭（`art-inbox/20-yard-pieces-and-menu-icons/yard.png` 左下那段：暖褐色剪紙木板、木板高低稍微不齊），可以有幾種，但都用這套材質。妖怪屋的柵欄截圖只用來說明「柱＋連接段」怎麼拆，**不可抄它的外觀**（2026-11-22 使用者：「你的柵欄不可以抄襲啊，原本的就已經很好了」；交叉柵欄、木板柵欄因為照抄被拿掉）。

### 版面與圖示
12. **院子** 照 `art-source/refs/yokaiya/`：素色紙地板，建築前與邊緣鋪綠地，花圃、椅子、欄杆一格一格擺。
13. **按鈕不用預設圓角粗框。** 選項用一件剪紙小物代表（下方標名字），或圓形紙片；圖鑑可以是方圓。選單在畫面底部。

15a. **家具參考 Meow Meow Star Acres**（使用者 2026-11-22）：看它家具的種類、尺寸感、怎麼放在格子上、怎麼互相搭配；外觀依原則 16 不照抄。
16. **參考圖只取概念與結構。** 使用者給的別家遊戲截圖是用來說明做法（怎麼拆元件、怎麼排版、什麼感覺），外觀、配色、形狀都要是我們自己的。Claude 驗收時要把新圖和參考圖並排比對，太像就退回。

### 技術
14. **原生透明背景。** 用 image_gen 直接生成透明背景並保留 alpha；不要畫在色底或光暈上再去背，邊緣不得有紅、黃等彩色殘邊，封閉的孔洞（燈籠口、鑰匙孔）也要透明。
15. 沒有文字、標誌，不照搬其他作品的角色。

## 已核可的基準圖

使用者在 2026-11-18 核可，風格以這些為準：

| 類別 | 基準 | 位置 |
|---|---|---|
| 建築 | 第三輪重畫（神農街屋、日式町屋、擔仔麵攤）、墨印版紅磚洋樓與木屋 | `public/art/tainan/{shennong,machiya,noodleStall,brickHouse,woodHouse}.png` |
| 樹、花草、木頭 | 第一批九宮格的櫻花、楓樹、石燈籠 | `public/art/paper-atlas.png` |
| 人物 | 墨印版小滿、狐狸 | `public/art/tainan/{miko,fox}.png` |
| 小吃、小物 | 墨印版 | `public/art/tainan/{milkfish,pengbing,dango,lantern,tileFlower,censer}.png` |

通過 Claude 驗收、建築畫法可對照：`art-inbox/16-literature-trial/literature.png`（平面紙雕立面的範例）。

不是基準：舊孔廟門、舊林百貨、赤崁樓（缺紙質感、顆粒與細節）。

官方素材（2026-11-22 使用者請 Claude 從 yysygw.163.com 圖鑑下載）：`art-source/refs/yokaiya-official/`，57 個式神，每個有立繪、庭院 Q 版（正面、背面）與覺醒版，另有 `sheet-courtyard.jpg`、`sheet-portrait.jpg` 總覽。這是網易的版權素材，**只放本機、已排除在 git 外，不可放進遊戲或 public/**。用途：研究紙偶的摺紙結構、正背面怎麼拆、眼睛與比例；給 Codex 時只能當「質感與做法」參考，不可讓它照某一個式神的造型、配色、服裝畫。依原則 16 驗收時要和這些並排比對，太像就退回。

質感參考（只看質感與版面，不沿用角色、文字、標誌）：`art-source/ref-yokaiya-1.png`、`ref-yokaiya-2.jpg`、`art-source/refs/yokaiya/`（含 `NOTES.md` 的人物眼睛重點）。

## 統一 prompt（每張需求單開頭都貼）

```
Original Taiwanese game art for "Tainan Gazetteer" (府城夜巡地圖), set in Tainan around 1930.
Style: handmade layered paper sculpture (紙雕 / kirie), the same for buildings, trees, plants,
fences, ground tiles, icons and props. Every shape is a piece of cut paper: visible paper fibres,
slightly soft hand-cut edges, pieces overlapping in shallow layers with small soft contact shadows
where one sheet sits on another. Colour is printed on the paper: clearly visible risograph /
stencil print grain and uneven ink density across every flat area, never a clean digital fill.
Weathering is welcome: irregular faded patches, not neat squares.
Details are built from few, large cut pieces (roof tiles, bricks, window frames, leaves, petals,
stones, planks), not painted lines and not crowded tiny patterns. Plants are natural and
asymmetric.
Colour: follow the real object, then mute it: pale, slightly greyed, warm. Typical tones: warm
cream, pale brick red, coral, sage and grey-green, mustard, indigo, wood brown, stone grey.
No saturated red-against-green contrast.
Buildings: strictly frontal elevation, no perspective, three or four flat paper layers.
Do NOT make: a 3D render or clay/plastic model, smooth bevelled relief, realistic or painterly
illustration, photo textures, thick foam layers, glow, glossy highlights, black outline strokes,
smooth gradients, depth of field.
Output: generated natively on a fully TRANSPARENT background (real alpha including enclosed
holes, no backdrop, no glow, no chroma-key colour, no coloured fringe), every object complete
and separated by clear transparent gutters, no ground, no base, no cast shadow outside the
object, no text, no captions, no logos.
```

## 各類別的規則

- **建築**：見通用原則 2、5、6、8。保留辨識特徵和細節（屋瓦、磚縫、窗框、柱頭），刪掉陪襯的盆栽、底座。不寫招牌、匾額文字。武德殿實物較寬，寬高比可到約 1.7:1。
- **牆、街邊物件（圍牆、柵欄、矮牆、樹叢、盆栽）**：低矮橫長、左右可拼接；柵欄是木樁加橫桿、樁間大片透空。
- **院子方格物件**：佔整數格。花草是超出格子的一團（原則 12a）；柵欄類拆成「柱」和「連接段」兩件（原則 12b）；草地底色由程式鋪，不畫成方塊。
- **地面圖塊**：見通用原則 11；一格約一塊石板。石子路用一顆顆獨立的石板（數種形狀、大小、色調），由程式每格挑一顆、略為錯開擺放，路的邊緣由石頭本身自然收掉；不要整片規則排列的格子。
- **樹**：比建築略高；見通用原則 3、5a、7。南洋杉要像臺南公園的實樹，不像聖誕樹。
- **圖示**：一件剪紙小物，不加底框、不寫字，縮到 48 px 仍認得出。
- **人物**：大頭短身（約 2 到 2.5 頭身），大眼、有高光、有表情；和小滿、狐狸同一套臉與比例。眼睛參考 `art-source/refs/yokaiya/NOTES.md`。
- **神明**：和人物同一套比例與臉；服飾、持物保留辨識度但不比人物繁複。只當神像或圖示，不當敵人。
- **妖怪、動物**：可愛、輪廓單純，縮到 30 到 50 px 高仍認得出來。
- **小吃**：商品圖示，一份一格，內容物看得清楚。

## 交付格式

- PNG，透明背景。一張表最多 6 個物件（3×2），或單張。
- 物件之間留透明間隔，不要互相碰到，不要碰到畫布邊緣（圖塊例外：圖塊要剛好填滿自己的格子）。
- 紙偶零件的規格見 `RIG-SPEC.md`。
- 檔名用需求單上的英文 key。

## 驗收（Claude review）

照「通用原則」逐條檢查，另外：

1. 物件完整、沒被裁切，數量和需求單一致。
2. 放大到 200% 看紙纖維與顆粒；縮到遊戲內大小看是否仍清楚、不擠。
3. 顏色和使用者給的照片並排比對。
4. 圖塊實際拼 3×2 檢查接縫。
5. 有一條不過就退回重畫，不遞給使用者。通過後截圖給使用者，使用者核可才上線；使用者的新意見先寫回本指南。
