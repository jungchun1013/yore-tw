# 新生物：故事與生成 prompt · 2026-11-15

對應 `creature-ideas-2026-11-15.md` 的一到八節。每隻一段圖鑑文字（遊戲內可直接用，奈落的語氣：平述，不解釋）和一行英文外觀描述。英文那行是要貼進下面「共用 sheet prompt」的生物清單用的，一次挑五到十隻排一張。

我這邊沒有生圖工具，圖由使用者或 Codex 用 built-in image_gen 生成；生成後交給我切圖、縮放、調暗部（照 `direct-pixel-characters-2026-11-15/shadowlift.py`，K 0.14、飽和 ×0.95）。

## 共用 sheet prompt（沿用生物那張的形式）

```
Create a DIRECTLY DRAWN PIXEL ART bestiary sheet for Souls in Abyss, matching the attached creature sheet exactly in style: deliberately placed cohesive pixel clusters, stair-stepped edges, 1 logical pixel outlines in a darker shade of the same material (no black outlines), no anti-aliasing, no dithering, no painterly softness, no microtexture. Each material only 3 flat shade steps, 12-18 colors per creature. Palette: cream #f1ead7, sage #9aa58a, dusty lavender #b7a6c4, terracotta #855c59 #b47f76, blue gray #526d79, deep #343842, gold #c1a775, turquoise #6fa9a3. Do NOT turn everything purple. Quiet, slightly melancholy Japanese fantasy; cute but not chibi.

One sheet on flat warm ivory, one row of N cells, generous separation, no overlapping, no text, no frames, no ground. All logical pixel units the same displayed size across the sheet: the attached owl is 32 logical pixels tall and is the scale reference. Every creature FACES LEFT. Whole creatures visible, no cropping. Transparent or flat ivory background, no shadows.

Left to right:
<paste the English lines below, each prefixed with its height in owl units, e.g. "(1.0 owl) ...">
```

高度單位：貓頭鷹 = 1.0（32 邏輯像素）。小怪 0.9–1.2、中型 1.3–1.8、頭目 2.0–2.6。

---

## 一、文本已有、沒有圖的七隻

**小樹人 Sapling Treant** · 森林 · 1.1
> 被鋸掉的那天它還不是活的。年輪數到第四十圈的時候，它開始走。
(1.1 owl) A sawn tree stump walking on two thin root legs, with two thin twig arms; the cut face of the stump is the "face": concentric rings with two small knots as eyes, no mouth. A single dry leafless twig on top. Bark is earth brown, cut face is cream. No leaves, no moss.

**巴西利斯克 Basilisk** · 沼澤 · 1.0
> 它閉著眼睛，因為睜開會把看到的東西變成石頭。它不討厭你，只是看不見路。
(1.0 owl) A squat chicken-bodied creature with a thick snake tail curled behind it, eyes firmly shut, a small terracotta comb on its head, scaly blue-gray legs. A tiny petrified stone frog sits beside its foot. No fire, no wings spread.

**鬼火 Will-o-wisp** · 沼澤 · 0.9
> 燈裡沒有火，只有一點冷光。提著它的人早就不在了，燈還記得路。
(0.9 owl) A rusty iron hand lantern floating in the air with no one holding it, hanging from a short thin chain; inside the glass is not fire but a small pale blue-white point of light. Rust is terracotta, light is cream-turquoise. No flame shapes.

**雷狼 Thunder Wolf** · 巢穴 · 1.4
> 跑得比雷聲快，所以你先看到它，才聽到它。
(1.4 owl) A lean short-furred wolf with very long pointed ears, back fur standing up in a jagged sawtooth ridge, tail ending in a forked lightning-like tip. Blue gray fur with gold accents on ears, ridge and tail tip. No plants, no flowers, sharp angular silhouette.

**深潛者 Deep One** · 深淵 · 1.7
> 它背對著你站，頭卻轉過來。深淵底下的水不流動，所以它也學會了不動。
(1.7 owl) A half-tall humanoid fish-person standing with its back turned, head rotated to look over its shoulder at the viewer, a row of fins down its back, holding a trident taller than itself with the butt on the ground. Wet blue-gray skin with cream belly, deep #343842 eyes. Slick, not armored.

