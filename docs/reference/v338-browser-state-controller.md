# V3.38 Browser State Controller

更新日期：2026-09-30

V3.38 將 V3.37 runtime config 真正接成 browser-side 唯一 state controller。

## Contract

`UI action → Browser State Controller → NPC Dispatch → Interaction Gate → Audited/Compatibility Module Registry → First-route Save → canonical state`

目前 controller 只正式支援 `NPC_TALK`；不直接操作 DOM，也不建立第二套 persistent state。

## Mode separation

strict 是預設：`changeevent` 維持 module-resolution blocked，不會 mutation。

compatibility 必須同時開啟 `compatibilityMode=true` 與 `allowExternalCompatibilityAliases=true`，才會使用 V3.35 external corroboration 的 `changeevent → ExChangeMan` alias。

## Four-hometown regression

1006、2006、3006、4006 四個 `xinshou` changeevent NPC 都使用相同 `xinshoujd.arg`，玩家站在 NPC 前方一格即可通過 fixed-C interaction gate。

每個 compatibility execution 都驗證：4 Item、Enemy 341 → TempNo 274、EndSetFlg 366、Charm 不變、Save Envelope revision 1，以及 reload parity。

## Boundary

這仍不是正式 pinned `changeevent` C module。compatibility alias 只是外部 corroboration 的 opt-in browser mode；production strict mode 不會把 alias 寫回 pinned source registry。

下一步才是把這個 controller 接到唯一 canonical playable entry 的 UI shell，並維持所有其他舊 HTML 入口不再擴張。
