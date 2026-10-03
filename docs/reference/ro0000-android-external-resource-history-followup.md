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

## 證據意義

這可以排除一個具體可能性：

> 以上列出的 canonical / common historical client-resource paths 並沒有以同名 path 出現在目前可查詢的 repository commit history。

但它不能單獨證明所有 external production bytes 從未存在於任何 Git object；不同檔名、重新命名、壓縮容器、Git LFS、不可達 object 與 GitHub Actions artifact 仍是不同證據層。

因此專案仍保持 fail-closed：

```
exact-path history queries = 0 commits
        ↓
canonical historical path evidence = none
        ↓
actual production bytes       = still unavailable
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

該 full-depth audit 才是用來檢查整個 reachable Git history 的主要機制；本文件的 exact-path 結果是獨立的交叉核對。

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
