# StoneAge external source snapshot

這個資料夾集中保存後續整理的石器時代端參考資料。

## 目錄

- `server/merged-source/`：目前從 VM 一鍵端與手工外網端收集、但歷史上曾直接混放的服務端資料；以現有內容為準，不假裝已拆成兩份獨立快照。
- `server/database/`：Server 資料庫匯出／資料庫參考檔。
- `client/android/`：Android 客戶端主程式 APK。
- `docs/`：兩套架設／維運教程。

## 原則

原始內容只重新整理路徑，不任意改寫資料。後續會以檔案內容與 blob SHA 進行 identical / variant / endpoint-specific 比對，再決定哪些資料進入正式 source evidence 與 runtime。

`ro0000/` 僅作為研究與來源快照區，不直接等同於 production runtime。