**無貌者 Faceless** · 深淵 · 1.6
> 衣領以上什麼都沒有。它有太多隻手，一直在整理那件沒有人穿的袍子。
(1.6 owl) An upright long robe in deep gray-lavender with an empty collar, nothing above it; six pale cream hands emerge from the sleeves and folds, all busy adjusting the collar and hem. No head, no glow, no eyes.

**星之落子 Star-fallen** · 深淵 · 1.0
> 從上面掉下來的。裂縫裡是它來的地方。
(1.0 owl) A small fallen meteorite crouching on three thin dark legs; its surface is deep #343842 rock, and the cracks show a night sky inside (very dark blue with tiny cream points). No fire, no glow outside the cracks.

## 二、史萊姆、熊、地下城

**果凍史萊姆 Jelly Slime** · 水 · 0.9
> 半透明的。裡面那把鑰匙是誰的，它也不知道，只是還沒消化完。
(0.9 owl) A translucent half-dome slime in pale turquoise, two bubble-like eyes with no pupils, and a small undigested brass key suspended inside its body. No face, no mouth.

**蜜罐熊 Honeyjar Bear** · 地 · 1.5
> 頭卡在罐子裡拔不出來，所以靠聽的。它其實不太生氣。
(1.5 owl) A short stocky bear in earth brown whose entire head is stuck inside a cream ceramic jar with a terracotta rim, arms slightly raised and groping. Honey drips down the jar. No visible face.

**石板熊 Slab Bear** · 地下城 · 1.8
> 背上那塊碑的字已經磨掉了。它馱著走了很久，不知道碑是誰的。
(1.8 owl) A gray-brown short-furred bear carrying a weathered stone grave slab on its back like a tortoise shell, the inscription worn illegible. Slab is blue gray, bear is earth brown. No crystals.

**鐵欄守衛 Gate Hound** · 地下城 · 1.3
> 門不見了，欄杆留下來。它站在原來門的位置，走過去會聽到鍊子的聲音。
(1.3 owl) A dog whose body is an iron barred gate: vertical bars as the torso, a bolt latch as the tail, four iron legs, a small iron head with a hinge jaw. Blue gray metal with rust. Not armor, clearly architectural.

**骨頭堆 Bone Heap** · 地下城 · 1.1
> 散掉的骨頭自己疊成一座不穩的塔。最上面那顆頭骨是眼睛，不是頭。
(1.1 owl) A loose pile of assorted cream bones stacked into a wobbling little tower, a single small skull on top acting as the eye. Not a skeleton, no spine order, clearly a heap.

**掉落吊燈 Chandelier Mite** · 地下城 · 1.2
> 從天花板掉下來的。蠟燭滅了，只剩一根。它用鏈子爬。
(1.2 owl) A small brass chandelier fallen to the floor, crawling on its own hanging chains like insect legs, all candles out except one lit. Gold metal, cream candles. Multi-armed, metallic.

## 三、克蘇魯

**眼球水母 Watcher Jelly** · 闇 · 1.2
> 它看。就只是看。
(1.2 owl) A floating jellyfish bell in dusty lavender with one large single eye filling the bell, trailing tentacles each ending in a small eye. Real eyes with iris and pupil, not glowing dots.

**低語書 Whispering Tome** · 闇 · 1.0
> 書攤開著，自己翻頁。頁與頁之間有東西伸出來。封面有鎖，鎖是從裡面扣的。
(1.0 owl) A thick open book standing on its spine edge, pages fanned, thin dark tentacles emerging from between the pages; the terracotta cover has a brass lock. No teeth, no mouth.

**螺殼客 Shell Dweller** · 水／闇 · 1.3
> 殼口伸出三條觸手，還有一根細長的眼睛，像潛望鏡。它從不整個出來。
(1.3 owl) A large spiral seashell in cream and terracotta, three dark tentacles and one long thin periscope-like eyestalk emerging from the opening. Nothing else of the creature visible.

