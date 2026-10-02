# RO0000 Android Client APK: First-Pass Audit

更新日期：2026-10-02

## Identity

| 欄位 | 稽核結果 |
|---|---|
| File | `ro0000/client/android/冰河石器-隐盟.apk` |
| Provenance | VM 一鍵端 |
| Size | 24,931,847 bytes |
| Git blob SHA | `eaeb7c513ca0731c4bdeedd0987081b4bf443031` |
| SHA-256 | `6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c` |
| ZIP integrity | CRC pass, 38 entries |
| Package | `com.newssa.stoneage.ko` |
| Version | code 1, name 1.0 |
| SDK | min 21, target 29 |

## Archive and binary indicators

- One `classes.dex` (1,453,136 uncompressed bytes).
- Native libraries for `armeabi-v7a` and `x86`, including `libStoneage.so`, SDL2, SDL2_image, SDL2_mixer, SDL2_ttf, GCloudVoice, hidapi and mpg123.
- Visible packaged assets are two fonts and seven `assets/data/skin` PNG files.
- Archive path scan found no obvious map/tile/world/field/NPC/monster/battle filename entries.
- String scan of `classes.dex` and both `libStoneage.so` variants found client path references including `path/map4/real.bin`, `s/real.bin`, `s/adrn.bin`, `s/spr.bin`, `s/spradrn.bin`, `data/serverdata.dat` and `data/update/list.dat`.

These native strings are useful leads for locating the map/sprite resource loader and update path. They do not prove that the referenced files are packaged in this APK or downloaded at runtime. The data may exist in a separately installed directory or be handled through another resource layer.

## Interpretation boundary

這是封裝、Manifest 與原生字串線索盤點，不是完整 APK 逆向分析。尚未驗證簽章、原生程式呼叫點、實際資源內容、地圖碰撞、伺服器連線與實際遊戲畫面。不得用本報告單獨改寫 server map 或 Fixed-C 語義。

## Reproducibility

執行 `python3 tools/audit_ro0000_android_apk.py --apk 'ro0000/client/android/冰河石器-隐盟.apk' --output artifacts/audit.json --baseline data/generated/stoneage_ro0000_android_apk_audit.json`。CI 先執行字串掃描單元測試，再以 APK SHA-256 與 Manifest 身分比對已提交 baseline；若 APK 變動，需審核並更新 baseline。

GitHub Actions run: https://github.com/summer55637/afei-lineage1/actions/runs/36971769026
