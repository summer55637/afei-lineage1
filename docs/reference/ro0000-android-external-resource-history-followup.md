# RO0000 Android：external client-resource history follow-up

更新日期：2026-10-03

## 本輪新增的歷史證據

除了目前工作樹的 archive scan，本輪又直接對 GitHub repository 的 commit history 做 exact-path 查詢。

已核對的 production client resource 路徑包括：

- `battle00.sabex` / `battle219.sabex`
- `data/battlemap/battle00.sabex` / `battle219.sabex`
- `data/battleMap/battle00.sabex` / `battle219.sabex`
- `s/adrn.bin`
- `s/real.bin`
- `s/spr.bin`
- `s/spradrn.bin`
- `path/map4/real.bin`
- `data/pal/Palet_1.sap`
- `data/update/list.dat`
- `patch_0.zip` / `patch_5.zip`
- `data/serverdata.dat`
- `data/adrn.bin`
- `data/real.bin`
- `data/spr.bin`
- `data/spradrn.bin`

上述 exact-path commit queries 全部回傳 0 commits。

## 公開 Android source 的外部資料分發交叉核對

本輪另外檢查公開的 `alrightlook/StoneAgeMobileApp@8c870c87ce1305c52fb6713bf824619467847bba`，目的只限於確認「歷史 Android client 如何取得外部資料」，不是尋找可直接併入 RO0000 的 production bytes。

該版本的 Android manifest 明確是：

- package：`com.jerrystudio.stoneage`
- minSdk：10
- targetSdk：12
- launcher activity：`com.jerrystudio.stoneage.DownloadPage`

其 `DownloadPage.java` 顯示另一種早期外部資料 bootstrap：

```
Android app
  -> 下載外部 jerrysa.zip
  -> 解壓到外部儲存的 jerrysa/
  -> 若缺少 real_137.bin，再另外下載該 shard
  -> 啟動 SDL client
```

同一 source tree 的 battle-map 路徑仍是舊式 `.sab` 命名，並使用 split resource，例如 `real_137.bin` / `adrn_137.bin`。

這與本次 target APK 的「APK 主要是 bootstrap/application package、完整 client data 在 APK 外部」結構方向一致，但不能作為 target identity proof。兩者至少已有直接可見的 package、SDK 與資源命名差異，因此不把該 source 或其外部下載位置視為 RO0000 target source。

出於來源與內容邊界，本文件不保存該公開 source 內硬編碼的第三方下載 URL，也不把其外部資源包視為已取得的 RO0000 production bytes。

## 公開 source tree 的 binary-resource 排除結果

截至本輪指定 commit：

- `BismarckDD/Stoneage@2f736808ff4361f5429ee919b718c88fabb60346`：recursive tree 未找到 `.bin` / `.sap` / `.sab` / `.sabex` / `.dat` game-resource payload；可見內容以 source/tooling 為主。
- `Signally190/sking-sacli@40cb67ef090ebc0cffd57ca947871bdfd0b18331`：recursive tree 未找到上述 game-resource payload；可見的 zip 為 tooling/source 類檔案。
- `flowerjunho/stoneage-light@e9fb45eef44ae54dc7d6d5428e3921cf803fbe00`：recursive tree 未找到上述 game-resource payload。

因此這三個公開 source 可繼續作為格式、語義與版本 lineage 的交叉證據，但目前沒有一個能直接提供 target 的實體 resource bytes。

## 證據意義

這可以排除一個具體可能性：

> 以上列出的 canonical / common historical client-resource paths 並沒有以同名 path 出現在目前可查詢的 repository commit history。

再加上本輪對主要公開 source tree 的 recursive binary inventory，現階段沒有發現可直接拿來做 target byte identity 比對的公開 resource payload。

但這不能單獨證明所有 external production bytes 從未存在於任何 Git object、release artifact、私有部署包或其他名稱的壓縮容器；不同檔名、重新命名、Git LFS、不可達 object、Actions artifact 及外部部署快照仍是不同證據層。

因此專案仍保持 fail-closed：

```
exact-path history queries = 0 commits
public source tree resource payloads = none found
        ↓
canonical historical path evidence = none
        ↓
target production bytes       = still unavailable
```

## 與 full-depth audit 的關係

本輪也已把 `tools/audit_ro0000_android_git_resource_history.py` 接入 Android workflow，使用：

```
actions/checkout
  fetch-depth: 0
        ↓
git rev-list --objects --all
        ↓
resource-path classification
        ↓
data/generated/stoneage_ro0000_android_git_resource_history_audit.json
```

該 full-depth audit 才是用來檢查整個 reachable Git history 的主要機制；本文件的 exact-path 結果與公開 source tree inventory 都是獨立的交叉核對。

目前 `main` 上仍未看到 full-depth audit 產出的 generated JSON，因此目前不能把 CI 尚未取得的結果當成已完成證據。

## 目前仍未閉合

- 真正的 `battle00.sabex` ~ `battle219.sabex` bytes
- target `adrn.bin` / `real.bin` / `spr.bin` / `spradrn.bin`
- palette bytes
- `data/update/list.dat`
- `patch_0.zip` ~ `patch_5.zip`
- update endpoint 的實際 response
- Android 真機的實際下載／解包／載入 runtime trace
- APK v1 MANIFEST 中兩個 `libStoneage.so` digest mismatch 的來源

所有未取得的 production bytes 仍不以推測或 public-source bytes 代替。
