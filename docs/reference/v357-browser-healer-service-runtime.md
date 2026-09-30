# V3.57 Browser Healer service runtime

更新日期：2026-09-30

V3.57 將 pinned fixed-C `Healer` 從「service routing」推進到第一個具體 browser service execution。

## Source evidence

固定 source `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56` 的 `gmsv/src/npc/npc_healer.c` 明確定義：

- `NPC_HealerInit()` 建立 Healer NPC type。
- `NPC_HealerTalked()` 只接受 player，互動距離使用 `NPC_Util_CharDistance`，門檻為 `2`。
- `NPC_HealerAllHeal()` 將 talker 的 HP / MP 設為各自最大值，並對角色持有的寵物做 HP / MP full recovery。

Browser runtime 因此固定使用 `NPC_Util_CharDistance distance=2`，不要求 facing cell；這與 ItemShop 的 `charIsInFrontOfChar` gate 不同。

## Runtime contract

`NPC_HEALER_USE` 必須先通過 audited `Healer` functionSet 與 fixed-source repository/ref 驗證，再通過距離 gate，最後由 `sourceHealerRecovery()` 完成 player HP/MP recovery。

寵物部分使用 canonical Persistent State 的 `pets.petBox`；每一隻 pet 必須已有 `maxHp` / `maxMp`，否則整個 service fail-closed，不做半套恢復。

執行成功會建立新的 state snapshot，`revision + 1`，並更新 `runtimeMeta.updatedAt`。Healer 沒有 Gold / Item side effect，因此不建立第二套 Economy transaction。

## World routing

V3.55/V3.56 已有 World NPC point resolver 與 functionSet routing。V3.57 只新增 `NPC_HEALER_USE` 對該 resolver 的導流；caller 可提供 `targetCell + serviceFunctionSet=Healer`，controller 會先得到 fixed-source World NPC instance，再進 Healer service。

目前不自動推導 party-wide persistent state，因 canonical Persistent State v1 尚未保存 fixed-C party member index。來源 C 的 party branch 因此尚未宣稱 browser parity；單人 talker + 其 `petBox` 是本 milestone 的閉合範圍。

## Fail-closed boundaries

錯誤 fixed source、缺少 `Healer` sourceFunctionSet、非 Healer NPC、距離超過 2、缺少 player coordinate，以及 pet 缺少 max HP/MP 都直接拒絕 mutation。

本輪沒有建立 playable HTML，也沒有改動 `changeevent`、Starter Item 24114、4000→200 disconnected component、3000→200 non-walkable landing point 或 GMQUE 永久停用政策。
