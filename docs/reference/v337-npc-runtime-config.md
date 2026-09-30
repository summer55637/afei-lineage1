# V3.37 NPC Runtime Configuration

更新日期：2026-09-30

V3.37 把 strict / compatibility 行為收成單一 runtime config，不讓 browser 各入口自行決定 alias policy。

預設：

`compatibilityMode=false`
`allowExternalCompatibilityAliases=false`

只有兩個都為 true，才允許 V3.35 的 external `changeevent → ExChangeMan` compatibility alias。

這個 config 只影響 module registry options；它不修改 pinned source audit，也不把 alias 寫入 canonical functionSet。

下一步 browser controller 應只讀這份 config，再把同一設定送入 V3.33 audited module registry。
