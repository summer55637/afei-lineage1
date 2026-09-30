# V3.34 New-player Branch Matrix Regression

更新日期：2026-09-30

V3.34 不新增 gameplay runtime，而是把四段 xinshoujd.arg branch 全部用同一條 source-backed execution + Save Envelope 做矩陣驗證。

## Boundaries

- Lv 1–99 → branch 0 → Item 20145/2849/20228/18537 + Pet 341 + EndSetFlg 366
- Lv 100–139 → branch 1 → Item 20866/2912/2909/2911 + Pet 2057 + EndSetFlg 365
- Lv 140–149 → branch 2 → Item 20867/19567/19568/19569 + Pet 1645 + EndSetFlg 364
- Lv 150 → branch 3 → Item 20615/20616/20617/20635 + Pets 1479/2547 + EndSetFlg 363

每段都驗證 Save Envelope reload parity，以及 Charm:1 在 EventNo:-1 下維持 no-op。

## Why this matters

之前 branch 0 才有完整 first-route integration regression。V3.34 把 Lv=99/100、139/140、149/150 的 branch boundaries 全部鎖住。

V3.34 仍不宣稱 changeevent NPC module 已註冊；正式 browser instantiation 仍受 V3.29/V3.33 module audit gate 控制。
