# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V1.81**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V1.81

V1.81 接上玩家寵低忠誠 RANDOMACT 的屬性強化／屬性轉換攻擊：

- Modifyattack：544～547、825～828；依原目標永久屬性追加傷害，保留 `rand()%(ModNum+5)` 後整數 `/100` bug
- Mdfyattack：548～551、697～700；本次 AttackSeq 將攻方四屬清零，只留 option 指定屬性
- Guardian 仍只替換 local AttackSeq defender；真正 DamageSub / death / ItemCrush 留在原目標
- Modifyattack 的 bonus 被原目標 DamageReact 造成的 `skill_type=-1` 取消；Mdfyattack 元素替換仍成立
- execution-time TargetAdjust 保留
- 兩類都不接普通 Counter

完整 V1.81 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