**影子蹄獸 Shadow Hoof** · 闇 · 1.6
> 影子站了起來。只有踩在地上的四個蹄子是真的。
(1.6 owl) The flat silhouette of a four-legged beast in deep #343842 standing upright as if the shadow itself got up; only the four hooves touching the ground are solid and rendered with shading in blue gray. No eyes, no features inside the silhouette.

## 四、火、雷、光、闇

**炭殼甲蟲 Ember Beetle** · 火 · 1.0
> 熄到一半的炭。縫裡還是紅的。
(1.0 owl) A round beetle with a charcoal-black shell, orange-red light showing only in the seams between shell plates, like half-extinguished coal. No flames.

**熔岩蝸牛 Slag Snail** · 火 · 1.0
> 殼是冷掉的岩，身體是還沒冷的。它爬過的地方會亮一陣子。
(1.0 owl) A snail whose shell is cooled black volcanic rock and whose body is slow dark-red flowing magma; a short glowing trail behind it. No flame tongues.

**火柴盒鼠 Tinder Mouse** · 火 · 0.9
> 拖著一根比自己大的火柴。火柴頭是點著的，它好像不知道。
(0.9 owl) A small gray mouse dragging a wooden match far larger than itself, the match head lit with a tiny flame. Earth brown match, cream mouse belly.

**靜電羊 Static Lamb** · 雷 · 1.0
> 毛全部豎著。靠近會被電一下，它自己也會。
(1.0 owl) A round ball of cream wool with every strand standing straight out, small blue-white sparks at the tips, four thin dark legs and a tiny face barely visible. Fluffy, round.

**雲上鰩 Cloud Ray** · 雷 · 1.5
> 在半空中滑。背是雲的顏色，肚子偶爾閃一下。
(1.5 owl) A flat manta ray gliding in mid air, back the color of gray cloud, underside cream with a faint lightning mark. Wide flat silhouette, long thin tail.

**避雷針鳥 Rod Crane** · 雷 · 1.6
> 喙是金屬的。它站在燒焦的樁上等雷，雷來了它也不躲。
(1.6 owl) A very tall thin crane with a metal lightning-rod beak, standing on one leg on a short charred wooden post. Cream feathers, blue-gray legs, gold beak. Taller and thinner than any other bird.

**燈塔蛾 Lantern Moth** · 光 · 1.1
> 肚子會發光。停下來的時候翅膀像一片葉子，但沒有葉脈。
(1.1 owl) A large moth at rest, wings folded like a single leaf shape in pale gold with no vein lines, abdomen a soft cream glowing body. Fuzzy antennae. No flames.

**鏡子龜 Mirror Tortoise** · 光 · 1.2
> 殼是磨亮的鏡子。打它的人會先看到自己。
(1.2 owl) A tortoise whose shell is a polished flat metal mirror reflecting a hint of sky, body blue gray. Flat reflective surface, not faceted crystal.

**聖歌牛 Chorus Ox** · 光 · 2.0
> 脖子上掛一圈銅鈴。它走路的時候鈴聲是光的來源。
(2.0 owl) A large heavy ox in cream and earth brown with short straight horns, a collar of many small brass bells around its neck. Big and slow. Horns short and simple, not branched.

**蝕月貓 Eclipse Cat** · 闇 · 1.0
> 額頭缺了一塊，缺口是新月形，裡面是淡金色。
(1.0 owl) A black cat sitting, with a crescent-shaped notch missing from its forehead; the notch is filled with pale gold. Eyes closed. No glow elsewhere.

**墨水章魚 Ink Octopus** · 闇 · 1.0
> 噴出的墨會在地上留一攤。它躲在自己的墨裡。
(1.0 owl) A small gray-lavender octopus sitting in a dark pool of its own ink, which spreads flat on the ground. Round head, eight short arms.

## 五、深淵傳說生物（頭目，一區一隻）

