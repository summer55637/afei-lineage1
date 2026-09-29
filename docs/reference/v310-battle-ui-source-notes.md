# V3.10 battle UI source notes

這份文件只固定「畫面配置／操作區域」的外部參考，不改戰鬥數值或 RNG。

## 經典介面共識

公開的《石器時代》介面資料描述：戰鬥採回合制；敵方位於畫面左上，我方位於右下；右上是動作／指令視窗；玩家在每回合等待指令後才開始執行。戰鬥操作列包含攻擊、精靈／魔法、捕捉、求救，以及防禦、道具、更換寵物、逃跑等功能。

參考：
- https://www.shiqim.com/shiqi243.html
- https://forum.gamer.com.tw/G2.php?bsn=1571&snA=4326
- https://games.sina.com.cn/zhqu/sta/xsxl/yxcz.shtml

## 本版實作邊界

- 只新增戰鬥場景 presentation layer。
- 不改既有 battle order、傷害、CaptureCheck、RNG。
- 不虛構原版 sprite；目前使用資料化單位卡片呈現。
- GMQUE／抓寵活動永久停用，不在這條 UI 主線中恢復。
