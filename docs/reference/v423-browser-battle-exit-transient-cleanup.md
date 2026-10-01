# V4.23 Browser Battle Exit Transient Cleanup Contract

固定 C：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，`BATTLE_Exit()`。

V4.23 不新增 gameplay 效果，而是把最後 Exit 的 transient cleanup 明確固定成 contract，防止後續開發把 Server WorkInt / network output 誤寫進 Persistent State。

Player 退出時 fixed-C 會把 Battle Mode 設為 `FINAL`、Battle Index 設為 `-1`，清除 battle bad status，重新 compliance，並送出 HP/MP 等狀態。Pet 則在非 Mail Pet 前提下設為 `NONE`、Battle Index `-1`，清除 battle bad status 並重新 compliance。

Ride Pet 與 BecomePig 另外有條件分支：
- Ride：`CHAR_WORKPETFALL` 會觸發 `CHAR_RIDEPET` 暫態重置；
- BecomePig：啟用 `_PETSKILL_BECOMEPIG` 時，Player 最終離場會恢復 base image 並 compliance。

目前 canonical Persistent State 沒有足夠的 source-closed ride / image / BecomePig lifecycle 欄位，因此 V4.23 **不新增這些欄位，也不虛構 network send**。成功的 V4.21 final-exit commit 後直接清除 memory-held Battle Context，等價承載這些 transient cleanup 的生命週期終點。

這是一個 teardown contract，不是新的戰鬥規則。
