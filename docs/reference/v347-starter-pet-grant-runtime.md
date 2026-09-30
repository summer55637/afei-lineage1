# V3.47 Starter Pet Grant Runtime

更新日期：2026-09-30。

V3.47 將 V3.45 source-closed starter Pet 真正寫入 canonical Persistent State。

## Fixed-C execution

`ENEMY_createPetFromEnemyIndex` 的 RNG 與建立順序維持：1 次 level + 4 次 base stat + 10 次 allocation + 1 次 PetMailEffect = 16 次。Pet 的 VariableAI 由 source 明確設為 0；compliance 後 HP 設為 MaxHP。

Starter Pet 的四個 hometown mapping：0→EnemyID1/TempNo2、1→2/112、2→3/102、3→4/34。

## State boundary

grant runtime 只改 `pets.petBox` 與 `creation.starterPetGranted`，不自行設定 team 或 activePetId；source create path 沒有明確的 default-pet activation，因此這兩個欄位保持原狀。

Item1=24114 仍未閉合 item template，所以本輪不假裝完成整個 starter reward transaction；Item grant 會留在 pending boundary。

不新增 playable HTML。