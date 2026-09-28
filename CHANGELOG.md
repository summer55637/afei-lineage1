# 阿肥石器時代放置版－完整開發紀錄

目前最新可玩核心：**V2.95**

目前主線已完成 V2.95；本版完成 Guardian substitution no-second-suit-dodge source audit。

固定原 C：
`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

開發原則：

> **原 C 規則優先、不猜數值**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～V2.78](docs/changelog/part-07-v1.75-onward.md)

## 主線狀態

- V2.68：Skill 12「冰箭術」
- V2.69：Skill 13「火龍槍」＋ shared `DOOMTIME` charge lifecycle
- V2.70：Skill 14「冰鏡術」／defense-derived special damage
- V2.71：Skill 15「火附體」／固定 C StatusTbl mapping correction
- V2.72：Skill 16「雷附體」／on-hit aura lifecycle
- V2.77：Skill 44／45 非戰鬥職業技能／180 秒遇敵率生命週期
- V2.78：玩家出戰 Pet RANDOMACT 的 PETSKILL_StatusChange 完整狀態 token 映射
- **V2.81：PetSkill runtime reachability／pending boundary audit**
- V2.80：Enemy FallGround／Combined source boundary audit
- V2.95：Guardian substitution 不重跑第二次 suit dodge
- V2.94：fixed BATTLE_DuckCheck JYUJYUTU KawashiPara=0.027 branch
- V2.93：DamageReact 阻斷 DuckCheck、但保留獨立 suit dodge
- V2.92：Enemy→Player weapon Guardian boundary
- V2.91：target-side DamageReact pre-Duck／Counter FALSE boundary
- V2.90：attacker-side DamageReact → Counter FALSE boundary
- V2.89：Counter GuardAdjust boundary
- V2.88：pre-DamageReact Counter boundary
- V2.87：fixed BATTLE_Attack DamageReact → Counter FALSE boundary
- V2.86：PETSKILL_Merge／Fixitem／Inslay 戰鬥 FALSE source boundary＋PetSkill function closure audit
- V2.79：Enemy PETFLG source parity／PetSkill source-missing boundary regression

詳細版本行為、原 C 對照、RNG 順序與 regression 均以各歷史檔為準。

