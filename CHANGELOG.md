## V2.70

- 以 V2.69 PLAYABLE CORE 為底加入 PWA、Service Worker 離線快取。
- 新增離線放置 EXP 估算（單次最多 12 小時、70% 效率係數）。
- 新增 JSON 存檔匯出／匯入，方便 PC 與手機搬移。
- 新增 PC／手機 PWA 安裝入口。
- 存檔 schema 30 → 31，舊存檔自動相容。

# 阿肥石器時代放置版－完整開發紀錄

根目錄 README 已改為精簡首頁；原本超大型 README 的歷史內容**沒有刪除**，完整依版本區段保存於下列檔案。

目前最新可玩核心：**V2.01**

## 歷史分檔

1. [專案起點～V0.46](docs/changelog/part-01-intro-to-v0.46.md)
2. [V0.47～V0.72](docs/changelog/part-02-v0.47-to-v0.72.md)
3. [V0.73～V0.96](docs/changelog/part-03-v0.73-to-v0.96.md)
4. [V0.97～V1.26](docs/changelog/part-04-v0.97-to-v1.26.md)
5. [V1.27～V1.51](docs/changelog/part-05-v1.27-to-v1.51.md)
6. [V1.52～V1.74](docs/changelog/part-06-v1.52-to-v1.74.md)
7. [V1.75～](docs/changelog/part-07-v1.75-onward.md)

## 最新版本 V2.01

V2.01 已接入玩家寵低忠誠 `RANDOMACT` 剩餘大組之一：28 筆 `PETSKILL_BattleModel`。

- 28 筆 fixed runtime 全為 `type=5`（cover-all + physical）
- `PETSKILL_BattleModel()` 覆寫 COM2 type/object-count，因此 RANDOMACT 原先抽到的單體 `toNo` 不再作真正目標
- 敵方 `BATTLE_MultiList + SortLoc` 固定依 source slot `13,11,10,12,14,18,16,15,17,19` 排序
- extra AttackObject 的 random target RNG 不預抽，而是在各物件執行當下逐顆抽
- extra object 若抽到已死亡的原始目標直接跳過，不補抽
- 保留 option 能力修正 parser 的原 bug：攻／防／敏皆以 `WORKATTACKPOWER` 為基底
- physical bit 4 使用真正 Guardian substitution
- actual defender 存活時，即使 MISS／DODGE／0 damage 仍 consume BattleModel ItemCrush RNG；致死則跳過
- 狀態檢定在 ItemCrush 後，使用 EffectHit / range 30 / Bai 1，並 exact 儲存 `iTurn`
- 已接麻痺、睡眠、石化、魔障、劇毒、虛弱、天羅地網
- BattleModel 不進普通 Counter，且沒有 per-object AddProfit
- V2.01 regression 已接入 CI，V1.72～V2.01 全部 success

完整 V1.75～V2.01 原 C 對照與 regression 紀錄請看第 7 份歷史檔。