**無底井 Bottomless Well** · 2.4
> 井口看不到底。桶放下去從來沒有碰到水。它走路的時候桶會晃。
(2.4 owl) A round stone well with a wooden roof frame, walking on four short stone legs; the opening is pitch dark #343842 with no bottom, and an empty wooden bucket swings from the chain. Cream stone, earth brown wood.

**失語鐘 Mute Bell** · 2.2
> 它裂了以後就不響了。一條手臂從鐘口伸出來握著鐘錘，敲自己。
(2.2 owl) A large cracked bronze bell standing on the ground, a single long thin pale arm reaching out from the bell's mouth and holding its own clapper. Gold-bronze with a deep vertical crack. No face.

**伸出的手 The Reaching Hand** · 2.4
> 從地底伸出來的一隻手。它用指頭走路，掌心一直對著你。
(2.4 owl) A single giant pale cream hand emerging from the ground, taller than a person, walking on its fingertips, palm facing the viewer. Wrist disappears into the earth. Nothing else.

**空座 Empty Seat** · 2.0
> 椅面有坐久的凹痕。王冠對它來說太大了。它一直在找坐的人。
(2.0 owl) A small squat stone throne walking on its four legs, an oversized gold crown resting crooked on the backrest, the seat worn into a shallow hollow. No occupant, no face.

**傾斜天平 Leaning Scales** · 2.6
> 一端放一顆石頭，一端空的。它卻往空的那邊傾斜。
(2.6 owl) A tall brass balance scale standing on a stone base, one pan holding a single gray stone, the other pan empty, yet the beam tilts toward the empty side. Gold metal, symmetric hanging silhouette.

**肋骨鯨 Rib Whale** · 2.6
> 只剩肋骨的鯨，在地上游。肋骨裡還有一小群魚，不知道外面沒有水了。
(2.6 owl) The skeleton ribcage and skull of a huge whale moving along the ground as if swimming, cream bone; a small school of tiny blue-gray fish swims inside the ribcage. No flesh, no lanterns.

**門縫 The Gap** · 2.2
> 門不在了，縫還在。縫裡有光，光裡偶爾有眼睛掃過。
(2.2 owl) A tall narrow vertical slit of pale light standing in the air with no door around it, edges slightly ragged; inside the light a single eye is half-visible passing by. Cream light, deep edges. Negative space creature.

## 六、海洋

**海膽球 Urchin Ball** · 0.9
> 用刺當腳，一格一格滾。
(0.9 owl) A dark blue-gray sea urchin, a ball of straight spines with cream tips, rolling on its spines. No face.

**鹽結海馬 Salt Seahorse** · 1.1
> 整隻是鹽結成的。動一下會掉鹽。
(1.1 owl) A seahorse made entirely of rough white salt crust, chalky cream with faint blue-gray shadows, tail curled, small salt grains falling off. Matte, not crystalline.

**浪沫馬 Tide Mare** · 1.8
> 鬃毛是浪沫。跑過的地上會濕一條。
(1.8 owl) A small horse in blue gray with mane and tail made of white sea foam, a wet trail on the ground behind it. Solid body, foam only on mane and tail.

**珊瑚蟹 Coral Crab** · 1.0
> 殼上長了一叢珊瑚像帽子。一隻螯大一隻螯小。
(1.0 owl) A crab in terracotta with a small cluster of darker coral growing on top of its shell like a hat, one claw large and one small. Coral is #855c59, not green, not flowers.

**錨鰻 Anchor Eel** · 1.4
> 拖著一只比自己重的錨。它不知道錨可以放下。
(1.4 owl) A long blue-gray eel dragging a rusty iron anchor much heavier than itself, tail wrapped around the anchor's ring. Low, long silhouette.

**瓶中船 Bottled Ship** · 1.0
> 瓶子裡有一艘船。瓶子用瓶塞跳。
(1.0 owl) A glass bottle lying on its side with a tiny cream sailing ship inside, hopping along on its cork. Pale turquoise glass, earth brown cork.

**退潮客 Tidepool Hermit** · 0.9
> 石頭會走。海星是搭便車的。
(0.9 owl) A small wet dark rock walking on three stubby legs, a terracotta five-pointed starfish sitting on top of it. Rock blue gray.

