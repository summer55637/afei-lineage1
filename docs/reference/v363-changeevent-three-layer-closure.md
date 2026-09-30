# V3.63 ChangeEvent three-layer source closure（superseded）

更新日期：2026-09-30

V3.63 的三層 audit 方法是正確方向，但「pinned source 沒有 changeevent template」這個結論不正確。V3.63 CI 在實際 checkout pinned fixed-C source 時找到：

gmsv/data/npc/jaruga/event/event.template

其中明確包含：

templatename=changeevent
functionset=ExChangeMan

因此 V3.63 的 source-proven-non-instantiable-in-pinned-build 結論已由 V3.64 取代。

V3.64 將 create parser → template registry → ExChangeMan module 三層正式接通，並更新 downstream reachability、dispatch、Browser State Controller regressions。

本文件保留作歷史 traceability；canonical reference 改為 docs/reference/v364-changeevent-source-resolution.md。
