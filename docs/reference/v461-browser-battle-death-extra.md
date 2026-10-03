# V4.61 Browser Battle AddProfit Death Extra

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

V4.61 重建 Fixed-C `BATTLE_AddProfit -> BATTLE_AddExpItem` 的死亡副作用邊界。

## Source boundary

普通 PVE 且 `norisk == 0`：

- Player normal death：Charm `-2`，Lv<=10 時除以 2；default Pet VariableAI `-100`，同樣依 level flag 除以 2；command 設為 NONE。
- Player ultimate death：Charm `-4`，default Pet VariableAI `-1000`，同樣受 level flag；Default Pet 先離開 Battle Entry，但不清除玩家的 DefaultPet/activePetId 關係。
- Pet normal death：自身 VariableAI `-500`，owner `DEADPETCOUNT += 1`；owner Lv<=10 時上述 VariableAI delta 除以 2。
- Pet ultimate death：自身 VariableAI `-1000`，owner `DEADPETCOUNT += 1`，並離開 Battle Entry；同樣使用 owner level flag。

`CHAR_AddCharm` clamp 到 `0..100`；`CHAR_PetAddVariableAi` clamp 到 `-10000..10000`。

## Marefia / PetID 718

`_PET_LIMITLEVEL` 下，PetID 718 每次死亡固定先消耗：

1. RAND(1,8)
2. RAND(1,4)
3. RAND(1,4)
4. RAND(1,4)

四項 allocation 後各自 clamp 到 `0..50`，再將 MODAI 以 `MODAI - trunc(MODAI*5/100)` 更新。

若 allocation snapshot 缺失，不猜四圍，但仍保留四顆 RNG 與 MODAI -5% 的已知行為。RNG 缺失時 Browser fail-closed。

## Browser boundary

V4.61 先寫 Battle Context 的 `sourceDeathExtraEvents`，不直接寫 Persistent State。Death Commit 會標記 `sourceAddProfitDeathPending`，之後 AddProfit 依來源順序處理死亡副作用。

## Regression

`tools/check_v461_browser_battle_death_extra.mjs` 覆蓋 Player normal / ultimate、Pet normal、Marefia 718、norisk gate 與重播行為。
