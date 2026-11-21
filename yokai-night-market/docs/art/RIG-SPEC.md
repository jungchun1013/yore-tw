# 紙偶規格 Rig Spec

紙偶是一組可拆的紙片：每個零件一張透明 PNG，用關節釘在父零件上，只靠轉動和位移做動作，不重畫、不變形。程式：`src/render/puppet.ts`；預覽：`?puppet=<name>`。

## 檔案

```
public/art/puppets/
  _skeletons/chibi.json     同一種骨架共用的動作
  miko/rig.json             這隻偶的零件、關節
  miko/head.png ...         零件圖
```

## rig.json（v2）

```json
{
  "version": 2,
  "skeleton": "chibi",
  "scale": 0.1706,
  "parts": [
    { "id": "body", "role": "body", "file": "body.png", "pivot": [109.5, 293], "at": [0, 0], "z": 2 },
    { "id": "head", "role": "head", "file": "head.png", "parent": "body", "pivot": [108, 168], "at": [108, 168], "z": 5 }
  ],
  "clips": { }
}
```

- `scale`：圖上 1 px 等於遊戲內幾 px。
- `pivot`：關節在這個零件自己圖上的座標。
- `at`：關節在父零件圖上的座標；根零件則是相對腳底。
- `z`：上下順序，大的在上。
- `role`：這個零件在骨架裡的角色。動作是對 role 下的，不是對 id。
- `clips`：這隻偶自己的動作，會蓋過骨架裡同名的。

目前零件圖都用同一張畫布大小，所以 `pivot` 和 `at` 相同。

## 骨架與 role

| 骨架 | role | 用在 |
|---|---|---|
| `chibi` | body（根）、head、sleeveL、sleeveR、legL、legR、acc1–acc3（釘在頭上的飾物）、earL、earR、tail | 小滿、小夜、狐狸、之後的人物與神明 |
| `quad`（預留） | body、head、legFL、legFR、legBL、legBR、tail | 黑貓、風獅爺、贔屭 |
| `bird`（預留） | body、head、wingL、wingR、tail、legL、legR | 黑冠麻鷺、珠頸斑鳩 |
| `blob`（預留） | body、eye、tongue、cap | 提燈、唐傘 |

偶可以缺某些 role（狐狸沒有 acc1、acc2），缺的就不動。

## 動作片段 clip

```json
"wave": {
  "length": 1.6,
  "sway":   [["body", "y", 2, 0.625, 0]],
  "tracks": { "sleeveR": { "r": [[0, 0], [0.25, -0.34], [0.5, -0.2], [1.6, 0]] } }
}
```

- `length`：一輪的秒數，會循環。
- `sway`：持續的來回擺動 `[role, 通道, 幅度, 每秒次數, 相位]`。
- `tracks`：關鍵影格 `[時間, 值]`，中間線性內插。
- 通道：`r` 旋轉（弧度）、`x`、`y` 位移（圖上的 px）。
- sway 和 tracks 會相加。

目前有：`idle`、`walk`、`wave`、`eat`。預留名稱：`interact`、`sit`、`hurt`。

## 零件怎麼來

1. **正式分件圖（建議）**：Codex 每個零件畫完整，被擋住的部分也畫出來。清單見下。
2. **從整張圖拆**：`art-source/puppets/split_puppet.py` 依輪廓和顏色把整張角色切開，被擋住的地方只能用邊緣顏色補約 6 px。所以這種偶的擺幅要小（袖子 ±0.16 弧度以內）。小滿、小夜、狐狸目前是這種。
3. **換色**：`art-source/puppets/recolor.py` 對零件調色，骨架和動作沿用。

## 給 Codex 的分件清單（chibi）

| 檔名 | 內容 | 注意 |
|---|---|---|
| head | 臉、耳朵 | 下緣多畫一截脖子 |
| hair_back | 後髮 | 在頭的下面 |
| hair_front | 瀏海、鬢髮 | |
| acc1… | 頭飾，一件一張 | |
| body | 軀幹與下擺，不含袖子 | 肩膀處畫完整 |
| sleeveL / sleeveR | 袖子連手 | 肩膀處多畫一段 |
| legL / legR | 腳連鞋 | 上緣多畫一段 |
| tail | 尾巴 | 根部多畫一段 |

另附一張組好的參考圖。所有零件同一比例、同一角度。

## 輸出動圖

`?puppet=<name>` 右下的按鈕會下載一輪走路的 12 格影格（PNG 長條）。
