# GMQUE Source Audit

本頁保留歷史 GMQUE／抓寵考古證據，但自 2026-10-02 起不再列入目前主線開發或 blocker 範圍。

## 目前狀態

GMQUE／抓寵已從目前工作範圍移除。

這代表：
- 不要求目前 playable 主線實作 GMQUE。
- 不把 GMQUE 當成正常遊玩的必要依賴。
- 不再把 endpoint GMQUE argument / reward-pet closure 排入目前待辦。
- 本頁與其他 GMQUE audit / changelog 僅作歷史 provenance 保留。

## 固定來源

- Repository：`gavinlinasd/StoneAge`
- Ref：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- Source：`gmsv/src/npc/npc_eventaction.c`

## 歷史未閉合點

當時尚未取得可逐筆核對的 endpoint GMQUE `RANDGMQUE / QUEPART0..3` arguments，也尚未完成 reward pet `1642 / 1636 / 475` 的 endpoint Enemy / EnemyBase 建立語義。

## Evidence rule

這些歷史資料仍可在未來需要恢復抓寵活動時作為起點；目前不影響主線遊玩，不作為主線 blocker。
