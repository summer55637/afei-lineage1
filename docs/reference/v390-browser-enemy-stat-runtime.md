# V3.90 Browser Enemy Stat Runtime

更新日期：2026-10-01

V3.90 將 fixed-C ENEMY_createEnemy() 的戰鬥 stat materialization 拆成 deterministic browser runtime。

## Fixed-C order

`ENEMY_createEnemy()` 的來源順序：

1. level：baselevel > 0 時直接使用；否則 `RAND(LV_MIN,LV_MAX)`
2. copy EnemyBase
3. 四圍各做一次 `RAND(0,4)-2`
4. 再做 10 次 `RAND(0,3)`，每次讓對應四圍 +1
5. 用 `((level-1)*LVUPPOINT+INITNUM)*baseStat` 計算 CHAR_VITAL/STR/TOUGH/DEX
6. `CHAR_complianceParameter()` 後得到 `MAXHP)
7. HP 由 source flow 設成 MAXHP
8. `ENEMY_getRank()` 仍使用原始 EnemyBase 四圍，不使用第 3/4 步的 temporary mutation

## Browser boundary

V3.90 要求 caller 注入 RNG：

- level RNG：0..(LV_MAX-LV_MIN)
- 四個 base-stat RNG：各 0..4
- 十個 allocation RNG：各 0..3

因此同一份 input 可以 deterministic 重現 source 結果，不在 runtime 偷用 Math.random。

已來源化：

- level
- VITAL / STR / TOUGH / DEX
- MAXHP / HP
- 元素
- status resistance
- PetSkill slots
- critical / counter / rare / slot / image / pet flag
- pet rank

尚未閉合：

- CHAR_DEFAULTCHAR(31010) 帶出的 CHAR_MAXMP
- ENEMY_RandomChange() 的特殊 Enemy 變化
- Enemy style 裝備與 ITEM_equipEffect 對 derived battle values 的影響
- EXP / reward

Regression：`tools/check_v390_browser_enemy_stat_runtime.mjs`
