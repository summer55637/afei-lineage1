# V4.60 Browser Battle Pet Win AI Credit

固定 C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

本邊界緊接 `BATTLE_AddExpItem` 的 Enemy EXP／Ride Pet EXP credit，重建 Fixed-C 尾端的 Pet AI 副作用。

## Source behavior

`BATTLE_AddExpItem` 只有在 `norisk == 0` 且 credit participant 本身為 `CHAR_TYPEPET` 時呼叫 `CHAR_PetAddVariableAi`。

Enemy level 高於 Pet：
- `AI_FIX_PETGOLDWIN = +2*10 = +20`

否則：
- `AI_FIX_PETWIN = +1`

`CHAR_PetAddVariableAi` 會把 `CHAR_VARIABLEAI` 加上 delta，並限制在 `[-10000, +10000]`。此操作不消耗 RNG。

## Browser boundary

Browser 只把這個結果先寫入 battle context：
- `variableAi`
- `sourcePetWinAiEvents`

仍不直接寫 Persistent State / DB。

Ride Pet 因為 Fixed-C 是透過 `ridepet` 另外拿 EXP，而 Pet AI 呼叫只檢查 `charaindex[k]` 的 `CHAR_TYPEPET`，所以不會因為「被騎乘」自動再增加一次 Pet Win AI。

## Regression

現有 `tools/check_v457_browser_battle_enemy_exp_ride_pet.mjs` 增加：
- 同級 Pet：`+1`
- Pet 低於 Enemy：`+20`
- 玩家與 Ride Pet 不重複領取 Pet Win AI
- 已處理 Enemy 保持 idempotent
- RNG consumption 仍為 `0`