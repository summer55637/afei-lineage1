# V3.50 New-Player Creation → Starter Pet → Save Pipeline

更新日期：2026-09-30。

V3.50 把目前已 source-closed 的新玩家資料正式串成單一 headless pipeline：

`creation input → hometown world.position → Starter Pet → starter-item adapter boundary → creation.completed → Save Envelope → reload verification`

## 本輪完成

- `applyPlayerCreationInput()` 現在會把固定 hometown 的 `floor/x/y` 寫入 `state.world.position`，不再只把座標放在 return value。
- Starter Pet 使用既有 V3.48 rank-closed runtime，並保存到 `pets.petBox`。
- Save layer 使用既有 `commitSave()` / `parseAndValidateSaveEnvelope()`；不新增第二套 save engine。
- `creation.completed=true` 只有在 starter-item adapter 成功後才會設定。
- 沒有 Item 24114 template 時，pipeline 明確停在 `starter-item-template-unresolved`，回傳已準備好的 headless state，但不產生錯誤的 completed save。

## Atomicity boundary

這個 pipeline 的 staged commit 是本專案的 product/runtime transaction boundary，不宣稱 fixed-C 的 `CHAR_createNewChar()` 本身是 atomic transaction。

固定 C 實際順序仍是：創角 → 建 starter Pet → `CHAR_loginAddItemForNew()` → save/finalize；目前 24114 template 未閉合，所以 Web production path 不假造 Item。

測試中的 `itemGrantAdapter` 是 test-only synthetic fixture，只用來證明「若未來取得合法 Item adapter，creation → save → reload」這條 contract 能完整跑通；fixture 不會被 promotion 為正式 Item data。

## State boundary

完成狀態要求：

`hometownConfigured && playerCreationStatsConfigured && elementsConfigured && starterPetGranted && starterItemGranted`

之後才會寫 `creation.completed=true`。

目前 production 可證實到：

- hometown ✅
- player creation stats ✅
- elements ✅
- Starter Pet ✅
- Starter Pet rank ✅
- world.position ✅
- Save Envelope ✅
- Item 24114 ❌ template unresolved

因此目前仍不建立 playable HTML。