## 七、星辰

**彗星兔 Comet Hare** · 1.0
> 耳朵後面拖著光。跑過的星塵會慢慢散掉。
(1.0 owl) A lean long-legged hare in pale lavender-gray, both long ears trailing a faint tail of cream light behind them, a thin scatter of star dust on the ground behind it. The glow is a trail, not a halo.

**星盤蟾 Astrolabe Toad** · 1.1
> 身上套著幾圈銅環，像星盤。環會慢慢轉，它不動。
(1.1 owl) A fat toad in sage-gray with two or three brass rings orbiting around its body like an astrolabe, tilted at different angles. Gold rings, toad sits still.

**月相蛇 Phase Serpent** · 1.3
> 身體一節一節，從新月到滿月再到新月。
(1.3 owl) A long snake coiled loosely, body divided into segments that show the moon's phases in order: dark new moon, crescents, full cream moon, back to dark. Deep #343842 and cream only.

**星塵螢群 Stardust Swarm** · 1.4
> 幾十顆小光點，鬆鬆地聚成一隻獸的樣子。靠近會散，再聚回來。
(1.4 owl) Dozens of tiny cream points loosely gathered into the vague outline of a four-legged beast, no solid body, gaps between points, some points drifting away. Against ivory the points need a faint blue-gray haze behind them.

**守夜人 Night Watch** · 2.0
> 柱身刻滿了刻痕，像在數日子。柱頂那顆星不是眼睛。
(2.0 owl) A tall thin standing stone pillar in blue gray, covered in countless small tally scratches, a single pale gold star set into the top. No face, star is decoration.

**流星沙漏 Falling Hourglass** · 1.2
> 流的不是沙，是星光。流完了它自己倒過來。
(1.2 owl) A brass-framed hourglass standing upright, upper bulb nearly empty, lower bulb full of tiny cream star points; a few points mid-fall. Gold frame, deep glass interior.

## 八、山巒、大地

**崖羊 Cliff Goat** · 1.4
> 一對很重的螺旋角。站在一塊比腳還小的石頭上，站得很穩。
(1.4 owl) A lean mountain goat in cream and gray with a pair of heavy solid spiral horns curling back, standing on a single small stone narrower than its hooves. Spiral horns, not branched antlers.

**頁岩穿山甲 Shale Pangolin** · 1.2
> 鱗片是一片片頁岩。捲起來就是一塊石頭。
(1.2 owl) A pangolin whose scales are overlapping flat slate shingles in blue gray #526d79, cream underside, long tail, small head. Natural layered rock plates, not armor.

**土丘鼴 Mound Mole** · 0.9
> 一座小土丘自己在動。只看得到鼻子和爪子。
(0.9 owl) A small mound of earth brown soil moving along, with only a pink mole nose and two cream digging claws poking out of the front. No eyes visible.

**礦脈蟲 Vein Worm** · 1.3
> 從地面鑽出來一半。體節之間透出金色的礦脈。
(1.3 owl) A thick short segmented earthworm in gray-brown emerging halfway out of the ground, thin gold lines glowing between its segments like ore veins. No face.

**鐘乳石蝠 Drip Bat** · 1.2
> 倒掛著。翅膀收起來像兩根鐘乳石。
(1.2 owl) A bat hanging upside down from a short stone stub, wings folded so they look like two dripping stalactites in cream-gray limestone, small dark head between them.

**石堆標 Cairn** · 1.3
> 人堆的路標，五六顆石頭。最上面那顆會轉頭。
(1.3 owl) A neat stack of five or six gray stones, larger at the bottom, like a trail cairn; the smallest top stone has turned slightly to the side as if looking. Tidy human-made stack.

**陶壺蛛 Pot Spider** · 1.0
> 破陶壺長出八條腿。壺口朝下蓋著，沒有人知道裡面有什麼。
(1.0 owl) A cracked terracotta pot upside down with eight thin legs made of pottery shards, the pot mouth sealed against the ground. No eyes.
