# StoneAge external source snapshot

這個資料夾集中保存後續整理的石器時代端參考資料。

## 目錄

- `server/merged-source/`：來源已按實際端點規則校正：只有 `wwwroot/` 資料夾屬手工外網端；其餘內容均屬 VM 一鍵端。
- `server/database/`：Server 資料庫匯出／資料庫參考檔。
- `client/android/`：Android 客戶端主程式 APK。
- `docs/`：兩套架設／維運教程。

## 原則

原始內容只重新整理路徑，不任意改寫資料。`搭建教程.txt` 與 `wwwroot/` 明確標記為手工外網端；其餘 `ro0000/` 參考資料視為 VM 一鍵端。後續若與 pinned fixed-C 做 blob SHA 比對，這屬於「端點 provenance → fixed-C variant」分析，不再把兩個外部端點混稱為未知來源。

`ro0000/` 僅作為研究與來源快照區，不直接等同於 production runtime。
