# RO0000 部署資料索引

本資料夾保存目前專案取得的實機／部署端原始快照，供來源追溯、資料比對與重建使用。這裡不是整理後的 runtime 輸出，也不代表已可直接啟動或遊玩。

## 目錄導覽

```text
ro0000/
├─ README.md                         本索引
├─ SOURCE_PROVENANCE.md              來源端點判定規則
├─ docs/
│  ├─ 搭建教程.txt                    手工外網端架設／操作教程
│  └─ 隐盟文本教程.txt                VM 一鍵端架設／維運教程
├─ client/
│  └─ android/
│     └─ 冰河石器-隐盟.apk            Android 客戶端研究參考
└─ server/
   ├─ database/
   │  └─ 175sa.sql                   VM 端資料庫匯出
   └─ merged-source/
      ├─ gmsv/                       遊戲伺服器與主要資料
      │  ├─ gmsvjt                   伺服器執行檔
      │  ├─ setup.cf                 伺服器設定
      │  ├─ data/                    VM 端主要資料根
      │  └─ hydata/data/             同快照中的另一資料根／版本內容
      ├─ saac/                       帳號服務相關檔案
      ├─ www/                        Web 服務檔案
      ├─ wwwroot/                    手工外網端 Web 根目錄
      └─ www/wwwroot/                VM 端 Web 根目錄
```

## 來源與版本辨識

- 只有 `docs/搭建教程.txt` 與 `server/merged-source/wwwroot/` 明確屬於手工外網端。
- 其他 `ro0000/` 快照資料均依目前 provenance 規則標記為 VM 一鍵端；路徑名稱含 `wwwroot` 不代表來源相同。
- `gmsv/data/` 與 `gmsv/hydata/data/` 是不同資料根。相同相對路徑若內容不同，應保留為 variant，不得直接覆蓋或合併。
- 各資料的實際來源角色與判定依據，以 [SOURCE_PROVENANCE.md](SOURCE_PROVENANCE.md) 為準。

## Android 客戶端研究邊界

client/android/冰河石器-隐盟.apk 目前僅能確認是隨快照保存的客戶端材料。必須先有 APK 雜湊、封裝版本及可重現的資源／程式抽取結果，才可據此記錄手機端行為；不得以 APK 檔名或存在本身推論伺服器地圖與路線。

## 原始資料整理規則

1. **保留原始路徑與內容。** 不因副檔名、檔名相似或 blob 重複就搬動、改名、轉碼、覆寫或刪除。
2. **備份／編輯殘留先列管。** `.bak`、`.old`、`.new`、`~`、`.arg--`、`.create---` 等可能是歷史版本、功能變體或建置輸入；不能直接當垃圾。
3. **分段參數檔不可任意合併。** `.arg1`～`.arg9` 先按原路徑保留，需有 parser／loader 證據才能還原其關係。
4. **零位元組檔案不等於損壞。** 必須依格式與使用方式判定。
5. **快照不等於 runtime。** 未完成 loader、語義、依賴與回歸驗證的資料，維持 unresolved／fail-closed，不自行補值或 remap。

## 稽核與後續使用

- [RO0000 完整性稽核](../docs/reference/ro0000-integrity-audit.md)：原始檔案數量、二進位簽章、設定依賴、data／hydata 差異與殘留檢查。
- [Endpoint 完整性報告](../docs/reference/endpoint-completeness-audit.md)：關鍵部署資料是否存在及目前語義缺口。
- [來源目錄 catalog](../data/generated/stoneage_endpoint_source_catalog.json)：逐來源範圍的 provenance、檔案數與內容識別。
- [殘留檔 inventory](../data/generated/stoneage_ro0000_residue_inventory.json)：備份／編輯樣式與分段參數檔清單。
- [孤立殘留語義 audit](../data/generated/stoneage_ro0000_isolated_residue_audit.json)：孤立版本的內容與 runtime eligibility 判定。

截至 2026-10-01 的稽核已確認定義範圍內 12/12 個關鍵部署檔存在且非空；這只代表快照完整性，不代表所有設定依賴、功能版本或 runtime 行為都已閉合。

## 安全提醒

原始教程與設定可能含有帳密或內部連線資訊。原始快照為 provenance 保留；不要將其中的秘密複製到一般文件、generated data、runtime 預設值或公開 UI。
