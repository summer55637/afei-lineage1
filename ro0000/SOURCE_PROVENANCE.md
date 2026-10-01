# ro0000 Source Provenance

更新日期：2026-10-01

## 固定端點規則

本檔記錄目前倉庫對 ro0000/ 來源端點的明確 provenance：

| 路徑／範圍 | 來源端點 | 用途 |
|---|---|---|
| ro0000/docs/搭建教程.txt | 手工外網端 | 外網端架設／操作參考 |
| ro0000/server/merged-source/wwwroot/ | 手工外網端 | 外網端 Web 根目錄資料 |
| ro0000/server/merged-source/**（排除 wwwroot/） | VM 一鍵端 | VM 一鍵部署取得的 Server／Web 參考資料 |
| ro0000/server/database/175sa.sql | VM 一鍵端 | VM Server 資料庫參考 |
| ro0000/client/android/冰河石器-隐盟.apk | VM 一鍵端 | VM／Server 配套取得的 Android Client 研究參考 |
| ro0000/docs/隐盟文本教程.txt | VM 一鍵端 | VM／文本端架設／維運參考 |

## 重要邊界

「VM 一鍵端」與「手工外網端」是本專案的來源 provenance 標籤；它們不是 fixed-C 的同義詞。真正的 source parity 仍以 pinned gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56 為最高行為依據。

因此後續分析順序固定為：

endpoint provenance → file/blob identity → pinned fixed-C comparison → evidence/runtime eligibility

同名不同內容只表示相對 pinned fixed-C 的 variant，不能再解讀成「來源端點未知」。

## wwwroot 注意事項

倉庫目前可見兩個 wwwroot 路徑：

- ro0000/server/merged-source/wwwroot/
- ro0000/server/merged-source/www/wwwroot/

依目前端點規則，凡位於 wwwroot 目錄內的資料均標記為手工外網端資料；實際要進 production runtime 前仍需另外完成檔案用途、依賴與授權／安全審查。

## 使用規則

不要再以「merged-source 曾經混放」作為來源未知的預設解釋。若要判斷某一個檔案是否可成為 runtime evidence，先依本檔標記來源端點，再與 pinned fixed-C 或其他 authoritative evidence 做逐檔比對。
