# ro0000 Integrity Audit

## 目的

ro0000 是目前專案最重要的實機／部署資料 snapshot。這一輪先做「整理、檢測、檢查、測試」，不直接搬動或刪除原始檔案，避免破壞原始路徑、blob identity 與 provenance。

目前固定流程：

ro0000 raw snapshot
→ provenance / identity
→ integrity audit
→ semantic audit
→ runtime

## 目前檢測基準

2026-10-01 的 Git tree 檢測結果：

- ro0000：8,751 個檔案、185,169,695 bytes。
- endpoint source catalog 排除 ro0000/README.md 與 ro0000/SOURCE_PROVENANCE.md 後：8,749 個 corpus 檔案。
- 12 個 key artifacts 全部存在且非空。
- 手工外網 wwwroot：22 個檔案。
- VM 端 nested wwwroot：22 個檔案；兩邊 21 個 blob 完全相同、1 個同名檔案內容不同。
- gmsv/data：4,176 個檔案；hydata/data：4,119 個檔案；同相對路徑 3,839 個 blob 相同、222 個不同，另有 115 / 58 個各自獨有。
- 備份／編輯殘留樣式：56 個；另有 28 個 .arg1～.arg9 多段參數檔，兩者都不能直接當垃圾。
- 零長度檔案：30 個；零長度本身不代表損壞。

## 整理規則

### 不物理搬家

ro0000 是來源 snapshot，不是工作區。即使 gmsv/data 與 hydata/data 有大量相同 blob，也不能直接把其中一份搬走或刪掉。

### 歷史／編輯樣式先列管

.bak、.old、.new、~、.arg--、.create--- 等先視為待審資料。只有在確認不是 runtime source、不是另一個 endpoint variant、不是建置／工具輸入後，才考慮清理。

### endpoint variant 必須保留

目前 gmsv/data 與 hydata/data 有 222 個同相對路徑但 blob 不同的檔案。這批差異可能是部署版本差異，不能因為與另一份相同路徑內容不同就自動覆蓋。

### setup 缺檔先當 evidence gap

setup.cf 的 data/... 路徑檢查目前會區分 file、directory、missing。已知 missing 候選包含 freepetskillshop.lua、itemset3.txt、itemset4.txt、itemset5.txt、appear.txt。這些不能直接刪除或補猜；尤其 itemset3～5 可能受 ITEMSET6 compile-time branch 影響，需要 loader/build semantics 再確認。

## 測試內容

新的 tools/check_ro0000_integrity.mjs 為 read-only audit，檢查：

- Git tree、blob、bytes 與既有 endpoint catalog 是否一致。
- key artifacts 是否完整且非空。
- gmsv/data 與 hydata/data mirror 統計。
- 手工 wwwroot 與 VM nested wwwroot 差異。
- backup-like / multipart argument / zero-size inventory。
- setup.cf data path 參考完整性。
- gmsvjt ELF magic。
- Android APK ZIP magic。
- 175sa.sql 基本 MySQL dump 結構。
- endpoint map 檔案的 LS2MAP signature。
- encounter、group、enemy、enemybase、mapwarp 基本資料存在性統計。

它只會檢測與報告，不會修改 ro0000。

## 安全注意

ro0000 原始 setup／教程包含 credential-like 設定與部署敏感資訊。這些內容作為 provenance snapshot 保留，但 canonical runtime、README、generated data、公開 UI 與一般文件不應重新散播其中的密碼、token 或內部連線資訊。

## CI

check-endpoint-completeness workflow 在 ro0000 變動時，現在會先執行：

node tools/check_ro0000_integrity.mjs

然後再執行原有 endpoint completeness check。

因此 ro0000 每次變更都會先通過「原始資料完整性」這一層，再進 semantic／runtime audit。
