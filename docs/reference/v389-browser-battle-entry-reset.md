# V3.89 Browser Battle Entry Reset

更新日期：2026-10-01

V3.89 將 fixed-C BATTLE_NewEntry() 的無條件 actor reset 接到 V3.86/V3.87 transient Battle Context。

## Fixed-C reset

加入 Battle 後，fixed-C 對 actor 重新設定：

- BATTLE character mode = BATTLE_CHARMODE_INIT = 1
- battle flag = 0
- command 1/2/3 = -1
- attack / defence / quick modifiers = 0
- damage absorb / reflect / vanish = 0
- capture modifier = 0
- CHAR_ISATTACKED = 1
- battle watch = 0

V3.89 將這些轉成 browser entry transient fields。

## Conditional branches

BATTLE_NewEntry() 後段還有由 compile-time feature flag 控制的 reset：

- PROFESSION_SKILL
- PETSKILL_ACUPUNCTURE
- PETSKILL_RETRACE
- PETSKILL_BECOMEFOX
- PROFESSION_ADDSKILL

V3.89 不把它們假設成永遠存在；先標示 omitted，等待 fixed build feature closure。

## Boundary

V3.89 不執行回合、AI、Status、Damage、Reward、Capture 或 Death settlement，也不把 entry reset 寫進 Persistent State。
