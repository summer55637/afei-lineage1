# RO0000 Android APK: Map Auxiliary Resource Audit

更新日期：2026-10-02

## Scope

本文件整理 target Android APK 中兩個與地圖相關、但不屬於主 tile/parts/event map cache 的附屬資料：

- `map/%d.ani`
- `map/bgm%d.dat`

主要 evidence 來自 target x86 `libStoneage.so`；可讀 Android source 僅作 cross-source corroboration。

## 1. map/%d.ani

Target function:

`ReadAniFile(int) @ 0x147040`

Verified behavior:

1. 建立相對路徑 `map/<floor>.ani`。
2. 先初始化最多 `0xbb8 = 3000` 筆的固定記憶體區。
3. 每筆記憶體 record 間距為 `0x1c = 28` bytes。
4. 初始 runtime fields：offset 0x14 = -2；offset 0x18 = -1。
5. 開檔後以 element size = 4 bytes、element count = 5 進行 `fread`，因此每筆檔案資料是 20 bytes。
6. 成功讀到一筆時只代表前 20 bytes 被檔案填入；其餘 8 bytes 留給 client runtime state。
7. 首次讀不到資料時結束，將實際筆數寫入 `ani_num`。
8. 檔案不存在時回傳 -1。

因此 target 的 `.ani` 單筆檔案格式可確定為 20 bytes = 5 × int32；client memory record 為 28 bytes = file record + 2 × runtime int32。

### Cross-source field mapping

公開的 StoneAge client source 中，`ProduceXY` 使用相同 28-byte stride，且 `ReadAniFile` 同樣逐筆讀取 5 個 int32。其前 5 個欄位用途為：

| Offset | Field | 用途 |
|---:|---|---|
| 0 | animation character/graphic number | 建立地面動畫的角色/圖像編號 |
| 4 | grid X | 動畫位置 X |
| 8 | grid Y | 動畫位置 Y |
| 12 | time-zone activation type | 1 / 2 對應不同时段啟停 |
| 16 | display priority | 動畫顯示優先權 |
| 20 | runtime active flag | client runtime，不由檔案直接保存 |
| 24 | runtime action slot | client runtime，不由檔案直接保存 |

Target `SpecAnim(int)` 直接使用相同 offset：+0x0 作為動畫圖像來源、+0x4/+0x8 轉成 grid/pixel position、+0xC 做時段啟停判斷、+0x10 設定 display priority、+0x14 管理 runtime 狀態、+0x18 保存 action slot。

因此目前可將 `.ani` 定義為：

**每張地圖的地面／場景動畫配置檔。**

它不是主地圖 tile array、parts array、event array，也不是 server LS2MAP binary。

## 2. map/bgm%d.dat

Target function:

`play_map_bgm(int) @ 0x2f7540`

Target 直接使用 `map/bgm%d.dat`。

Verified behavior：

1. 相同 tone 不重複寫入。
2. tone 範圍限於 40..55。
3. 建立／開啟對應的 `map/bgm<side>.dat`。
4. 另建一個十進位 tone 字串。
5. 以 `fwrite(..., size=1, count=2)` 將 tone 字串前兩 bytes 寫入檔案。
6. 再依 tone 對應真正的 `map_bgm_no`。
7. 最後呼叫 `play_bgm(map_bgm_no)`。

這表示：

**`map/bgm%d.dat` 不是音訊檔本身，而是 client-side BGM tone/state 的小型持久化檔。**

### Target tone mapping

| Tone | map_bgm_no |
|---:|---:|
| 40 | 4 |
| 41 | 3 |
| 42 | 7 |
| 43 | 8 |
| 44 | 9 |
| 45 | 10 |
| 46 | 11 |
| 47 | 15 |
| 48 | 16 |
| 49 | 21 |
| 50 | 17 |
| 51 | 18 |
| 52 | 19 |
| 53 | 20 |
| 54 | 22 |
| 55 | 23 |

此 mapping 也得到公開 Android client source 同函式的交叉支持。

## 3. Relationship to the main map cache

目前 Android map-related storage 可以分成：

`map/<floor>.dat` = tile / parts / event 的 persistent map rectangle cache。

`map/<floor>.ani` = scene/ground animation configuration，20-byte file records + client runtime state。

`map/bgm<side>.dat` = persisted BGM tone/state，不是 music payload。

因此 `.ani` 與 `bgm*.dat` 不應混入主 map tile/collision reconstruction。

## 4. Current closure

本輪新增閉合：

- `.ani` 單筆檔案 record = 20 bytes。
- client runtime record = 28 bytes。
- `.ani` 前三欄為位置/圖像相關，第四欄為時段 activation selector，第五欄為 display priority；此 mapping 由 target offset 使用 + public source corroboration 支持。
- `bgm%d.dat` 是本地 tone/state 小檔，而不是音訊 payload。
- target tone 40..55 → map_bgm_no 4,3,7,8,9,10,11,15,16,21,17,18,19,20,22,23 已還原。

仍未閉合：

- 實際 `map/<floor>.ani` bytes。
- 實際 `map/<floor>.dat` bytes。
- 實際 `map/bgm*.dat` bytes。
- 真正外部 patch 中提供哪些 map/ani/sprite resources。
- `path/map4/real.bin` 的實體 entries 與 payload。

上述未取得的 bytes 不以推測補值。
