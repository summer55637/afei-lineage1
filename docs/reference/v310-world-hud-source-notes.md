# V3.10 world HUD source notes

本輪建立 world-scene presentation shell，對齊 video-001 對世界／主畫面的版面要求，但不宣稱已還原原版地圖素材或精確地圖幾何。

- 地圖名稱：`currentMap()`。
- Encounter 資訊：`currentEncounter(map)`。
- 玩家／寵物：現有 Player 與 `activePet()` runtime。
- 模式：現有 `state.auto` 與當前 `enemy` 狀態。
- 系統訊息：現有 `state.log[0]`。
- 場景中的樹、岩石、水、道路與角色標記目前是 presentation-only CSS 重製，沒有偽造 source map data。

下一階段再接真正的 map tile / NPC / world-coordinate source；目前不跨 source 猜測地圖布局。
