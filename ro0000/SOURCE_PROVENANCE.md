# ro0000 Source Provenance

更新日期：2026-10-02

## 固定端點規則

本檔記錄目前倉庫對 ro0000/ 來源端點的明確 provenance：

| 路徑／範圍 | 來源端點 | 用途 |
|---|---|---|
| ro0000/docs/搭建教程.txt | 手工外網端 | 外網端架設／操作參考 |
| ro0000/server/merged-source/wwwroot/ | 手工外網端 | 外網端 Web 根目錄資料 |
| ro0000/server/merged-source/**（排除 wwwroot/） | VM 一鍵端 | VM 一鍵部署取得的 Server／Web 參考資料 |
| ro0000/server/database/175sa.sql | VM 一鍵端 | VM Server 資料庫參考 |
| ro0000/client/android/冰河石器-隐盟.apk | VM 一鍵端 | Android 客戶端研究材料；需先驗證 APK 雜湊、版本及提取內容才可建立 client evidence |
| ro0000/docs/隐盟文本教程.txt | VM 一鍵端 | VM／文本端架設／維運參考 |

## 來源角色更新：最完整 endpoint 資料主來源

目前已確認 VM 一鍵端與手工外網端構成我們手上的最完整實機／部署資料集合，因此後續重建不再把它們只視為「參考資料」。

- VM 一鍵端 + 手工外網端：World、NPC、Service、Item、Quest、Event、Warp、Encounter、Database 與 endpoint integration 的首要重建資料來源。
- pinned fixed-C：可讀 C 原始碼中的伺服器核心行為、演算法、執行順序、資料格式與 C runtime semantics 的校驗基準；不等同於 RO0000 的實際部署版本。
- endpoint 與 fixed-C 不一致時，不自動刪除 endpoint variant；先判斷它是否是該部署版本的實際差異。

完整規則見 `docs/source-authority-and-provenance.md`。

## Android 客戶端資料邊界（2026-10-02）

已完成首輪封裝稽核，結果固定於 data/generated/stoneage_ro0000_android_apk_audit.json：APK SHA-256 6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c；Manifest package com.newssa.stoneage.ko，versionName 1.0，versionCode 1。ZIP CRC 通過，38 個 archive entries。


APK 是客戶端來源，不是伺服器資料來源。未完成檔案雜湊、封裝版本與內容抽取驗證前，目前已確認 APK SHA-256 與 Manifest，並從 classes.dex／libStoneage.so 找到 path/map4/real.bin、s/real.bin、s/spr.bin、data/serverdata.dat、data/update/list.dat 等路徑參照；這些不是資源內容證據，仍不能宣稱已確認地圖、碰撞、操作或網路協定。經驗證的 APK 資源應另記 client variant，不覆寫 gmsv/data、hydata/data 或 pinned fixed-C。

## 來源角色校正（2026-10-02）

RO0000 與 pinned fixed-C 不再用「誰才是引擎」的方式描述。RO0000 保存的是實際部署系統快照，包含 gmsvjt 伺服器執行檔、資料、設定、資料庫及 client / web 配套；pinned fixed-C 則提供可閱讀、可追蹤的 C 程式碼，主要用於解析與校驗底層伺服器行為。兩者是互補證據，依問題範圍分工，不互相取代。

## 重要邊界

「VM 一鍵端」與「手工外網端」是本專案的來源 provenance 標籤；它們不是 fixed-C 的同義詞。真正的 source parity 仍以 pinned gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56 為最高行為依據。

因此後續分析順序固定為：

endpoint provenance → file/blob identity → pinned fixed-C comparison → evidence/runtime eligibility

同名不同內容只表示相對 pinned fixed-C 的 variant，不能再解讀成「來源端點未知」。

## 路徑判定注意事項

倉庫目前可見兩個名稱包含 wwwroot 的路徑：

- ro0000/server/merged-source/wwwroot/
- ro0000/server/merged-source/www/wwwroot/

依目前確認，手工外網端只有兩個 exact path：

- ro0000/docs/搭建教程.txt
- ro0000/server/merged-source/wwwroot/

因此 ro0000/server/merged-source/www/wwwroot/ 雖然名稱也包含 wwwroot，仍依「其餘全部屬 VM 一鍵端」規則標記為 VM 一鍵端。

## 使用規則

不要再以「merged-source 曾經混放」作為來源未知的預設解釋。若要判斷某一個檔案是否可成為 runtime evidence，先依本檔標記來源端點，再與 pinned fixed-C 或其他 authoritative evidence 做逐檔比對。
