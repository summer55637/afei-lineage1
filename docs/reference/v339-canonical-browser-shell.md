# V3.39 Canonical Browser Shell

更新日期：2026-09-30

V3.39 建立唯一 `index.html` canonical browser shell。

## Scope

這一版不是完整 playable game。Shell 只負責載入已閉合的 runtime modules，顯示 source/runtime 狀態，並提供 Lv1 new-player NPC probe。

## Entry policy

目前 repository 的 HTML 文件數固定為 1：`index.html`。

CI 會掃描 repository；若再出現第二個 HTML entry，regression 直接失敗，並檢查 `game.html` / `game-live.html` / `play.html` 沒有被重新引入。

## Probe

Strict：`changeevent` 仍因 pinned functionSet 缺失而停在 module resolution，canonical state 不 mutation。

Compatibility：只有 `compatibilityMode=true + allowExternalCompatibilityAliases=true` 才允許 external `changeevent → ExChangeMan` corroboration，並跑既有 V3.38 browser state controller。

這條 probe 使用 1006 的 `新手接待員` 與 Lv1 player context；reward、save、event semantics 都沿用既有 source-backed runtime。

下一步才是把 world/map presentation 接入這個唯一 shell，不再建立第二個 HTML。
