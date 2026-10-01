# Endpoint Source Catalog

更新日期：2026-10-01

## 目的

這份 catalog 把「最完整實機／部署資料」與 pinned fixed-C 的角色正式分開。

目前專案確認的來源背景是：VM 一鍵端與手工外網端都是從可直接架設石器時代手游的實際部署資料複製取得。因此它們是世界資料、NPC、Service、Item、Quest、Event、Warp、Encounter、Database、Web/Client integration 與部署結構的首要重建資料。

這不表示每一個檔案已經逐檔完成 runtime boot proof；它表示 provenance 與資料完整度在重建工作中優先採用這個 endpoint corpus。

## 精確 provenance 規則

只有兩個路徑屬手工外網端：

- `ro0000/docs/搭建教程.txt`
- `ro0000/server/merged-source/wwwroot/`

在本 catalog 的原始 endpoint corpus 範圍內，其餘資料全部標記為 VM 一鍵端。

特別注意：

`ro0000/server/merged-source/www/wwwroot/` 雖然名稱也包含 wwwroot，但不是上面指定的 exact path，因此依規則屬 VM 一鍵端。

## 目前 corpus

根據 repository tree 的實際內容，目前 catalog 分成：

- 手工外網端：23 files；1,053,042 bytes
- VM 一鍵端：8,726 files；184,113,058 bytes
- endpoint corpus 合計：8,749 files；185,166,100 bytes

主要 VM Server snapshot：

- `ro0000/server/merged-source/`：8,745 files；其中精確手工 `wwwroot/` 子樹 22 files，所以 VM 分類 8,723 files。
- `ro0000/server/database/`：1 file
- `ro0000/client/android/`：1 APK
- `ro0000/docs/隐盟文本教程.txt`：1 file

手工外網：

- `ro0000/server/merged-source/wwwroot/`：22 files
- `ro0000/docs/搭建教程.txt`：1 file

上述數量由 `tools/generate_endpoint_source_catalog.mjs` 從 Git tree 產生；source 內容若發生變更，catalog 必須重新生成並通過 regression。

## 與 fixed-C 的關係

Pinned fixed-C：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

fixed-C 主要負責 engine behavior / semantics / lifecycle validation。

因此正式重建順序為：

`Endpoint Provenance → Exact Identity → Endpoint Completeness → Fixed-C Semantic Check → Evidence / Regression → Canonical Runtime`

endpoint 與 fixed-C 不一致時，先判斷是否為實際部署 variant。

**variant ≠ 錯誤**

**fixed-C mismatch ≠ 自動刪除 endpoint data**

## Canonicalization 規則

原始 endpoint data 必須先保留 provenance 與 exact identity。

只有完成必要的 completeness、semantic check、evidence 與 regression 後，才轉入：

`data/generated/`

或正式 runtime module。

Synthetic fixture 不得冒充 endpoint corpus；它只能驗證 contract、transaction、state transition 與 regression。

## 自動驗證

使用：

`node tools/generate_endpoint_source_catalog.mjs --check`

確認 committed catalog 與目前 Git tree 一致，再使用：

`node tools/check_endpoint_source_catalog.mjs`

確認 provenance、scope 與 aggregate invariants。

CI workflow：

`.github/workflows/check-endpoint-source-catalog.yml`
