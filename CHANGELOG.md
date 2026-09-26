# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V1.79**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V1.79

V1.79 接上玩家寵低忠誠 RANDOMACT 的嗜血技／浴血狂襲：

- 503 / 504 / 505 / 714 / 833 保留 `atoi(first)/100` 的 C 整數除法 bug，現有 30 / 20 / 10 全部等於 0，不實際降攻
- 623 / 659 依 fixed `BATTLE_AttackSeq` 使用攻 +20% 與會心率 ×1.3
- `BATTLE_S_AttackDamage` 的 Guardian 只替換 local AttackSeq defender，真正 DamageSub / death / ItemCrush / drain 仍落在原目標
- 原目標已有 DamageReact 時，skill type 先降成普通反應：不吸血，DamageToHp2 的 +20% / ×1.3 也不套
- 623 的 HP50% 使用限制只有資料說明／註解，fixed `PETSKILL_DamageToHp2()` 沒有實際判斷，Web 不自行補 gate
- 兩類皆不進普通 Counter

完整 V1.79 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
