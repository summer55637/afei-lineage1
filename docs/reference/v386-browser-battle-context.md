# V3.86 Browser Battle Context

更新日期：2026-10-01

V3.86 把 V3.84 generated Enemy roster 接到固定 C 的 battle container，但只建立 transient context，不重寫 Battle Engine。

## Fixed-C placement

Pinned BATTLE_CreateVsEnemy()：

1. 建立 BATTLE_CreateBattle()
2. Side[0]=BATTLE_S_TYPE_PLAYER
3. Side[1]=BATTLE_S_TYPE_ENEMY
4. Enemy 依生成 roster 呼叫 BATTLE_NewEntry()
5. 玩家透過 BATTLE_PartyNewEntry() 加入
6. 玩家 default living pet 透過 BATTLE_PetDefaultEntry() 放在 owner 後第五格
7. Enemy entries 最後交換 Entry[0..4] 與 Entry[5..9]

V3.86 用相同的 entry / bid topology 建立 browser context：

- Player slot 0 / bid 0
- active Pet slot 5 / bid 5
- Enemy side bid = 10 + enemy entry slot

因此四隻 Enemy 的 generated roster 若為 [120,120,123,123]，完成 fixed-C swap 後會落在 bid 15、16、17、18。

## Idle lifecycle

成功的 ENCOUNTER_BATTLE_CONTEXT_BUILD 只有在 Idle encounter_pending 時接受。

成功後：

encounter_pending → BATTLE_STARTED → in_battle

Idle mode 會透過既有 Persistent State runtime + Save Envelope 儲存；Battle Context 本身保持 controller-memory transient，不寫入 save payload。

## Explicit limitations

- browser 不虛構 server battleindex，context 的 transient battleindex=null
- battleFieldNo 必須 caller 提供；尚未把 BATTLE_getBattleFieldNo() 的完整 map join 偷帶進來
- 不執行 turn / damage / status / AI / reward
- 死亡玩家或死亡 active Pet 不得建立 context
- battle_finished / disable 後 controller 清除 transient context

Regression：tools/check_v386_browser_battle_context_runtime.mjs
