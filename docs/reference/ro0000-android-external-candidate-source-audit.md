# RO0000 Android：外部資源候選來源（未核驗）

更新日期：2026-10-03

## 候選來源

公開網頁目前可找到一個 2026 年發布的「冰河石器時代」Linux + Android 資源包。其頁面標示：

- 平台：Android
- 資源大小：約 2.24 GB
- 版本描述：Linux 手工服務端 + Android client + 簡易後台
- 頁面另提供 Android client 的修改／重新簽名流程說明

來源頁面：

https://www.mir6.com/mobile/80406.html

另一個公開頁面也有同名「冰河石器時代」資源項目，但需要取得下載權限：

https://webgame.in/2026/09/12/%E5%85%B8%E8%97%8F%E6%87%B7%E8%88%8A%E6%89%8B%E9%81%8A%E3%80%90%E5%86%B0%E6%B2%B3%E7%9F%B3%E5%99%A8%E6%99%82%E4%BB%A3%E3%80%91%E6%9C%80%E6%96%B0%E6%95%B4%E7%90%86%E5%96%AE%E6%A9%9F%E4%B8%80%E9%8D%BE/

## 與 RO0000 target 的關係

目前只有「遊戲名稱／平台／Android client」層級的外部線索，沒有：

- target APK SHA-256 對應；
- target `libStoneage.so` SHA-256 對應；
- package `com.newssa.stoneage.ko` 對應；
- `battle00.sabex` / `adrn.bin` / `real.bin` / `spr*.bin` payload hash 對應；
- `data/update/list.dat` 或 `patch_0.zip` 等 payload 對應。

因此本來源目前只標記為：

```
candidate external source
        ≠
RO0000 target production source
```

不把其中任何 bytes、版本或檔案內容直接併入 production reconstruction source。

## 為什麼仍值得保留

該公開頁面的安裝教學明確把 Android client 與服務端資源包一起交付，並描述 Android client 的 native `libStoneage.so` 可被修改後重新簽名。

這與我們目前從 target APK 得到的「APK 為 bootstrap/application package、完整 client data 位於 APK 外部」結構相容，但只是結構層面的旁證，不是 target identity proof。

下一個真正有價值的核驗條件是取得該候選包的實體檔案，然後只做：

1. archive/file listing；
2. APK hash 與 package 比對；
3. native library hash / Build ID 比對；
4. `battle*.sabex`、ADRN/Real/SPR、palette、update/patch payload hash inventory；
5. 與 RO0000 target evidence 做逐檔比對。

在完成上述 identity check 前，不引用候選包內容補足任何 RO0000 target bytes。


## 2026-10-03 availability recheck

The public listing at https://www.mir6.com/mobile/80406.html displays a publication date of 2026-08-15 and a package size of 2.24 GB. It labels access as 30 Mi coins or free for VIP members and carries a learning-only disclaimer; its notice says commercial use requires legitimate authorization.

This check did not obtain the archive bytes or a verifiable manifest/hash for the contained client resources. The listing therefore remains a gated candidate only. Its advertised package size, name, and installation instructions do not establish that its APK, `libStoneage.so`, `.sabex`, ADRN/Real/SPR, palette, or patch payloads match the RO0000 target. No content from it is admitted to reconstruction data.


## 2026-10-03 public repository resource recheck

The following public client/source repositories were checked for real client resource payloads:

- `BismarckDD/Stoneage` — source tree contains client code but no `.sabex`, ADRN/Real/SPR, or SAP client payloads.
- `pioneers-g/StoneAgeClient` — source documentation lists the original client data as required external inputs; the checked tree contains no corresponding payloads.
- `alrightlook/StoneAgeMobileApp` — source tree contains code and demo assets, but no target `.sabex`, ADRN/Real/SPR, or SAP payloads.
- `flowerjunho/stoneage-light` — contains rendered pet/ride and other web image assets, but no matching client binary resource set. These are variant/visual-reference candidates only; no target-version identity or reuse provenance is established.

This is a bounded check of the named repositories, not a claim that no such files exist anywhere on the public internet. None of these sources closes the RO0000 production-byte gap. Do not substitute code, rendered web images, or unrelated-version client binaries for target resource payloads.
