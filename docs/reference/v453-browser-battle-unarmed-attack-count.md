# V4.53 Browser Battle Unarmed Player AttackCount

更新日期：2026-10-03

Pinned fixed-C source：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66ca

本版把固定 C 的 BATTLE_GetAttackCount()「無有效 CHAR_ARM」分支接入完整 Browser round：

1. PLAYER level < 10：attack_max=1，不消耗 AttackCount RNG。
2. PLAYER level >= 10：先消耗 RAND(1,1000)。
3. luck*5 超過 25 時 clamp 25；不額外建立負值下限。
4. 第一次 roll <= 10 + luckWork：再消耗 RAND(5,10)，該值成為 attack_max。
5. 否則 <= 30 + luckWork 為 3 擊，<= 70 + luckWork 為 2 擊，其餘 1 擊。
6. non-player 或 PLAYER level < 10 的無裝備 fallback 為 1 擊、0 顆額外 RNG。

空手玩家的 attack_max 不會套用 FIST 的 gDamageDiv 分傷規則，因此每一擊維持完整普通攻擊傷害。

Round driver 現在可透過 attackCountFallbackRollByBid 與 attackCountFallbackAttackRollByBid 提供固定 C 所需的 replay RNG；缺少必要 RNG 時 fail-closed，不自行猜值。

Regression：
- tools/check_v453_browser_battle_unarmed_attack_count.mjs
- tools/check_v453_browser_battle_unarmed_attack_count_controller.mjs
- .github/workflows/check-v453-browser-battle-unarmed-attack-count.yml

Evidence boundary：
本版只關閉 unarmed Player AttackCount lifecycle 與其 round integration；完整裝備 runtime、特殊 multi-hit skill、Ride Pet、Battle Finish → Profit → Persistent settlement 仍分開處理。