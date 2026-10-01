# GMQUE Source Audit

本頁記錄 `main` 目前已證實的 GMQUE source contract，以及重新取得 endpoint corpus 後的 reopen 狀態。

## 目前政策

GMQUE／抓寵活動已從永久停用清單移除，進入 `reopened-for-source-reconstruction`。

這不等於活動已啟用。只有 source closure → semantic check → regression → runtime admission 完成後，才可進入 playable。

## 固定來源

- Repository：`gavinlinasd/StoneAge`
- Ref：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- Source：`gmsv/src/npc/npc_eventaction.c`

## 新 endpoint 資料的優先級

首要檢查 `ro0000/server/merged-source/gmsv/data/npc/`、`setup.cf`、`enemy1.txt`、`enemybase1.txt` 與 VM database。這些資料屬於目前最完整的實機／部署 corpus。

## 仍未閉合

- 實際 endpoint GMQUE `RANDGMQUE / QUEPART0..3` arguments。
- endpoint reward pet `1642 / 1636 / 475` 的完整建立資料。
- endpoint NPC → GMQUE feature binding。

Google 的精確關鍵字搜尋本輪沒有得到可直接採信的實際活動參數，因此保持 endpoint-specific unresolved，不猜測。

## Evidence rule

外部 fork 可以協助定位 layout 或歷史版本，但不能直接覆蓋 endpoint corpus 或 pinned fixed-C。