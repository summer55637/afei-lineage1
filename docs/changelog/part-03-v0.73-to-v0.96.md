## V0.73 BOW DuckCheck / throw Guardian

V0.73 繼續追 V0.72 weapon command 之後，補兩個原 C 會直接改變實戰結果的遠距武器分支。

來源仍固定：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle.c`

### BATTLE_DuckCheck 的 BOW 重複 +20

fixed ref 的 `BATTLE_DuckCheck()` 在同一函式裡實際存在兩段：

```c
if( gWeponType == ITEM_BOW ){
    per += 20;
}
```

第一段位於酒醉修正後，第二段位於 NoGuard 修正後。

因此原版真正順序是：

1. DEX / Luck 算基礎回避。
2. `gBattleDuckModyfy`。
3. 酒醉攻擊者：`RAND(20,30)`。
4. BOW：`+20`。
5. NoGuard 防守者的 duck bonus。
6. BOW：再 `+20`。
7. `×100`。
8. 最後套 `KAWASHI_MAX_RATE = 75%` 上限。

也就是弓攻擊會讓守方回避率在 cap 前額外 **+40 個百分點**。

這是 fixed ref 的真實重複程式，不把它當筆誤修掉。

V0.73 新增：

`sourceBattleDuckTotal()`

並讓：

- 一般 `resolveNormalAttack()`
- Enemy Guardian 前置 DuckCheck

都走同一個來源順序。

### 投射武器不能被 Guardian／忠犬代擋

原 `BATTLE_GuardianCheck()` 在確認 Guardian 有效後，還會再檢查攻擊者：

`BATTLE_IsThrowWepon(CHAR_ARM)`

若攻擊者使用：

- BOW
- BOOMERANG
- BOUNDTHROW
- BREAKTHROW

直接：

`return -1`

也就是遠距攻擊不會被 Guardian 轉移。

單機目前 Player side 沒有獨立 Guardian 站位，但 Enemy side 的忠犬／Guardian 已存在；特別是混亂狀態會使 Enemy 可能攻擊同側 Enemy，因此這個原版限制仍然是可達邏輯。

V0.73 的 `resolveAttackToEnemyWithGuardian()` 現在會在：

`attacker.throwWeapon === true`

時完全跳過 `enemyGuardianFor()`。

### 與 V0.71 / V0.72 的關係

目前四種遠距武器已同時保留：

- V0.71：禁止近身 Counter
- V0.72：正式 weapon command / AttackNum / target list
- V0.73：BOW 原版雙重回避懲罰
- V0.73：遠距攻擊禁止 Guardian 代擋

其中 BOW 目前來源行為為：

- Item 400：1～3 發
- Item 2498：3～5 發
- `aBowW[50]` 決定候選 slot
- 每次實際命中前的 DuckCheck 都有 BOW +40
- Critical flag 仍可出現
- Critical 不取得一般武器的額外防禦補傷
- 不可觸發近身 Counter
- 不可被 Guardian 代擋

### V0.73 回歸

確認：

- `game.js` JavaScript 語法：PASS
- fixed ref `BATTLE_DuckCheck()` 內 BOW `per += 20`：兩次
- web runtime：同樣兩次各 +2000 raw duck
- 最終仍 clamp 1～7500
- Guardian：`throwWeapon=true` 時不再轉移目標
- V0.72 BOW / BOOMERANG / BOUNDTHROW / BREAKTHROW handlers 保留
- schema：維持 21

V0.73 後下一個已確認的大缺口是原 `EntrySort() -> ComboCheck()` 的**合擊生命週期**：

- Enemy 普通攻擊起始機率 20%
- 非 Enemy 起始機率 50%
- 必須是排序後相鄰、同側、同目標、可行動的普通攻擊者
- BOW / BOOMERANG / BOUNDTHROW / BREAKTHROW 全部不得進合擊
- 合擊走 `BATTLE_Combo()`，會跳過普通 DuckCheck，且不走一般 Counter loop

這塊牽涉目前 Player / Pet / Enemy 三種 command 在排序後的合併，所以留作下一層，不用普通多段攻擊硬冒充。



## V0.74 EntrySort / ComboCheck / BATTLE_Combo

V0.74 從 V0.73 的 weapon command 邊界往後，正式接回原 battle turn 在排序後立即執行的合擊生命週期。

來源固定：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/include/version.h`

### 原呼叫順序

原 battle turn：

```text
EntrySort()
→ ComboCheck()
→ 逐 Entry：StatusSeq / CanMove / command execution
```

因此合擊分組使用的是**排序完成後、但該角色本回合 StatusSeq 尚未執行前**的 command / target 狀態。

V0.74 的 `normalBattleOrder()` 現在同樣：

1. 建立 Player / Active Pet / Enemy entry。
2. 依原 `BATTLE_DexCalc` 等價 dex 排序。
3. 呼叫 `sourceComboCheck()`。
4. 才開始逐角色執行 StatusSeq 與 action。

### ComboCheck 起始機率

原 `ComboCheck()`：

- Enemy：`per = 20`
- 非 Enemy：`per = 50`

目前單機沒有 Player/Pet 的正式裝備 argument `合击...`，因此 `_ITEM_ADDCOMBO` 的裝備額外機率不可達，不自行猜值。

起始條件必須同時：

- command == `BATTLE_COM_ATTACK`
- 非投射武器
- 存活且可行動
- 有有效目標
- `RAND(1,100) <= per`

### 連續成員條件

一旦某個排序 Entry 成為 starter，後面的**相鄰 Entry**只有同時符合：

- command 仍是普通 ATTACK
- 同一個 `CHAR_WORKBATTLECOM2` 目標
- 同一 side
- 非投射武器
- 可行動

才加入同一 ComboId。

加入後不再重新擲 20% / 50%。

任一條件不符會中斷目前鏈；該不相容 Entry 若自身符合 starter 條件，仍可以再擲一次並成為下一組起點。

### 投射武器完全排除

`ComboCheck()` 會先用：

`BATTLE_IsThrowWepon(CHAR_ARM)`

標記：

- BOW
- BOOMERANG
- BOUNDTHROW
- BREAKTHROW

四種皆：

`armtype = 1`

而 starter / member 都要求：

`armtype != 1`

所以 V0.72 / V0.73 接好的遠距武器不會錯誤加入合擊。

### Enemy skill 與 COM_ATTACK 邊界

fixed ref 的 `pet_skill.c` 搜描確認，明確寫入 `BATTLE_COM_ATTACK` 的 PetSkill 路徑有：

- `PETSKILL_NormalAttack`
- `PETSKILL_Explode` 在非 PvP 時退回普通 ATTACK

但 fixed ref `version.h`：

```c
//#define _PETSKILL_EXPLODE
```

明確是關閉狀態。

因此此固定 build 的目前 Enemy 可達範圍，`enemyAction === 'attack'` 可精確對應原 `BATTLE_COM_ATTACK`；不把其他直接傷害 Skill 擅自算成普通合擊成員。

### Player command 不混淆

V0.74 額外把共用排序的 Player command 明確拆開：

- attackTurn → `playerCommand:'attack'`
- guardTurn → `playerCommand:'guard'`
- captureTurn → `playerCommand:'capture'`

原因是原 `ComboCheck()` 僅接受：

`BATTLE_COM_ATTACK`

所以捕獲與防禦不能因共用 `normalBattleOrder()` 而被誤算成 Player 50% 合擊 starter。

Pet 仍依目前放置版設計在三種回合中自動普通攻擊；若 Player 本人不是 ATTACK，Player 會自然切斷 Player/Pet 的同側合擊鏈。

### ComboCheck2 / 失效後退回普通攻擊

原執行到 `BATTLE_COM_COMBO` 時還會呼叫：

`ComboCheck2()`

若目前 Entry 後面已沒有同 ComboId 且仍可行動的成員，就把它改回普通 ATTACK。

V0.74 的：

- `sourceComboHasLater()`
- `sourceComboConsumed`

保留這個語意。

例如兩人合擊中第一人被異常狀態阻止：

- 第一人不動
- 第二人已沒有後續有效 combo member
- 第二人改走自己的普通 ATTACK

若原本三人合擊第一人失效，而第二、第三仍有效：

- 第二、第三仍可繼續成為實際合擊。

### BATTLE_Combo

原 `BATTLE_Combo()` 對每一名有效 member 呼叫：

`BATTLE_AttackSeq(..., BATTLE_COM_COMBO)`

這帶來幾個和普通攻擊不同的關鍵差異：

1. `opt == BATTLE_COM_COMBO` → **跳過 DuckCheck**。
2. `Guardian = -2` → **不執行 GuardianCheck**。
3. Critical 判定仍執行。
4. Guard damage adjust 仍執行。
5. 每名 member 的 AttackSeq 若 damage <= 0，合擊層再強制成 1。
6. 一般傷害先累積為 `AllDamage`。
7. 最後一名 member 才以 `BATTLE_DamageSub2` 一次扣除累積傷害。
8. 主 battle.c 的一般 Counter loop 不會執行。

V0.74 的 `sourcePerformCombo()` 因此：

- 使用 `disableDodge:true`
- 不跑 Guardian
- 每段最低 1
- 先累計
- 最後一次寫入 HP
- 不接 `resolvePlayerEnemyCounterChain` / `resolvePetEnemyCounterChain`

### 後續 member 的 StatusSeq

原 combo branch 在收後續 member 時會先：

- `BATTLE_StatusSeq()`
- `BATTLE_MagicStatusSeq()`
- 再檢查 `BATTLE_CanMoveCheck()` / HP

V0.74 同樣在 `sourcePerformCombo()` 對後續成員呼叫目前等價的 `processBattleStatusTurn()`。

若後續 member 因異常不能動，就跳過該 member。

若 Confusion 在這個 StatusSeq 中把其 command / target 改成亂打，來源 combo branch 並沒有重新讀新 target，而只是確認它是否仍可移動，之後仍使用既定 combo `defNo`；V0.74 保留這個來源流程，不把後續 member 額外拆成一次混亂攻擊。

### V0.74 回歸

確認：

- `game.js` JavaScript 語法：PASS
- Player ATTACK + Active Pet 同目標：starter roll <= 50 可成組
- Player starter roll 51：不成組
- CAPTURE：Player 不可當 combo starter/member
- GUARD：Player 不可當 combo starter/member
- Enemy 同目標普通攻擊：starter roll <= 20 可成組
- Enemy starter roll 21：不成組
- Throw weapon：斷鏈且自身不可成為 starter
- 不同 target：斷鏈；後方相容成員可重新建立新 group
- `PETSKILL_Explode`：fixed build compile flag 關閉，不納入可達 command
- V0.72 / V0.73 遠距規則仍保留
- schema：仍為 **21**

V0.74 至此把普通攻擊從「每個 Entry 各自執行」推進到原 C 的排序後合擊編組與合擊結算流程。



## V0.75 ranged PetSkill / shared weapon loop

V0.75 不是再新增一種武器，而是修正「PetSkill 已經進原 battle.c 共用物理攻擊區後，仍必須服從目前 CHAR_ARM」這一層。

來源固定：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`

### 為什麼 V0.72 還不夠

V0.72 已讓普通 ATTACK 正確使用：

- BOW / `aBowW`
- BOOMERANG
- BOUNDTHROW
- BREAKTHROW
- `BATTLE_GetAttackCount()`

但原 C 有一批 PetSkill 並不是自己完成傷害，而是先設定：

- command
- attack / defense modifier
- status / attack count

最後仍落入 battle.c 的同一個 weapon attack loop。

因此同一個 Skill 若 Enemy 手上是弓，不能被 web 簡化成「固定打一個目標一次」。

### fixed data 的實際可達案例

重新掃 `stoneage_enemy_ai.json` 的 STYLE 與正權重 Skill，確認這不是理論分支。

#### Enemy 961

- `STYLE=4`
- STYLE 4 → Item 400 小的弓箭
- Item 400 → BOW
- AttackNum = **1～3**

正權重：

- 61 猛毒攻擊
- 80 石化攻擊
- 90 混亂攻擊
- 100 酒醉攻擊
- 110 催眠攻擊

五個全部是：

`PETSKILL_StatusChange`

所以原服確實存在：

**狀態攻擊 + 弓 1～3 發 + aBowW 多目標**

的可達組合。

#### Enemy 2332

- `STYLE=4`
- Item 400 BOW

正權重包含：

- 13 T五段攻擊 → `PETSKILL_ContinuationAttack`

原 `BATTLE_COM_S_RENZOKU` 會把：

```text
attack_max = 技能段數
gDamageDiv = 技能段數
```

之後仍進同一 BOW target-list loop。

因此五段攻擊拿弓時不是對同一人固定打五次，而是：

- `attack_max = 5`
- 每次物理傷害再 /5
- 候選目標由 `aBowW` 決定
- 空格／死人仍不消耗實際 attack_count
- target list 用完即可提前結束

### StatusChange × BOW

原順序：

1. 每回合初始化 `gBattleStausChange`。
2. 若武器是 BREAKTHROW，先暫設 PARALYSIS。
3. command 是 `BATTLE_COM_S_STATUSCHANGE` 時：
   - 再把 `gBattleStausChange` 改成技能自己的 status
   - 寫入技能 turn
4. `BATTLE_TargetListSet()`
5. 進共用 BOW attack loop
6. 每次真正 `BATTLE_Attack()` 造成 `damage > 0`：
   - 先 `BATTLE_DamageWakeUp()`
   - 再 `BATTLE_StatusAttackCheck()`
   - 成功才寫入本次技能異常

V0.75 現在同樣讓 StatusChange 在 BOW 時：

- 使用 Item 400 的 1～3 AttackNum
- 使用原 `aBowW[50]`
- 每一個實際命中的 slot 各自做狀態判定
- 被睡眠中的目標會先因正傷害醒來，再重新做本次狀態判定

不再把整個弓狀態技硬縮成單一目標一擊。

### StatusChange × BREAKTHROW 的覆寫順序

這裡保留一個容易寫錯的來源細節。

battle.c 一開始：

`ITEM_BREAKTHROW -> gBattleStausChange = PARALYSIS`

但稍後：

`BATTLE_COM_S_STATUSCHANGE`

又會把同一個 global：

`gBattleStausChange`

覆寫成：

- 毒
- 石
- 亂
- 醉
- 眠
- 劇毒

因此若未來／其他 fixed data 出現：

**StatusChange + 投石**

它不是「技能異常 + 額外投石麻痺」兩種都判定。

實際只保留最後覆寫後的 **技能異常**。

V0.75 的 ranged StatusChange 因此會以：

`breakthrowStatus:false`

進共用投擲 loop，再由 StatusChange callback 套技能異常。

### ContinuationAttack × ranged weapon

原 `BATTLE_COM_S_RENZOKU`：

```c
attack_max = CHAR_GETWORKINT_LOW(...);
gDamageDiv = attack_max;
```

並不建立自己的傷害迴圈，而是繼續落入共用 weapon loop。

V0.75 的 ranged helper 現在支援：

- `attackMaxOverride`
- 共用 `attackOptions.damageDivisor`
- 每擊 callback
- BREAKTHROW status 是否啟用的來源控制

因此：

#### BOW + 連續攻擊

- attack_max = 技能段數
- 每段 / 技能段數
- 走 aBowW
- 不使用武器本身 1～3 的 AttackNum，因 RENZOKU 已在 battle.c 後面覆寫 attack_max

#### BOUNDTHROW + 連續攻擊

- attack_max = 技能段數
- 同一合法目標重複投擲
- 目標倒下後才依原非 BOW TargetAdjust 語意換下一個目標

#### BREAKTHROW + 連續攻擊

與 BOUNDTHROW 相同，但原：

- RENZOKU 沒有覆寫 `gBattleStausChange`
- 所以先前 BREAKTHROW 設定的 PARALYSIS 仍保留

故每次正傷害都可各自進原：

`20 - paralysis resistance`

麻痺檢定。

fixed data 也確實有可達案例：

- Enemy 11003
- `STYLE=6`
- STYLE 6 → Item 700 小的石
- Type 19 BREAKTHROW
- 正權重反覆使用 16／17：
  - T八段攻擊
  - T九段攻擊

也就是原資料中真的存在「投石 8／9 段、每一段皆可觸發投石麻痺」的路徑。

### BOOMERANG 的特殊邊界

BOOMERANG 不是「只要手上拿回力標就一定橫掃」。

battle.c 前置轉換只在：

`COM == BATTLE_COM_ATTACK`

時才：

`ATTACK -> BATTLE_COM_BOOMERANG`

所以：

- 普通 ATTACK + 回力標 → 30% 橫掃
- StatusChange + 回力標 → 不轉換，仍單一目標
- ContinuationAttack + 回力標 → 不轉換，仍對單一目標 N 段

V0.75 保留這個差異，沒有因為 `weaponType===BOOMERANG` 就把所有特殊物理技誤改成橫掃。

fixed data 同樣有：

- Enemy 2329 / 2335 / 10001 / 10004 / 10007 / 10010
- `STYLE=5`
- 回力標
- 其中多隻會使用 ContinuationAttack / StatusChange / PowerBalance 等

因此這個 ATTACK-only boomerang 轉換也是可達規則，不是純理論保護。

### V0.74 校正：Combo wake timing

在 V0.75 開始前也重新逐行對過原 `BATTLE_Combo()`。

來源其實是：

- 每一 member 先算自己的 damage
- 正常合擊傷害先累加
- 最後一 member 才用 `BATTLE_DamageSub2` 一次扣總 HP
- **但每一 member 只要自己的 damage > 0，就立即呼叫 `BATTLE_DamageWakeUp()`**

因此 V0.74 已補一筆精準校正：

- 不再等總傷害扣血後才醒
- 每一段正傷害算出後就先解除睡眠
- 總 HP 傷害仍最後一次寫入

這不改 V0.74 的合擊傷害模型，只修正 source timing。

### V0.75 回歸

目前確認：

- `game.js` JavaScript 語法：PASS
- Enemy 961：
  - STYLE 4
  - 正權重 StatusChange 61/80/90/100/110
  - 已走 BOW shared weapon loop
- Enemy 2332：
  - STYLE 4
  - Skill 13 五段攻擊
  - 已以 5 覆寫 attack_max 並使用 BOW target list
- Enemy 11003：
  - STYLE 6
  - Skill 16/17 八／九段攻擊
  - STYLE 6 → Item 700 BREAKTHROW
  - 已保留逐擊麻痺
- STYLE mapping 再驗：
  - 4 → Item 400 BOW
  - 5 → Item 500 BOOMERANG
  - 6 → Item 700 BREAKTHROW
  - 7 → Item 600 BOUNDTHROW
- Item 400 AttackNum：1～3
- Item 700 AttackNum：1～1
- Item 600 AttackNum：1～1
- StatusChange 的 BREAKTHROW 預設麻痺：會被技能 status 覆寫
- ContinuationAttack 的 BREAKTHROW 麻痺：保留
- schema：仍為 **21**

V0.75 至此把「武器只影響普通 ATTACK」再往前推成原 C 的正確模型：**任何實際落入 shared weapon loop 的 command，都要服從該回合的武器 target / attack-count 規則；但 BOOMERANG 的特殊 command 轉換仍只屬於普通 ATTACK。**



## V0.76 DRUNK lifecycle source bug

V0.76 校正的是 fixed C 的酒醉實際生命週期，不採資料說明文字推測。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle_magic.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/char/char.c`

### 一般物理 StatusChange 的原 bug

`BATTLE_Attack()` 在酒醉命中成功後先做：

```c
CHAR_setWorkInt(defindex, StatusTbl[BATTLE_ST_DRUNK],
    gBattleStausTurn + 1);
```

緊接著原碼不是把 QUICK 減半，而是：

```c
CHAR_setWorkInt(defindex, CHAR_WORKDRUNK,
    CHAR_getWorkInt(defindex, CHAR_WORKDRUNK) / 2);
```

也就是 **把酒醉倒數本身除以 2**。

fixed ref 全域搜尋沒有另一條一般 DRUNK 命中時把 `CHAR_WORKQUICK` 除 2 的路徑。

所以 Skill 100：

`醉 turn 3 攻%-30`

在一般 `BATTLE_Attack()` 成功附加後實際是：

```text
turn 3
→ 先存 4
→ CHAR_WORKDRUNK = 4 / 2
→ 最終 stored turn = 2
```

V0.76 的 `sourceEnemyApplyStatusAttackHit()` 現在保留這個 bug。

### 酒醉期間 QUICK 不下降

`_CHAR_complianceParameter()` 每輪會：

```c
WORKQUICK = WORKFIXDEX
```

而且函式完全不讀 `CHAR_WORKDRUNK`。

`BATTLE_StatusSeq()` 的 `CHAR_WORKDRUNK` case 本身也沒有降低 QUICK。

因此 V0.75 以前 web 用「酒醉期間 QUICK /2」做對稱轉譯，雖然看起來合理，但不是這個 fixed build 的真實行為。

V0.76 改為：

- 酒醉 active 時 QUICK 維持原值
- 酒醉者攻擊時仍依 `BATTLE_DuckCheck()` 讓目標回避額外 `RAND(20,30)`
- 不再虛構敏捷減半

### 酒醉解除反而 QUICK ×2

原 `BATTLE_StatusSeq()` 在倒數減到 0 時：

```c
if(StatusTbl[i] == CHAR_WORKDRUNK){
    CHAR_setWorkInt(charaindex, CHAR_WORKQUICK,
        CHAR_getWorkInt(charaindex, CHAR_WORKQUICK) * 2);
}
```

也就是來源因前面的 bug 沒有真的把 QUICK 減半，卻仍執行「還原」：

**酒醉解除的該回合 QUICK 反而翻倍。**

下一個 battle turn 的：

`BATTLE_PreCommandSeq() -> CHAR_complianceParameter()`

會再把：

`WORKQUICK = FIXDEX`

所以這個 2× 不是永久能力增加，而是只存在於「酒醉剛解除的剩餘當回合」。

V0.76 新增：

`battleDrunkReleaseBoostKeys`

用途：

1. 每輪 `normalBattleOrder()` 開始時清空，等價下一輪 PreCommandSeq 重建 QUICK。
2. `processBattleStatusTurn()` 若 DRUNK 倒數剛歸 0，把該角色加入 transient set。
3. 該回合後續 `battleDrunkQuick()` 對這個角色回傳 base QUICK ×2。
4. 下一輪自動清除。

排序本身發生在 StatusSeq 前，所以解除當次的 2× QUICK 不會倒灌改變已完成的 EntrySort；但會影響該次行動後續使用 WORKQUICK 的命中／回避／會心等計算，符合原流程。

### 魔法酒醉不能套物理 /2 bug

`BATTLE_MultiStatusChange()` 是另一條獨立路徑。

成功時只做：

```c
CHAR_setWorkInt(toindex, StatusTbl[status], turn);
```

沒有：

`CHAR_WORKDRUNK / 2`

因此 Combined 的酒醉精靈 magic 179：

- 原 magic turn = 5
- web 仍用 `battleStatusApplyRaw(..., 5)`
- 不套一般物理 `(turn+1)/2`

但它倒數歸零時仍經同一個 `BATTLE_StatusSeq()`，因此同樣會出現解除當回合 QUICK ×2 的來源 bug。

### fixed data 可達性

這不是只為理論相容性。

正權重 Enemy AI 中：

- Skill 100「泥醉攻擊」
- `PETSKILL_StatusChange`
- option：`醉 turn 3 攻%-30`
- 共有 **22 個 Enemy** 正權重引用
- 包含 V0.75 已驗證的 Enemy 961：
  - STYLE 4
  - BOW
  - 酒醉攻擊可進 aBowW 多發流程

所以 V0.76 會直接改變目前可實際遇到的戰鬥結果。

### V0.76 回歸

確認：

- `game.js` JavaScript 語法：PASS
- Skill 100 fixed option：`醉 turn 3 攻%-30`
- 物理酒醉 stored turn：`(3+1)/2 = 2`
- magic 179 stored turn：5
- 酒醉 active：不再 QUICK /2
- 酒醉解除：當回合 transient QUICK ×2
- 下一輪 `normalBattleOrder()` 清 transient boost
- `BATTLE_DuckCheck` 的 DRUNK +20～30 回避懲罰保留
- V0.75 ranged StatusChange / Continuation weapon flow 保留
- save schema：仍為 **21**



## V0.77 WEAKEN / BARRIER PreCommand lifecycle

V0.77 校正兩個已可達、但倒數位置不同於一般 StatusTbl 的狀態：

- WEAKEN / 虛弱
- BARRIER / 魔障

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle_magic.c`
- `gmsv/src/char/char.c`
- `gmsv/src/item/item.c`

### 為何不能用一般 StatusSeq 倒數

原 `BATTLE_StatusSeq()` 會先：

```c
cnt = StatusTbl[i];
StatusTbl[i] = --cnt;
```

但 WEAKEN / BARRIER 立刻有特殊保護：

```c
if (CHAR_WORKWEAKEN > 0)
    StatusTbl[i] = cnt + 1;

if (CHAR_WORKBARRIER > 0)
    StatusTbl[i] = cnt + 1;
```

因此只要 decrement 後仍 >0，StatusSeq 的這次 -1 會被加回去。

真正的持續時間消耗發生在每輪：

`BATTLE_PreCommandSeq() -> CHAR_complianceParameter() -> Other_DefcharWorkInt()`

且發生在 `EntrySort()` 之前。

### WEAKEN

原 `BATTLE_MultiParamChangeTurn()` 成功後：

```c
CHAR_WORKWEAKEN = turn + 1;
```

每次下一輪 complianceParameter：

```c
if (CHAR_WORKWEAKEN > 0) {
    FIXSTR   *= 0.8;
    FIXTOUGH *= 0.8;
    FIXDEX   *= 0.8;
    CHAR_WORKWEAKEN--;
}
```

所以：

- 技能命中同一輪，不會立刻把攻／防／敏乘 0.8。
- 下一次 PreCommandSeq 才建立被虛弱的本輪 FIX 快照。
- QUICK 在 EntrySort 前已被降為 80%，所以會影響出手排序。
- FIXTOUGH 同樣是 80%，不只是顯示用 defense。
- 每輪都先從基礎能力重建 FIX，再乘 0.8，因此不會發生 0.8 × 0.8 × 0.8 的永久累乘。

V0.77 新增 `battleWeakenRoundKeys`：

- 每個 PreCommandSeq 重新建立。
- 只代表「本輪 FIX 已被 WEAKEN 乘過 0.8」。
- 即使 WEAKEN 在該角色行動時剛好歸零，本輪已經生成的 0.8 FIX 仍保留到下一輪，符合原 C。

### BARRIER

原 `BATTLE_S_Barrier()` 成功：

```c
CHAR_WORKBARRIER = turn + 1;
```

真正 -1 同樣位於 complianceParameter：

```c
if (CHAR_WORKBARRIER > 0)
    CHAR_WORKBARRIER--;
```

而 `BATTLE_CanMoveCheck()` 只要 BARRIER >0 就禁止行動。

因此 BARRIER 的實際時序會保留施法先後差異：

- 若施法者先出手、目標本輪尚未行動：
  - 目標同輪就會被 BARRIER 擋住。
  - 這一輪沒有再經 PreCommand，因此 stored `turn+1` 正好保留。
- 若目標已先行動：
  - 第一次真正消耗發生在下一輪 PreCommandSeq。

例如 `turn 1`：

- stored = 2
- 下一輪 PreCommand → 1
- 該輪行動開始時仍被擋
- StatusSeq 將 1 減成 0 並解除

V0.77 不再像一般異常那樣每次角色行動直接扣一次 BARRIER。

### StatusSeq 的最後一格

WEAKEN / BARRIER 若進 StatusSeq 時：

- turns >1：來源 `--cnt` 後仍 >0，因此又寫回 `cnt+1`，淨值不變。
- turns ==1：來源先降成 0，特殊保護條件已不成立，因此真正解除。

web 現在同樣：

- >1：保持不變
- ==1：在該次行動解除
- 若 PreCommand 已先把 1 扣成 0，則直接在 PreCommand 階段視為失效

### 可達 fixed data

WEAKEN：

- 575 虛弱：`虚 turn 3 成 50`
- 576 全體虛弱：`虚 turn 3 成 50`
- 正權重 AI 引用共 8 個 slot reference

BARRIER：

- 579 魔障：`障 turn 1 成 50`
- 594 究極魔障：`障 turn 3 成 50`
- 正權重 AI 引用共 14 個 slot reference

所以這不是未使用相容碼，而是目前遊戲會實際抽到的 Enemy 行為。

### V0.77 回歸

確認：

- `game.js` JavaScript 語法：PASS
- WEAKEN 命中同輪：不立即 0.8
- WEAKEN turn 3：接下來三個 PreCommand round 套 0.8
- WEAKEN round snapshot：Attack / Defense / Quick / FixedTough 均依來源縮減
- Pet FixedTough ×0.8：整數截斷
- BARRIER turn 1 / turn 3：依 PreCommand 扣回合
- 施法者比目標快時：目標同輪可立即被 BARRIER 阻止
- 施法者比目標慢時：不會倒扣已經結束的目標行動
- StatusSeq 不會對 >1 的 WEAKEN / BARRIER 再多扣一次
- V0.76 DRUNK lifecycle 保留
- save schema：仍為 **21**



## V0.78 StatusChange stat modifiers / PreCommand FIX ordering

V0.78 修正的是兩個彼此相連、而且 fixed data 已大量可達的本輪能力值時序：

1. `PETSKILL_StatusChange()` 的 `攻%` / `防%` 不是文字說明，而是真的在 AI 決定技能時改寫本回合 WORK 能力。
2. WEAKEN 必須先在 `BATTLE_PreCommandSeq() -> complianceParameter()` 形成 0.8 FIX 快照，再讓後續 PetSkill 以這個快照計算自己的能力修正。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/item/item.c`

### PETSKILL_StatusChange 的真實攻擊力修正

原 `PETSKILL_StatusChange()` 會解析 option：

```c
if ((pszP = strstr(pszOption, "攻%")) != NULL) {
    sscanf(pszP+3, "%f", &fPer);
    fPer = fPer / 100;
    strdef = CHAR_getWorkInt(charaindex, CHAR_WORKFIXSTR);
    strdef = (int)(strdef * fPer);
    CHAR_setWorkInt(charaindex, CHAR_WORKATTACKPOWER,
        CHAR_getWorkInt(charaindex, CHAR_WORKFIXSTR) + strdef);
}
```

所以這不是：

`最後傷害 × 0.7`

而是：

`WORKATTACKPOWER = FIXSTR + trunc(FIXSTR * pct / 100)`

之後才進 `BATTLE_DamageCalc()`。

因為原傷害公式對 attack / defense 是非線性的，這兩種做法不能互換。

### fixed data 的 7 種正權重 StatusChange

重新掃 `stoneage_petskill_runtime.json` 與 `stoneage_enemy_ai.json`：

- 60 毒攻擊：`毒 turn 3 攻%-30` — 31 個 Enemy
- 61 猛毒攻擊：`毒 turn 5 攻%-50` — 26 個 Enemy
- 80 石化攻擊：`石 turn 3 攻%-30` — 48 個 Enemy
- 90 混亂攻擊：`亂 turn 3 攻%-30` — 50 個 Enemy
- 100 泥醉攻擊：`醉 turn 3 攻%-30` — 22 個 Enemy
- 110 催眠攻擊：`眠 turn 3 攻%-30` — 34 個 Enemy
- 708 石化攻擊：`石 turn 9 攻%-30` — Enemy 5129 正權重使用

七種全部是目前實際可抽到的 AI 行為。

V0.78 的 `enemyPrepareRoundAction()` 現在會在 EntrySort 前依 source option 建立本輪：

- `roundAttack`
- 若來源 option 有 `防%`，也同樣建立 `roundDefense`

目前正權重七種 StatusChange 都只有攻擊修正，但保留來源的防禦 parser，未猜任何額外數值。

### WEAKEN 與 PetSkill 的正確先後

V0.77 已把 WEAKEN 真正倒數位置移回：

`PreCommandSeq -> complianceParameter -> Other_DefcharWorkInt`

V0.78 再補上更深一層的順序。

原 `Other_DefcharWorkInt()`：

1. 先重建 / 套裝備與既有 battle buff 的 FIXSTR / FIXTOUGH / FIXDEX。
2. 大地鎧甲等 FIX buff 先套用。
3. 若 `CHAR_WORKWEAKEN > 0`：
   - FIXSTR ×0.8
   - FIXTOUGH ×0.8
   - FIXDEX ×0.8
   - WEAKEN counter -1
4. 最後：
   - WORKATTACKPOWER = FIXSTR
   - WORKDEFENCEPOWER = FIXTOUGH
   - WORKQUICK = FIXDEX
5. 之後才執行 Enemy AI / `PETSKILL_*`，讓技能再基於這個 FIX 值覆寫本回合 WORK。

所以正確模型不是：

`Skill modifier -> 最後再 ×0.8`

而是：

`PreCommand WEAKEN ×0.8 -> C int truncation -> Skill modifier -> C int truncation`

兩者在很多整數值上會差 1。

### Enemy 本輪 FIX snapshot

V0.78 的 `enemyPrepareRoundAction()` 現在先建立：

- `sourceFixAttack`
- `sourceFixDefense`
- `sourceFixQuick`

順序：

1. 基礎 Enemy compliant stats
2. 大地鎧甲等已存在 FIX buff
3. WEAKEN 0.8
4. 各 PetSkill 自己的本輪 stat write

並讓：

- StatusChange
- BattleModel
- BattleTearDamage
- AttackCrazed
- SpeedyAttack
- BattleTimid
- 2BattleTimid
- Firekill
- Lighttakeed
- PowerBalance
- FallGround
- Guardian
- WildViolentAttack
- Regret

等會改本回合能力值的來源分支，都從同一份 PreCommand FIX snapshot 起算。

### Enemy battle view 不再二次套 WEAKEN

V0.77 以前 web 仍在 `enemyBattleView()` 最後再檢查 WEAKEN 並 ×0.8。

V0.78 改為：

- Enemy 的 WEAKEN 已經在 `enemyPrepareRoundAction()` 前置 snapshot 正確套過一次。
- `enemyBattleView()` 只讀已完成的 `roundAttack / roundDefense / roundQuick`。
- 不再二次 0.8。

Player / Active Pet 因目前沒有相同的 Enemy AI PetSkill stat-write 流程，仍由各自 battle view 使用 V0.77 的 round snapshot 語意。

### V0.78 回歸

確認：

- `game.js` JavaScript 語法：PASS
- 正權重 Skill ID：158
- 已執行 handler：134
- 原資料缺失：22
- 原 build 未註冊：2
- dispatcher gap：0
- StatusChange 正權重六種 option 全部可解析 `攻%`
- 猛毒：-50%
- 其餘五種：-30%
- WEAKEN 先於 Skill modifier
- Enemy battle view 不再二次 WEAKEN
- StatusChange 專用 branch：僅一條
- V0.77 WEAKEN / BARRIER lifecycle 保留
- V0.76 DRUNK lifecycle bug 保留
- V0.75 ranged StatusChange / Continuation weapon flow 保留
- V0.74 Combo lifecycle 保留
- V0.73 BOW DuckCheck / Guardian rules 保留
- save schema：仍為 **21**



## V0.79 Charge / EarthRound PreCommand lifecycle

V0.79 校正兩個 fixed data 已實際可達的跨回合 PetSkill：

- 30 突擊：`1 攻%+90`，62 個正權重 Enemy。
- 31 雙重突擊：`2 攻%+110`，23 個正權重 Enemy。
- 605 三重突擊：`3 攻%+150`，fixed AI 中實際有正權重引用。
- 120 地球一周：`攻%+90`，12 個正權重 Enemy。

固定來源仍為：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`
- `gmsv/src/battle/battle_event.c`
- `gmsv/src/battle/battle_ai.c`

### Charge 不是鎖定第一次出招時的攻擊力

`PETSKILL_ChargeAttack()` 第一回合只把：

- 蓄力回合數寫入 COM3 low。
- `攻%` 寫入 COM3 high。
- command 改成 `BATTLE_COM_S_CHARGE`。

真正釋放由 `BATTLE_Charge()` 處理：

```c
pow = CHAR_getWorkInt(attackindex, CHAR_WORKFIXSTR);
pow += pow * N * 0.01;
CHAR_setWorkInt(attackindex, CHAR_WORKATTACKPOWER,
    pow + CHAR_getWorkInt(attackindex, CHAR_WORKMODATTACK));
```

所以釋放傷害使用的是**釋放回合重新完成 complianceParameter 後的 FIXSTR**。

V0.79 的 `performEnemyChargeState()` 現在改用該回合已建立的 `unit.roundAttack` FIX snapshot，再依 +90% / +110% 做 C-style truncation。

目前 fixed 正權重 Enemy 可達系統沒有建立 `CHAR_WORKMODATTACK` 的來源；正權重 Combined 只有 21 / 61 / 139 / 159 / 169 / 179 / 189 / 230 / 240，AttackMagic 為 301～325、204、435，不會寫該 work-int。因此目前 runtime 的額外 MODATTACK 等價 0，不自行虛構欄位。

### Charge 持續回合

`BATTLE_IsCharge()` 對 `BATTLE_COM_S_CHARGE` 回傳 TRUE。

因此每輪 `BATTLE_AllCharaCWaitSet()` 不會把 command 清掉，Enemy AI 也會直接跳過重新選招。

N=1：

1. 第一次使用技能：BATTLE_Charge 把 low 1 -> 0，不攻擊。
2. 下一輪正常 PreCommand。
3. BATTLE_Charge 看到 low 0，改成 CHARGE_OK。
4. 同一輪落入 shared physical attack loop 釋放。

N=2 則再多一輪等待。

V0.79 保留此 1 / 2 回合等待語意。

### EarthRound0 是 PreCommand 的明確例外

`PETSKILL_EarthRound()` 第一回合：

- command = `BATTLE_COM_S_EARTHROUND1`
- COM3 = `攻%+90`

`BATTLE_EarthRoundHide()`：

- `CHAR_ISATTACKED = 0`
- command -> `BATTLE_COM_S_EARTHROUND0`

下一輪 `BATTLE_PreCommandSeq()` 在清 Guardian 後立刻：

```c
if (CHAR_getWorkInt(charaindex, CHAR_WORKBATTLECOM1)
    == BATTLE_COM_S_EARTHROUND0) continue;
```

因此該隱身角色這一輪不會執行：

- `CHAR_complianceParameter()`
- `BATTLE_TurnParam()`
- FIXSTR / FIXTOUGH / FIXDEX 重建
- WEAKEN / BARRIER 的 compliance 階段扣回合
- `BATTLE_AttReverse()` 的 FIX 屬性重建

V0.79 新增角色級：

- `sourceEnemySkipsPreCommandCompliance()`
- `sourcePreCommandKeySkipsCompliance()`
- `sourcePreCommandResetTransient()`

並讓 EARTHROUND0 保留上一輪：

- roundAttack / roundDefense / roundQuick
- WEAKEN 已形成的 FIX snapshot
- BARRIER counter
- 酒醉解除時來源 bug 留下的暫時 QUICK ×2
- FIX attribute snapshot

### WEAKEN 1 -> 0 後進入 EarthRound 的特殊結果

若 EarthRound 第一回合的 PreCommand：

- WEAKEN counter 原為 1
- 先把 FIXSTR / FIXTOUGH / FIXDEX ×0.8
- 再把 WEAKEN 1 -> 0
- 之後才選到 EarthRound

則角色進入 EARTHROUND0 時，status 已經沒有 WEAKEN，但**這一輪已建立的 0.8 FIX snapshot 仍存在**。

下一隱身輪因 PreCommand 被跳過，該 0.8 snapshot 繼續保留到現身攻擊。

V0.79 保留這個看似反直覺但由 fixed C 呼叫順序直接產生的行為。

### EarthRound 的 +90% 仍是最終傷害倍率

battle.c 對 EARTHROUND0：

```c
gBattleDamageModyfy =
    1.0 + 0.01 * CHAR_getWorkInt(charaindex, CHAR_WORKBATTLECOM3);
```

所以 Skill 120 的 `攻%+90` 在這裡不是改 WORKATTACKPOWER，而是：

`gBattleDamageModyfy = 1.9`

V0.79 保留現有 `damageMultiplier = 1.9`；本版只修正它進入這個倍率前應沿用哪一輪的 WORK/FIX snapshot。

### 混亂會中斷跨回合技能

`BATTLE_IsCharge()` 只因 command 仍為：

- CHARGE
- EARTHROUND1
- EARTHROUND0

才讓跨回合流程延續。

`BATTLE_StatusSeq()` 的 CONFUSION 若發作，會把 command 強制改成普通 ATTACK 並換亂數目標。

之後下一輪 `BATTLE_AllCharaCWaitSet()` 不再視為 charge，因此原技能鏈結束。

現版原本已有：

- 混亂時清 `chargeState`
- 混亂時清 `earthRoundState`
- EarthRound 重新現身

V0.79 回歸確認這條仍保留。

### V0.79 回歸

確認：

- `game.js` JavaScript 語法：PASS
- 正權重 Skill ID：158
- 已執行 handler：134
- 原資料缺失：22
- 原 build 未註冊：2
- dispatcher gap：0
- Charge 30：62 個 Enemy
- Charge 31：23 個 Enemy
- Charge 605：fixed AI 正權重可達，3 回合後 +150%
- EarthRound 120：12 個 Enemy
- Charge release 使用 release-round FIX snapshot
- EarthRound hidden round 跳過 WEAKEN/BARRIER compliance tick
- EarthRound hidden round保留 DRUNK release boost
- EarthRound hidden round保留 FIX attribute work
- EarthRound release 仍為 final damage ×1.9，不改成 attack ×1.9
- Confusion 會中斷 Charge / EarthRound
- V0.73～V0.78 回歸標記保留
- save schema：仍為 **21**



## V0.80 FIXSTR consumers / roundFix snapshot

V0.80 把一批「原 C 明確讀 `CHAR_WORKFIXSTR`」的可達技能，從永久 base attack 改回每輪 PreCommand 已完成 compliance 後的 FIX snapshot。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `gmsv/src/battle/battle.c`

### roundFix snapshot

V0.78 已在 `enemyPrepareRoundAction()` 算出：

- `sourceFixAttack`
- `sourceFixDefense`
- `sourceFixQuick`

V0.80 將它們明確保存為：

- `roundFixAttack`
- `roundFixDefense`
- `roundFixQuick`

之後只要原 C 寫的是 `CHAR_WORKFIXSTR / FIXTOUGH / FIXDEX`，web 就可以直接讀同一輪 `roundFix*`，不再把永久 `unit.attack / defense / quick` 冒充 FIX。

EARTHROUND0 因 V0.79 會跳過 PreCommand，因此隱身者也會自然保留上一輪的 roundFix snapshot。

### Gyrate / 回旋攻擊

原 `PETSKILL_Gyrate()` 在 AI 階段就解析：

`攻%`

並以：

`FIXSTR + trunc(FIXSTR * pct / 100)`

直接寫本輪 `WORKATTACKPOWER`。

正權重：

- 619 回旋攻擊：`攻%-50` — 1 個 Enemy
- 653 T回旋攻擊：`攻%+20` — 5 個 Enemy

V0.80 現在在 `enemyPrepareRoundAction()` 先以當輪 `sourceFixAttack` 完成這個覆寫；`performEnemyGyrate()` 只讀已完成的 `roundAttack`。

因此若同輪已有 WEAKEN 或其他 compliance FIX 修正，Gyrate 不會再錯誤回到永久 base attack。

### Retrace / 追跡攻擊

資料：

- 713 追跡攻擊
- option：`攻%+100`
- 4 個 Enemy 正權重使用

但 fixed `PETSKILL_Retrace()` 裡解析 `攻%` 的整段程式被：

```c
/*
 ...
*/
```

完整註解掉。

所以首擊**不吃 option 的 +100%**。

battle.c 只有在首擊被 DODGE 後：

- `RAND(1,100) < 80`，實際成功值 1～79
- 成功才硬寫：

```c
WORKATTACKPOWER =
    FIXSTR + FIXSTR * 0.2;
```

再做第二擊。

V0.80 保留：

- 首擊：正常當輪 WORK attack，不套 +100%
- 追擊：當輪 `roundFixAttack +20%`
- Counter loop：仍依原碼使用第一擊的回傳狀態

### DamageToHp 503～505

正權重：

- 503 嗜血技：23 個 Enemy
- 504 嗜血技2：8 個 Enemy
- 505 嗜血技3：24 個 Enemy

原 parser：

```c
def = (atoi(buf1) / 100);
strdef = FIXSTR - (int)(FIXSTR * def);
```

因為 `atoi(buf1)` 與 `100` 都是 int：

- 30 / 100 = 0
- 20 / 100 = 0
- 10 / 100 = 0

所以資料描述中的攻擊下降實際不生效。

但原結果仍是：

`WORKATTACKPOWER = 當輪 FIXSTR`

而不是永久 base STR。

V0.80 因此：

- 保留 C integer-division bug
- reduction 仍為 0
- 但基底改成 `roundFixAttack`

這樣 WEAKEN 等 PreCommand FIX 修正不會被 handler 意外洗掉。

### DamageToHp2 / 浴血狂襲

659 T浴血狂襲有正權重 Enemy 使用。

原 `BATTLE_AttackSeq(..., BATTLE_COM_S_DAMAGETOHP2)`：

1. 先完成正常 CriticalCheck
2. perCri ×1.3
3. 再硬寫：
   `WORKATTACKPOWER = FIXSTR + FIXSTR * 0.2`
4. QUICK +20% 只屬 `BATTLE_DexCalc` 排序，不改 CriticalCheck 所使用的 FIXDEX

V0.80 現在 DamageToHp2 的傷害攻擊力改為：

`roundFixAttack +20%`

不再用永久 `unit.attack +20%`。

### Charge 也改用明確 roundFix

V0.79 已確認 `BATTLE_Charge()` 釋放時讀的是釋放回合：

`CHAR_WORKFIXSTR`

V0.80 因此再把 release 基底由泛用 `roundAttack` 改成明確：

`roundFixAttack`

避免未來其他 WORKATTACKPOWER 型技能修正混入 Charge 的 FIXSTR 基底。

### V0.80 回歸

確認：

- `game.js` JavaScript 語法：PASS
- 正權重 Skill ID：158
- 已執行 handler：134
- 原資料缺失：22
- 原 build 未註冊：2
- dispatcher gap：0
- `roundFixAttack / Defense / Quick` 每輪建立
- Gyrate：Prep 階段以 FIXSTR 套 option
- Retrace：首擊不套 +100%；追擊 FIXSTR +20%
- DamageToHp2：FIXSTR +20%
- DamageToHp 503～505：保留 int division 0，但基底為 FIXSTR
- Charge：release 使用 roundFixAttack
- EarthRound：V0.79 hidden snapshot 行為保留
- 永久 `unit.attack` 的直接整數讀取，只剩 PreCommand 建立 sourceFixAttack 的合法入口
- V0.73～V0.79 回歸標記保留
- save schema：仍為 **21**



## V0.81 FIXDEX / WORKQUICK separation

V0.81 把 fixed C 中「FIXDEX」與「WORKQUICK」的用途正式拆開。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`

### 哪些地方讀 FIXDEX

原碼：

- `BATTLE_DuckCheck()`
- `BATTLE_CriticalCheckPlayer()`
- `BATTLE_CounterCalc()`
- `BATTLE_CaptureCheck()`

全部直接讀 `CHAR_WORKFIXDEX`，不是 `CHAR_WORKQUICK`。

但 `BATTLE_DexCalc()` 的 EntrySort 則讀本回合 WORKQUICK。

因此 SpeedyAttack、本輪怯戰敏捷覆寫、酒醉解除 QUICK ×2、DamageToHp2 的 WORKQUICK +20% 等，可以改變行動順序，卻不應直接改變回避／會心／反擊公式。

### battle view 的雙敏捷欄位

V0.81 現在每個 battle view 同時提供：

- `quick`：WORKQUICK 語意，給 EntrySort 與真正讀 WORKQUICK 的流程。
- `fixedDex`：FIXDEX 語意，給 Duck / Critical / Counter / Capture。

Player / Active Pet 的 `fixedDex` 為該輪 PreCommand 後 dex snapshot；Enemy 的 `fixedDex = roundFixQuick`。

### DuckCheck：不能行動就不能閃避

fixed `BATTLE_DuckCheck()` 在一般回避公式之前先檢查 `BATTLE_CanMoveCheck(defender)`。

若為 FALSE，直接 return FALSE。

因此麻痺、石化、睡眠、魔障、暈眩等不可行動狀態，都不能再靠普通 DuckCheck 閃避。

V0.81 的 `resolveNormalAttack()` 現在在 `defender.canMove === false` 時直接禁用整個普通 dodge 判定；GUARD 仍同樣直接禁用 DuckCheck。

### Duck / Critical / Counter 全改 FIXDEX

V0.81 的：

- `battleDuckChance()`
- `battleCriticalChance()`
- `battleCounterChance()`

現在都優先讀 `fixedDex`；只有非 battle-view fallback 才退回 `quick`。

所以若 FIXDEX=100、WORKQUICK=200：

- 出手排序用 200
- 回避／會心／反擊仍用 100

### CaptureCheck 也改回 FIXDEX

原 `BATTLE_CaptureCheck()`：

```c
At_Dex = CHAR_getWorkInt(attackindex, CHAR_WORKFIXDEX);
Df_Dex = CHAR_getWorkInt(defindex, CHAR_WORKFIXDEX);
```

V0.81：

- Player 用 `playerBattleView().fixedDex`
- Enemy 用 `roundFixQuick`
- UI 預覽尚未建立當輪 snapshot 時，Enemy 才退回 compliant `quick`

實際 capture roll 發生在 `normalBattleOrder()` 完成 PreCommand snapshot 後，因此真正判定會讀到當輪 FIXDEX。

### CaptureCheck 的 C int arithmetic

原碼相關變數全部是 int：

```c
Df_HpPer = 10 - (HP * HP) / MaxHP;
Df_Level = At_Level/2 - Df_Level/2;
Df_Dex = At_Dex/15 - Df_Dex/15;
WorkGet =
  (Df_HpPer + Df_Level + Df_Dex + Df_Ge + At_Luck)
  * At_Charm / 50;
```

V0.81 已改成逐步 `Math.trunc`，不再用 JavaScript 浮點一路算到底。

原碼只限制 `WorkGet > 99`，沒有把負數強制改成 0；web 同樣保留 raw 負值，只在 UI 顯示時 clamp 到 0～99。

### Capture success 的 strict less-than

來源：

```c
if (RAND(1,100) < WorkGet)
```

因此 WorkGet=20 時成功 roll 是 1～19，不是 1～20。

V0.81 實際捕獲改為 `cRand(1,100) < raw`，完整保留 strict-less-than。

### V0.81 回歸

確認：

- `game.js` JavaScript 語法：PASS
- save schema：21
- 正權重 Skill coverage：158 / 134 / 22 / 2 / gap 0
- Player / Pet / Enemy 都有 `fixedDex`
- Enemy `fixedDex = roundFixQuick`
- Duck 使用 FIXDEX
- Critical 使用 FIXDEX
- Counter 使用 FIXDEX
- EntrySort 仍使用 WORKQUICK
- CannotMove defender 不再普通閃避
- Capture 使用雙方 FIXDEX
- Capture HP / level / dex / charm 全部 C int truncation
- Capture success 使用 `RAND(1,100) < WorkGet`
- V0.73～V0.80 回歸標記保留



## V0.82 FIXDEX integer combat math

V0.82 繼續校正 fixed C 的核心物理戰鬥算術，重點不是改公式，而是補上 C `int` 變數的實際截斷時點。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`

原常數：

```c
float gKawashiPara = 0.02;
float gCounterPara = 0.08;
float gCriticalPara = 0.09;
#define KAWASHI_MAX_RATE (75)
```

這些常數在 web 版原本已經正確；V0.82 沒有改它們。

### Duck 的 int FIXDEX compound assignment

`BATTLE_DuckCheck()`：

```c
int Df_Dex, At_Dex;
...
At_Dex = CHAR_getWorkInt(... CHAR_WORKFIXDEX);
Df_Dex = CHAR_getWorkInt(... CHAR_WORKFIXDEX);

if(enemy -> pet) At_Dex *= 0.8;
else if(non-enemy -> pet) Df_Dex *= 0.8;
else if(non-player -> player) At_Dex *= 0.6;
else if(player -> non-player) Df_Dex *= 0.6;
```

因為 `At_Dex / Df_Dex` 是 `int`，所以 C 的：

`Df_Dex *= 0.8`

不是保留 `.8` 小數，而是算完後立刻截斷回整數。

V0.81 雖已改讀 FIXDEX，但 JS 仍讓小數一路進 `sqrt()`。

V0.82 改成：

```js
dfDex = Math.trunc(dfDex * .8)
```

同理處理 `.6` 與 attacker scaling。

### Critical 的 int FIXDEX scaling

`BATTLE_CriticalCheckPlayer()` 中：

- `At_Dex`：int
- `Df_Dex`：int
- `At_Luck`：int
- `At_Soubi`：int
- `Work`：float

因此 V0.82：

- FIXDEX 的 `.8 / .6` 先按 int 截斷
- Luck / weapon critical 以 int 讀入
- `Work=(Big-Small)/gCriticalPara` 仍保持 float，不額外截斷

這是和 Counter 不同的地方。

### Counter 的第二層 int truncation

`BATTLE_CounterCalc()`：

```c
int Df_Dex, At_Dex, Work;
float per, Big, Small, wari, divpara;
...
Work = ( Big - Small ) / divpara;
```

所以 Counter 除了 FIXDEX 的 `.8 / .6` 要先截斷外，

`(Big-Small)/divpara`

在指派給 `int Work` 時還要再截斷一次。

V0.82 改成：

```js
let work = Math.trunc((big-small)/div);
```

之後才依原碼：

- root path：`sqrt(Work)`
- non-root path：直接 `Work`

### 可觀察差異

固定測例：

```text
attacker FIXDEX = 101
defender FIXDEX = 99
Enemy -> Pet
```

Duck：

- 舊 JS 浮點：約 `3016.6206`
- fixed C int：約 `3082.2070`

Counter：

- 舊 JS 浮點：`0.2`
- fixed C：`0`

原因是 Counter 的：

`(Big-Small)/10`

最後指派到 `int Work` 時被截斷為 0。

### V0.82 保留項目

V0.82 沒有改：

- gKawashiPara 0.02
- gCounterPara 0.08
- gCriticalPara 0.09
- KAWASHI_MAX_RATE 75%
- V0.73 BOW Duck +20 重複兩次的來源 bug
- V0.76 DRUNK lifecycle bug
- V0.77 WEAKEN / BARRIER lifecycle
- V0.78 StatusChange pre-command stat ordering
- V0.79 CHARGE / EARTHROUND lifecycle
- V0.80 FIXSTR consumers
- V0.81 FIXDEX / WORKQUICK separation
- save schema 21

### V0.82 regression

已確認：

- `game.js` JavaScript syntax：PASS
- Duck FIXDEX scaling 使用 int truncation
- Critical FIXDEX scaling 使用 int truncation
- Counter FIXDEX scaling 使用 int truncation
- Counter `Work` 使用 int truncation
- 公式常數與 fixed C 相同
- save schema：21



## V0.83 physical attribute integer pipeline

V0.83 校正普通物理傷害的四屬計算，讓 web 路徑對齊 fixed C 的分段 `int` 截斷。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`

原流程：

```text
BATTLE_DamageCalc
→ BATTLE_AttrAdjust
→ At_pow[i] *= damage
→ BATTLE_AttrCalc
→ damage *= At_FieldPow / Df_FieldPow
```

### BATTLE_GetAttr / At_pow 都是 int

來源：

```c
int At_pow[5];
int Dt_pow[5];
```

四屬由 FIX 屬性讀入，負值歸 0，無屬性：

```text
none = max(0, 100 - earth - water - fire - wind)
```

V0.83 新增 `sourceBattleElements()`，明確以 `Math.trunc` 對齊來源 int。

### At_pow *= damage

來源會先：

```c
for(i=0;i<5;i++){
    At_pow[i] *= damage;
}
```

因此進 `BATTLE_AttrCalc()` 的攻方五屬已經是：

`element * rawDamage`

的 int 值。

### BATTLE_AttrCalc 的分量逐一截斷

`BATTLE_AttrCalc()` 的參數：

```c
int My_Fire,
int My_Water,
int My_Earth,
int My_Wind,
int My_None
```

而每個 My_* 又會接收含 1.5 / 0.6 的浮點加權式。

因為左值仍是 int，所以：

- Fire component 先截斷
- Water component 先截斷
- Earth component 先截斷
- Wind component 先截斷
- None component 先截斷

之後才加總。

函式本身也是：

```c
static int BATTLE_AttrCalc(...)
```

最後：

```c
return (iRet * D_ATTR);
```

其中：

```c
#define D_ATTR (1.0/(100*100))
```

所以 `/10000` 的結果還會因 return int 再截一次。

V0.83 直接復用現有魔法路徑已驗證過的：

`magicAttrCalcRaw()`

來保留這些截斷節點。

### 戰場屬性在 AttrCalc 之後才乘

來源：

```c
damage = BATTLE_AttrCalc(...);
damage *= (At_FieldPow / Df_FieldPow);
```

`damage` 是 int，所以場地倍率乘完又截斷。

V0.82 以前普通物理是：

```text
rawDamage
× attrMultiplier
× fieldRatio
→ 最後只 trunc 一次
```

V0.83 改成：

```text
rawDamage
→ 五屬分量逐一 trunc
→ /10000 trunc
→ fieldRatio
→ 再 trunc
```

### 可觀察差異

固定整數測例：

```text
raw damage = 89

攻方：
地 18 / 水 41 / 火 15 / 風 26

守方：
地 3 / 水 45 / 火 43 / 風 9
```

舊 web 單次 multiplier：

`94`

fixed C 分段 int：

`93`

因此這是實際可改變傷害結果的差異，不只是內部重構。

### V0.83 regression

已確認：

- `game.js` JavaScript syntax：PASS
- 普通物理使用 `sourceBattleElements()`
- `At_pow * rawDamage` 以 int 表示
- 屬性核心使用 `magicAttrCalcRaw()` 的 fixed C 分量截斷
- field ratio 在 AttrCalc 後獨立套用
- V0.82 FIXDEX int 截斷保留
- V0.76 DRUNK lifecycle 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21



## V0.84 DamageCalc STONE / REGRET defense ordering

V0.84 校正 fixed C `BATTLE_DamageCalc()` 內兩個共用同一條防禦時序、且目前資料可直接觸發的差異。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`

### STONE ×2 只屬 BATTLE_DamageCalc 區域 defense

來源先建立：

```c
float defense;
defense = CHAR_getWorkInt(defindex, CHAR_WORKDEFENCEPOWER) * 0.70;
...
if(CHAR_getWorkInt(defindex, CHAR_WORKSTONE) > 0) defense *= 2.0;
```

這個 `defense *= 2` 沒有寫回 `CHAR_WORKDEFENCEPOWER`。

而會心額外傷害 `BATTLE_CriDamageCalc()` 在普通 DamageCalc 完成後重新讀：

```c
damage += CHAR_getWorkInt(defindex, CHAR_WORKDEFENCEPOWER)
    * attackerLevel / defenderLevel * 0.5;
```

所以石化目標：

- 普通物理的 DamageCalc 防禦會 ×2
- 會心額外段仍使用原 WORKDEFENCEPOWER
- 會心額外段不能再 ×2

V0.83 以前 web 把石化提前乘進 battle view 的 `defense`，因此 DamageCalc 本體雖得到雙防，critical bonus 也誤讀到雙倍 defense。

V0.84 改為：

- Player / Pet / Enemy battle view 的 `defense` 保持 WORKDEFENCEPOWER 語意
- 另外攜帶 `stone` flag
- `battleDamageCore()` 在 fixed C 的正確位置才做 `defense *= 2`
- `resolveNormalAttack()` 的 critical bonus 因而重新讀到未石化加倍的 WORKDEFENCEPOWER

固定例：

```text
WORKDEFENCEPOWER = 100
attacker level = defender level
STONE = active
```

會心額外段：

- fixed C：100 × 1 × 0.5 = 50
- 舊 web：200 × 1 × 0.5 = 100
- V0.84：50

### REGRET / 憾甲一擊是後置 FIXTOUGH 覆寫

原 `BATTLE_DamageCalc()` 的順序：

```text
WORKDEFENCEPOWER × 0.70
→ SuperWall
→ NPCENEMY_ADDPOWER
→ STONE ×2
→ REGRET / REGRET2: defense = WORKFIXTOUGH
→ 後續傷害公式
```

因此 REGRET 的 `defense = FIXTOUGH` 是覆寫，不是「一開始就改用 FIXTOUGH 再繼續套防禦修正」。

V0.83 以前 web 在進 DamageCalc 時直接：

```text
useFixedToughDefense ? FIXTOUGH : WORKDEFENCEPOWER ×0.70
```

接著仍會套 SuperWall / Enemy add-power，和 fixed C 時序不同。

V0.84 改為：

1. 一律先走正常 WORKDEFENCEPOWER ×0.70。
2. 照來源順序套 SuperWall / Enemy add-power / STONE。
3. 若為 REGRET，再以 FIXTOUGH 最後覆寫 defense。

因此 REGRET 會正確洗掉它之前的：

- SuperWall 防禦加成
- Enemy defender add-power
- 石化 ×2

### fixed data 可達性

正權重 Enemy AI：

- Skill 590「虎虎生威／石化 BattleModel」：1 個 Enemy
- Skill 655「虎虎生威／石化 BattleModel」：6 個 Enemy
- Skill 708「石化攻擊」：1 個 Enemy
- Skill 627「難得糊塗」：1 個 Enemy，候選 magic 159 可造成石化
- Skill 640「憾甲一擊」：43 個 Enemy，正權重總和 58
- Skill 666「T憾甲一擊」：10 個 Enemy，正權重總和 19

所以兩個修正都不是不可達的理論分支。

### V0.84 regression

已確認：

- `game.js` JavaScript syntax：PASS
- battle view 不再把 STONE ×2 寫進 `defense`
- Player / Pet / Enemy 都攜帶獨立 `stone` flag
- `battleDamageCore()` 順序為 SuperWall → NPC add-power → STONE → REGRET FIXTOUGH
- critical bonus 重新使用未石化加倍的 WORKDEFENCEPOWER
- REGRET 不再把 SuperWall / Enemy add-power / STONE 套到 FIXTOUGH
- V0.83 physical attribute int pipeline 保留
- V0.82 FIXDEX int combat math 保留
- V0.81 FIXDEX / WORKQUICK separation 保留
- V0.77 WEAKEN / BARRIER lifecycle 保留
- V0.76 DRUNK lifecycle bug 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21


## V0.85 Modifyattack integer-division / base-attribute semantics

V0.85 校正正權重 `PETSKILL_Modifyattack`（544～546）的兩個 fixed C 細節。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_S_Modifyattack()`

### random attribute term 先做 C int division

來源：

```c
def = ((float)(atoi(buf2))/100);

if((ModNum = CHAR_getInt(defindex, KModKind[i].Kind)) > 0){
    def += (float)((rand()%(ModNum+5))/100);
    *damage += *damage * def;
}
```

關鍵是：

```c
(rand() % (ModNum+5)) / 100
```

左右兩邊都是 `int`，所以 **先做整數除法**，結果才 cast 成 float。

V0.84 以前 web 誤寫成：

```js
bonusRoll / 100
```

造成每個 roll 都可產生 0.01、0.02、0.03... 的連續倍率。

V0.85 改成：

```js
bonusStep = Math.trunc(bonusRoll / 100)
factor = optionPercent / 100 + bonusStep
```

因此：

- target attribute 1～95：`rand()%(ModNum+5)` 最大不超過 99，random term 永遠為 0。
- target attribute 96～100：只有 modulo 結果實際到 100 以上時，random term 才會跳成 1。
- 不再產生來源不存在的 0.01～0.99 平滑加成。

例如 Skill 544 `EA|20`、目標地屬性 50：

```text
fixed C:
rand()%55 = 0..54
0..54 / 100 (int) = 0
factor = 0.20

舊 web:
factor = 0.20 .. 0.74

V0.85:
factor = 0.20
```

### ModNum 讀 base CHAR attribute，不讀戰鬥 FIX attribute

同一函式使用：

```c
CHAR_getInt(defindex, CHAR_EARTHAT)
CHAR_getInt(defindex, CHAR_WATERAT)
CHAR_getInt(defindex, CHAR_FIREAT)
CHAR_getInt(defindex, CHAR_WINDAT)
```

它沒有讀：

```text
CHAR_WORKFIXEARTHAT
CHAR_WORKFIXWATERAT
CHAR_WORKFIXFIREAT
CHAR_WORKFIXWINDAT
```

這和前面的普通物理 `BATTLE_AttrAdjust()` 不同；普通物理本體會透過 `BATTLE_GetAttr()` 使用 WORKFIX 屬性。

因此 Attribute Reverse 的正確結果是：

1. 本次普通物理傷害：使用反轉後的 battle FIX 屬性。
2. `Modifyattack` 額外段的 `ModNum`：仍使用未反轉的 base CHAR 屬性。

V0.84 以前 web 的額外段使用 `battleElementsForDesc()`，會把反轉後 FIX 屬性錯當成 `ModNum`。

V0.85 改為額外段明確讀 `battleBaseElements()`。

### fixed data 可達性

目前正權重 Enemy AI：

- Skill 544「地屬性強化攻擊」`EA|20`：Enemy 2238，weight 3
- Skill 545「水屬性強化攻擊」`WA|20`：Enemy 2237，weight 3
- Skill 546「火屬性強化攻擊」`FI|20`：Enemy 2236，weight 3
- Skill 825「地屬性強化攻擊」`EA|9999`：4 個 Enemy，正權重總和 12
- Skill 826「水屬性強化攻擊」`WA|9999`：1 個 Enemy，weight 3
- Skill 827「火屬性強化攻擊」`FI|9999`：1 個 Enemy，weight 3
- Skill 828「風屬性強化攻擊」`WI|9999`：1 個 Enemy，weight 3

七條都是真正可達的 battle path；V0.85 的同一個 Modifyattack handler 已同時涵蓋 544～546 與 825～828。

### V0.85 regression

已確認：

- `game.js` JavaScript syntax：PASS
- Modifyattack random term 使用 `Math.trunc(bonusRoll/100)`
- 不再使用 `bonusRoll/100` 當連續小數倍率
- Modifyattack `ModNum` 使用 `battleBaseElements()`
- 普通物理 `battleAttrDamage()` 仍使用 battle FIX / reverse 後屬性
- Skill 544 / 545 / 546 正權重可達
- V0.84 STONE / REGRET DamageCalc ordering 保留
- V0.83 physical attribute integer pipeline 保留
- V0.82 FIXDEX integer combat math 保留
- V0.81 FIXDEX / WORKQUICK separation 保留
- V0.77 WEAKEN / BARRIER lifecycle 保留
- V0.76 DRUNK lifecycle bug 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21


## V0.86 BatFly direct-HP drain does not wake SLEEP

V0.86 校正正權重 Skill 633「群蝠四竄」的直接 HP 吸取生命週期。

固定來源：

- `gavinlinasd/StoneAge`
- ref `1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_BatFly()`
- `BATTLE_DamageWakeUp()`

### BatFly 不走 DamageSub / DamageWakeUp

原 `BATTLE_BatFly()` 對敵方整側逐一直接：

```c
charhp = CHAR_getInt(toindex, CHAR_HP);

if((charhp/10) == 0){
    CHAR_setInt(toindex, CHAR_HP, charhp - 1);
    charhp = 1;
}else{
    CHAR_setInt(toindex, CHAR_HP, charhp - (charhp/10));
    charhp /= 10;
}
```

未騎乘時：

- 目前 HP >= 10：扣 `floor(currentHP/10)`
- 目前 HP 1～9：固定扣 1
- 吸取量累加到 `addhp`
- 最後回復施術者，且不超過 MAXHP

整個 `BATTLE_BatFly()` 沒有呼叫：

```c
BATTLE_AttackSeq
BATTLE_DamageSub
BATTLE_DamageWakeUp
```

而 fixed `BATTLE_DamageWakeUp()` 的可見戰鬥效果是：

```c
if(CHAR_getWorkInt(defindex, CHAR_WORKSLEEP) > 0){
    CHAR_setWorkInt(defindex, CHAR_WORKSLEEP, 0);
}
```

所以「失去 HP」本身不代表一定會被喚醒；只有實際經過來源 wake 路徑才會解除 SLEEP。

### V0.85 以前 web 的偏差

原 web BatFly 在直接扣 HP 後額外做：

```js
battleStatusWakeOnDamage(target, damage)
```

因此睡眠中的 Player / Active Pet 只要被 BatFly 吸到 HP，就會被提前喚醒。

這不是 fixed C 行為。

V0.86 移除這個 wake 呼叫。

現在：

- BatFly 仍照目前 HP 的 10% / 最低 1 直接吸取
- BatFly 仍回復施術者 HP
- BatFly 不做 Duck / Critical / Guard / Counter
- **BatFly 不解除 SLEEP**
- 一般物理、Combo、BattleModel 等真正呼叫 wake 的路徑不受影響
- DivideAttack 原本就沒有錯誤 wake，維持不變

### fixed data 可達性

Skill 633「群蝠四竄」有 5 個正權重 Enemy：

- Enemy 2510：weight 4
- Enemy 5122：weight 1
- Enemy 6054：weight 2
- Enemy 6056：weight 2
- Enemy 14031：weight 3

正權重總和：12。

因此這是目前遊戲能實際遇到的狀態生命週期差異。

### V0.86 regression

已確認：

- `game.js` JavaScript syntax：PASS
- BatFly handler 不再呼叫 `battleStatusWakeOnDamage()`
- 通用 `battleStatusWakeOnDamage()` 仍保留，且只解除 SLEEP
- DivideAttack 維持 direct-HP / no-wake
- Skill 633 正權重可達：5 Enemy / weight 12
- V0.85 Modifyattack integer-division bug 保留
- V0.85 reachability 文件補齊 Skill 825～828
- V0.84 STONE / REGRET ordering 保留
- V0.83 physical attribute integer pipeline 保留
- V0.82 FIXDEX integer combat math 保留
- V0.77 WEAKEN / BARRIER lifecycle 保留
- V0.76 DRUNK lifecycle bug 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21


## V0.87 DamageToHp2 critical 30% int truncation

V0.87 校正正權重 Skill 659「T浴血狂襲」的會心率強化邊界。

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`，
`gmsv/src/battle/battle_event.c` 的 `BATTLE_AttackSeq()`。

來源先取得整數會心門檻，再做：

```c
perCri = perCri + (perCri*0.3);
if( RAND(1,10000) < perCri )
```

`perCri` 是 `int`，所以 +30% 指派回去時會立刻截斷。

例如 base `101`：

- fixed C：`101 + 30.3 -> 131`，判定 `RAND < 131`
- V0.86 web：`131.3`，判定 `RAND < 131.3`

因此 RAND=131 在舊 web 會多出一次來源不存在的成功邊界。

V0.87 改成：

```js
const criticalRaw=Math.trunc(baseCriticalRaw*criticalChanceMultiplier);
```

仍保留來源「先 cap 10000、後 ×1.3」的順序，不重新 cap。

### fixed data 可達性

- Skill 659「T浴血狂襲」
- option `100`
- Enemy 5546
- positive weight 1

### V0.87 regression

- `game.js` syntax：PASS
- DamageToHp2 +30% critical 後立即 int truncation
- critical RAND 維持嚴格 `<`
- 不重新 cap 10000
- V0.86 BatFly no-wake 保留
- V0.85 Modifyattack semantics 保留
- V0.84 STONE / REGRET ordering 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21

## V0.88 SpeedyAttack negative defense int truncation

V0.88 校正正權重 Skill 542「疾速攻擊」在 `PETSKILL_SpeedyAttack()` 的防禦修正整數截斷順序。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/pet_skill.c`
- `PETSKILL_SpeedyAttack()`

來源對 `防%` 的有效處理是：

```c
fPer = (fPer / 100);
strdef = CHAR_getWorkInt(charaindex, CHAR_WORKFIXTOUGH);
strdef = (int)(strdef * fPer);
CHAR_setWorkInt(
    charaindex,
    CHAR_WORKDEFENCEPOWER,
    CHAR_getWorkInt(charaindex, CHAR_WORKFIXTOUGH) + strdef
);
```

Skill 542 的 option 是：

```text
防%-30 敏%+30
```

這個來源函式只解析 `防%`；`敏%+30` 不會直接改寫 QUICK。疾速攻擊的 +30% 出手效果仍只來自 `BATTLE_DexCalc()` 的 command 專用排序公式。

### V0.87 以前的差異

原 C 的 `strdef` 是 `int`，因此負百分比會先對 delta 做向 0 截斷，再加回 FIXTOUGH。

例如 FIXTOUGH = 101：

- fixed C：`(int)(101 * -0.30) = -30`，最後防禦 = `101 - 30 = 71`
- V0.87 web：`Math.trunc(101 + 101 * -0.30) = Math.trunc(70.7) = 70`

兩者會在部分非整除防禦值產生 1 點實戰差異。

V0.88 改成：

```js
const baseDefense = sourceFixDefense;
unit.roundDefense =
  baseDefense + Math.trunc(baseDefense * defensePct / 100);
```

也就是忠實保留「先截斷 delta，再相加」的 C 指派順序。

### fixed data 可達性

`data/generated/stoneage_enemy_ai.json` 已確認：

- Skill 542「疾速攻擊」
- Enemy 2537
- positive weight 1

因此這不是註解區塊或死路徑，而是真正可在目前 Enemy AI 戰鬥中抽到的差異。

另外重新確認：

- `PETSKILL_ToothCrushe` 裡的 `atoi(...)/100` 攻防敏 parser 位於 `/* ... */` 註解內，不執行。
- `PETSKILL_Modifyattack` AI 階段同型 `atoi(...)/100` parser 也位於註解內；V0.85 修正的是實際可達的 `BATTLE_S_Modifyattack()` 傷害階段整數除法 bug，而不是這段註解碼。

### V0.88 regression

- `game.js` JavaScript syntax：PASS
- SpeedyAttack 防禦修正：`base + trunc(base * pct / 100)`
- FIXTOUGH 101、-30%：fixed / web 都得到 71
- SpeedyAttack QUICK 仍不直接增加
- `roundDexMode='speedy'` 保留，`BATTLE_DexCalc()` 專用 +30% 排序保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack integer-division / base attribute semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21

## V0.89 CounterCalc int return truncation

V0.89 校正所有普通反擊共用的 `BATTLE_CounterCalc()` 回傳型別語意。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_CounterCalc()`
- `BATTLE_CounterCheckPlayer()`
- `BATTLE_CounterCheckPet()`

來源函式宣告是：

```c
int BATTLE_CounterCalc( int attackindex, int defindex )
```

函式內雖然：

```c
float per;
...
per = (float)( (double)sqrt( Work ) );
per *= wari;
return per;
```

但回傳型別是 `int`，所以 `return per` 會先把 float 向 0 截斷。

之後：

```c
CriPer = BATTLE_CounterCalc( attackindex, defindex );
```

或：

```c
per = BATTLE_CounterCalc( attackindex, defindex );
```

拿到的都已經是被截斷過的整數基礎反擊率。

### V0.88 以前的差異

web 已在 V0.82 正確處理：

- FIXDEX 的 0.8 / 0.6 int compound assignment
- `Work = (Big-Small)/divpara` 指派到 int 的截斷

但漏掉了**函式本身回傳 int 的最後一層截斷**。

例如 Pet 攻擊 Enemy：

```text
attacker FIXDEX = 101
defender FIXDEX = 99
```

來源先做：

```text
Df_Dex = int(99 × 0.8) = 79
Work = int((101 - 79) / 0.08) = 275
sqrt(275) = 16.583...
BATTLE_CounterCalc return int => 16
```

所以 Pet/Enemy 的後續反擊判定使用 16%，不是 16.583...%。

V0.88 web 則把 16.583... 直接保留到 `RAND(1,10000)` 門檻，會多出來源不存在的反擊機率。

V0.89 改成：

```js
let per=(root?Math.sqrt(work):work)*wari;
per=Math.trunc(per);
```

而且截斷位置是在：

- Player 的 CounterTbl / Luck 加成**之前**
- Pet / Enemy 的 NoGuard counter bonus **之前**

與原函式邊界一致。

### 可達性

這不是單一 PetSkill 的特殊路徑。

`BATTLE_CounterCalc()` 是：

- 玩家普通反擊
- 寵物普通反擊
- Enemy 普通反擊

共用的基礎計算，因此只要武器／command 沒有禁止反擊、且 CounterCheck 成功條件可成立，就能實際走到這條路徑。

### V0.89 regression

- `game.js` JavaScript syntax：PASS
- Counter `Work` int truncation 保留
- `BATTLE_CounterCalc()` float `per` 在函式邊界新增 int truncation
- Pet vs Enemy：FIXDEX 101 / 99 → base counter 16，不再是 16.583...
- Player CounterTbl / Luck 在 base int return 後才套用
- Pet / Enemy counter bonus 在 base int return 後才套用
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21

## V0.90 StatusAttackCheck integer chance semantics

V0.90 校正共用異常狀態命中函式 `BATTLE_StatusAttackCheck()` 的 C 整數指派語意。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_StatusAttackCheck()`

來源宣告：

```c
int Df_Reg = 0, level = 0, per = 0, i;
float templP = 0.0;
float fVitalP = 0.0;
```

非麻痺的共用命中率會先算：

```c
templP = (float)VITAL / (VITAL + STR + TOUGH + DEX);
fVitalP = templP / 0.25;
fVitalP *= 10.0;
```

接著：

```c
level = attackLv - defendLv;
level *= Bai;

per = PerOffset + level + FIXLUCK
    - Df_Reg - fVitalP;

if( per > 80 ) per = 80;

if( RAND(1,100) < per )
    return TRUE;
```

### 兩個 C int 邊界

`level` 是 `int`，所以 `level *= Bai` 若產生小數，會在 compound assignment 時先向 0 截斷。

更重要的是 `per` 也是 `int`。最後一條公式包含 `float fVitalP`，但整個結果在指派給 `per` 時會立刻向 0 截斷。

V0.89 以前 web 會把這個小數一路保留到：

```js
cRand(1,100) < per
```

因此可能多出原 C 不存在的一個 RAND 成功邊界。

### 可觀察差異

固定例：

```text
PerOffset = 30
level = 0
luck = 0
resist = 0

VITAL / total stats = 0.33
fVitalP = 0.33 / 0.25 * 10 = 13.2
```

則：

```text
fixed C:
per = int(30 - 13.2) = 16
RAND(1,100) < 16
成功 roll = 1..15

V0.89 web:
per = 16.8
RAND(1,100) < 16.8
成功 roll = 1..16
```

所以 roll=16 在舊 web 會成功，但 fixed C 會失敗。

V0.90 改成：

```js
let level=Math.trunc((attackLevel-defendLevel)*bai);
...
let per=Math.trunc(perOffset+level+luck-resist-vitalPenalty);
if(per>80)per=80;
```

並保留來源的嚴格 `RAND(1,100) < per`。

### fixed data 可達性

這是共用狀態命中公式，不只一個技能會走到。

目前正權重 Enemy AI 已確認：

| Skill | 類型 | distinct Enemy | 正權重總和 |
|---|---|---:|---:|
| 575 | 虛弱 | 6 | 9 |
| 576 | 全體虛弱 | 1 | 3 |
| 577 | 劇毒 | 1 | 3 |
| 578 | 全體劇毒 | 2 | 6 |
| 580 | 沉默 | 21 | 47 |
| 590 | BattleModel 狀態 | 1 | 4 |
| 655 | BattleModel 狀態 | 6 | 6 |
| 707 | 劇毒攻擊 | 2 | 13 |
| 708 | 石化攻擊 | 1 | 1 |

另外 Combined 狀態精靈與已接入的 AttackMagic 狀態路徑也共用同一個 web helper，因此一併取得正確的 int 門檻。

麻痺的來源特殊分支：

```c
per = 20 - RegTbl[PARALYSIS];
```

本來就是純整數，V0.90 不改它的機率語意。

### V0.90 regression

- `game.js` JavaScript syntax：PASS
- `level *= Bai` 對齊 int compound-assignment truncation
- 最終 `per = ... - fVitalP` 對齊 int assignment truncation
- `per > 80` cap 維持在截斷之後
- RAND 判定仍維持嚴格 `<`
- 例：`30 - 13.2` → fixed/web 都得到 16
- 麻痺特殊 `20 - resist` 分支不受影響
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21

## V0.91 CaptureCheck float pipeline / sleep bonus

V0.91 校正核心捕獲公式 `BATTLE_CaptureCheck()` 的型別語意。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_CaptureCheck()`

來源一開始明確宣告：

```c
float
    Df_MaxHp = 0,
    Df_HpPer = 0,
    At_Charm = 0,
    At_Level = 0,
    At_Dex = 0,
    At_Luck = 0,
    Df_Level = 0,
    Df_Dex = 0,
    Df_Ge = 30;
float WorkGet;
```

雖然這些值大多由 `CHAR_getInt()`／`CHAR_getWorkInt()` 讀入，
**後續運算是在 float 變數上進行**，不是 C 整數除法。

來源公式：

```c
Df_HpPer = 10 - ( Df_HpPer * Df_HpPer ) / Df_MaxHp;
Df_Level = ( At_Level/2 - Df_Level/2 );
Df_Dex = At_Dex / 15 - Df_Dex / 15;

WorkGet =
    ( Df_HpPer + Df_Level + Df_Dex + ( Df_Ge + At_Luck ) )
    * At_Charm / 50;

WorkGet += CHAR_getWorkInt( attackindex, CHAR_WORKMODCAPTURE );

if( CHAR_getWorkInt( defindex, CHAR_WORKSLEEP ) > 0 ){
    WorkGet += 15;
}

if( WorkGet > 99 ) WorkGet = 99;
```

### V0.90 以前的差異

舊 web 誤把捕獲公式當成「全部中間值都是 int」，因此逐段做：

```js
trunc(HP*HP/MAXHP)
trunc(level/2)
trunc(dex/15)
trunc(workSum*charm/50)
```

這不是 fixed C。

V0.91 改成：

```js
const hpTerm=10-(hp*hp)/maxHp;
const levelTerm=playerLevel/2-targetLevel/2;
const dexTerm=playerDex/15-enemyDex/15;
const workSum=hpTerm+levelTerm+dexTerm+(captureBase+luck);
let raw=workSum*charm/50;
```

也就是來源值先按 int 讀入，但公式本身保留 float 小數直到最後 RAND 判定。

### 可觀察差異

固定例：

```text
Player Lv = 10
Enemy Lv  = 10
Player FIXDEX = 30
Enemy FIXDEX  = 20
Enemy HP/MAXHP = 9/100
captureBase = 30
Luck = 0
Charm = 100
```

fixed C：

```text
HP term    = 10 - 81/100 = 9.19
Level term = 10/2 - 10/2 = 0
Dex term   = 30/15 - 20/15 = 0.666666...
WorkGet    = (9.19 + 0 + 0.666666... + 30) * 100/50
           = 79.713333...
```

V0.90 web 則因逐段截斷得到：

```text
HP term = 10
Dex term = 1
WorkGet = 82
```

差異不是單純顯示小數，而是直接改變 `RAND(1,100) < WorkGet` 的成功邊界。

### 睡眠 +15

來源還有：

```c
if( CHAR_getWorkInt( defindex, CHAR_WORKSLEEP ) > 0 ){
    WorkGet += 15;
}
```

V0.90 web 完全漏掉這一段。

V0.91 已接回：

```js
const sleepBonus=battleStatusActive(targetDesc,'sleep')?15:0;
raw += sleepBonus;
```

目前玩家側尚未建立完整主動睡眠 PetSkill 指令，因此這個 +15 在現行玩家操作中不是主要可達來源；
但保留它可以避免未來接玩家寵技後捕獲公式再次偏離 fixed C。

### WORKMODCAPTURE

來源另有：

```c
WorkGet += CHAR_getWorkInt( attackindex, CHAR_WORKMODCAPTURE );
```

現行 web 尚未建立可驗證的 `CHAR_WORKMODCAPTURE` 來源，所以 V0.91 明確維持等價預設 0，
不自行新增捕獲加成數值。

### V0.91 regression

- `game.js` JavaScript syntax：PASS
- 捕獲 HP² / MAXHP 使用 float division
- Player / Enemy level /2 使用 float division
- FIXDEX /15 使用 float division
- WorkGet × Charm /50 保留 float
- 不再對最終 WorkGet 做 `Math.trunc`
- WorkGet 上限仍為 99
- 捕獲判定仍維持嚴格 `RAND(1,100) < WorkGet`
- 睡眠目標 +15 已補回
- WORKMODCAPTURE 在缺可驗證來源時保持 0
- 固定例：舊 web 82；fixed/V0.91 約 79.713333
- V0.90 StatusAttackCheck int semantics 保留
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21
## V0.92 CAPTURE_FREES deletes all matching requirement items

V0.92 還原固定來源 `_CAPTURE_FREES` 的條件捕獲道具消耗語意。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/include/version.h`
- `gmsv/src/battle/battle_event.c`
- `BATTLE_CaptureItemCheck()`
- `BATTLE_CaptureItemDelAll()`

固定 build 的 `version.h` 明確開啟：

```c
#define _CAPTURE_FREES
#define _WOLF_TAKE_AXE
```

### 檢查只要求「至少有一個」

捕獲前的 `BATTLE_CaptureItemCheck()` 對每個必要 ItemId 掃背包；找到一個匹配就 `break`。
因此每種必要道具只要至少存在一個就能通過捕獲前置。

### 成功後卻把同 ID 全部刪掉

成功捕獲後 `BATTLE_CaptureItemDelAll()` 會對每個必要 ItemId 再掃完整個背包。
命中後會 `CHAR_DelItem()`，但原本可以停止掃描的 `break` 被註解掉，旁邊還保留「最後還是決定全刪」的來源註解。

所以來源實際語意是：

- 捕獲前：每種必要道具有 **1 個以上**即可。
- 捕獲失敗：不刪。
- 捕獲成功：每一種必要 ItemId 在背包中的**全部副本都刪除**。

V0.92 不自行把這個來源行為修成比較合理的「只吃一個」。

### V0.91 以前的差異

舊 web 成功捕獲後只做：

```js
for(const item of c.requirements||[]) consumeItem(item.id,1);
```

因此即使背包有 5 個必要道具，也只會消耗 1 個。

V0.92 改成先讀取該 ItemId 的目前總數，再全部交給既有 `consumeItem()`；tracked existing-index 的釋放流程仍由 `consumeItem()` 負責。

### fixed data 可達性

目前 web 的 capture condition 資料已包含實際條件道具，例如：

- 夏普德：1690 海藍之棒、1691 海藍之兜、1692 海藍之鎧
- 嘎吱拉：20247 魔法鑽戒[地LV3-1]
- 斑尼迪克：20259 會員捕寵結晶石

所以只要玩家持有同一必要道具兩份以上並成功捕獲，就能觀察 V0.91 與 fixed C 的差異。

### V0.92 regression

- `game.js` JavaScript syntax：PASS
- capture requirement pre-check 仍只要求每種至少 1 個
- 捕獲失敗不消耗條件道具
- 捕獲成功改為刪除每種必要 ItemId 的全部現有數量
- tracked ITEM existing-index 仍透過 `consumeItem()` 正常釋放
- 多種必要道具會各自全刪
- V0.91 CaptureCheck float pipeline / sleep +15 保留
- V0.90 StatusAttackCheck int semantics 保留
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21
## V0.93 BATTLE_SurpriseCheck first-round initiative / ambush

V0.93 接回固定來源 `BATTLE_SurpriseCheck()` 的首回合先制／偷襲流程。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`：`BATTLE_SurpriseCheck()`
- `gmsv/src/battle/battle.c`：`BATTLE_Init()` / `BATTLE_Command()`
- `gmsv/src/battle/battle_ai.c`：`BATTLE_ai_all()`
- `gmsv/src/battle/battle_command.c`：Surprise side menu flags

### fixed C 判定

`BATTLE_Init()` 每場只呼叫一次 `BATTLE_SurpriseCheck()`。若 Battle 有 `WinFunc`，來源直接不做 Surprise。

一般 PVE 以 Side 0 的第一位角色 FIXLUCK 決定 a / b：

| Luck | a | b | 敵方首輪不能動 | 玩家首輪不能動 |
|---:|---:|---:|---:|---:|
| 5 | 20 | 0 | 20% | 0% |
| 4 | 15 | 2 | 15% | 1% |
| 3 | 10 | 3 | 10% | 2% |
| 2 | 5 | 5 | 5% | 4% |
| 其他 | 0 | 7 | 0% | 6% |

來源不是直覺的兩段 `<=`：

```c
Rnd = RAND(1,100);
if( Rnd <= a ) iRet = 1;
else if( Rnd < a + b ) iRet = 2;
```

所以第二段會少一個邊界。例如 Luck 4 時：

- roll 1..15：敵方被先制
- roll 16：玩家遭偷襲
- roll 17..100：正常

不是 15% + 2%。

### 首輪行為

`iRet == 1` 時固定來源把 Side 1（Enemy）設成 `BSIDE_FLG_SURPRISE`。
`BATTLE_ai_all()` 看到 Enemy side Surprise 後直接寫 `COM_NONE + C_OK`，**不呼叫 `BATTLE_ai_normal()`**。
因此不能先抽 Enemy skill 再把行動丟掉；整個 Enemy AI 選招階段都不應發生。

`iRet == 2` 時 Side 0（Player）被標 Surprise，客戶端把 Player / Pet 操作關閉；首輪等價普通命令為 NONE。

兩側 Surprise flag 都在第一次 `BATTLE_Battling()` 後清掉，只影響首輪。

### StatusSeq 仍會跑

被 Surprise 的 actor 不是 C_WAIT 死路徑，而是正常進戰鬥處理但 command 為 NONE。
因此 V0.93 仍先跑 `processBattleStatusTurn()`，之後才跳過普通 command。

這也保留一個來源細節：若混亂 StatusSeq 在該時點把 COM 改成 ATTACK，混亂攻擊仍可覆蓋原本的 NONE；所以 Surprise skip 放在 confusionAttack 處理之後。

### Web 接法

- 一般非 questZone encounter：開戰時擲一次 Surprise。
- questZone：目前視為腳本／任務戰邊界；來源 `WinFunc != NULL` 會禁用 Surprise，而 web 沒有足夠資料把每一場腳本戰逐一證明為 WinFunc=NULL，因此不猜。
- 敵方被先制：首輪不呼叫 `enemyChooseAction()` / `enemyPrepareRoundAction()`。
- 玩家遭偷襲：開戰後直接自動結算 Enemy 首輪，玩家不用按一個假的「攻擊」按鈕才能讓偷襲發生。
- ComboCheck 把 Surprise actor 視為非普通攻擊，避免被錯誤拉進合擊。

### V0.93 regression

- `game.js` JavaScript syntax：PASS
- Surprise 每場一般 encounter 只擲一次
- Luck 4：Enemy surprise 15%、Player surprise 1% 邊界保留
- Luck 3：10% / 2%
- Luck 2：5% / 4%
- Luck 0/1/default：0% / 6%
- Enemy surprise 首輪不呼叫 Enemy AI
- Player surprise 首輪 Player / Active Pet normal command = NONE
- Surprise actor 仍先跑 StatusSeq
- confusionAttack 可在 Surprise 首輪覆蓋 NONE
- 首輪後 one-shot Surprise 狀態清除
- questZone 不猜 Surprise
- V0.92 CAPTURE_FREES 全刪條件道具保留
- V0.91 CaptureCheck float pipeline / sleep +15 保留
- V0.90 StatusAttackCheck int semantics 保留
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21
## V0.94 Enemy EscapeCheck integer average / dead-entry semantics

V0.94 校正 Enemy 逃跑共用公式 `BATTLE_EscapeCheck()` 的對手平均等級來源語意。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle_event.c`：`BATTLE_EscapeCheck()` / `BATTLE_Escape()`
- `gmsv/src/battle/battle.c`：Battle Entry / death cleanup

### 平均等級是 C int division

來源宣告：

```c
int mylevel, enemylevel = 0, enemycnt = 0;
```

掃完整個對手 Side 後：

```c
enemylevel += CHAR_getInt(enemyindex, CHAR_LV);
enemycnt++;
...
enemylevel /= enemycnt;
```

所以 `enemylevel / enemycnt` 是整數除法。

例如 Player Lv10 + Pet Lv11：

- fixed C：`(10 + 11) / 2 = 10`
- V0.93 web：`21 / 2 = 10.5`

以 rare=0 的 Enemy、第一次逃跑（來源實際 `escape_cnt=2`）、Enemy Lv10 為例：

- fixed C：`Esc = 30*2 - 2*(10-10) = 60`
- 舊 web：`Esc = 60 - 2*(10.5-10) = 59`

而來源判定是嚴格 `RAND(1,100) < Esc`，所以 roll=59 會產生實戰差異。

### HP=0 不等於已離開 Battle Entry

`BATTLE_EscapeCheck()` 掃對手 Entry 時只做：

```c
enemyindex = pEntry[i].charaindex;
if( CHAR_CHECKINDEX(enemyindex) == FALSE ) continue;
```

沒有檢查 HP 或 `CHAR_ISDIE`。

因此 Active Pet 在戰鬥中倒下後，只要 Entry 尚未經 `BATTLE_Exit()` 移除，其等級仍算在 enemycnt。
`BATTLE_Command()` 的一般 death cleanup 也不是把 pet side slot 立即全部移除；Pet 的 Battle Entry 可在倒下後繼續存在。

V0.93 web 原本用：

```js
if(pet&&petIsBattleActive(pet)) levels.push(pet.level);
```

`petIsBattleActive()` 會在 HP=0 時直接 false，等於把死寵比 fixed C 更早排除。

V0.94 在開戰時保存 Player side Entry snapshot；之後：

- HP=0：仍保留在 Escape 平均。
- `BattleTimid` / `2BattleTimid` / `Abduct` 等真正等價 `BATTLE_Exit` 的寵：`battlePetOutIds` 會把該 Entry 排除。

### 可達性

fixed Enemy AI 已確認：

- `escapeWeight > 0` 的 Enemy：596 個
- escape 正權重總和：843

因此這是大量一般 Enemy 都能實際走到的共用公式，不是單一特殊技能。

### V0.94 regression

- `game.js` JavaScript syntax：PASS
- Player Lv10 + Pet Lv11 → opponent average = 10，不是 10.5
- rare0 / first escape / Enemy Lv10 → Esc 60，不是 59
- battle 中 HP=0 的 Active Pet Entry 仍計入平均
- `battlePetOutIds` 的真正退出寵不計入平均
- 第一次 `BATTLE_Escape()` 的 `escape++` + `EscapeCheck escape+1` 語意維持，仍從 multiplier 2 開始
- Enemy rare 0/1/other → luck 1/3/5 映射保留
- RAND 判定維持嚴格 `< Esc`
- V0.93 SurpriseCheck 首回合流程保留
- V0.92 CAPTURE_FREES 全刪條件道具保留
- V0.91 CaptureCheck float pipeline / sleep +15 保留
- V0.90 StatusAttackCheck int semantics 保留
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21



## V0.95 EntrySort / ComboCheck dead Battle Entry semantics

V0.95 繼續掃固定來源的共用戰鬥核心與 `BATTLE_DexCalc()`，修正「死亡角色太早從排序陣列消失」造成的合擊差異。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`：`BATTLE_PreCommandSeq()` / `BATTLE_DexCalc()` / `EntrySort()` / `ComboCheck()` / `BATTLE_Command()`
- `gmsv/src/include/util.h`：`RAND(x,y)`

### HP=0 不會在 EntrySort 前自動移除

fixed `BATTLE_Command()` 建立 EntryList 時只排除真正已經沒有 Battle Entry 的 slot：

```c
if( pEntry[j][i].charaindex == -1 ) continue;
EntryList[entrynum].charaindex = pEntry[j][i].charaindex;
EntryList[entrynum].dex = BATTLE_DexCalc(pEntry[j][i].charaindex);
entrynum++;
```

這裡沒有 HP / ISDIE 篩選。

一般死亡處理會把 HP=0 的角色標成 `CHAR_ISDIE`，但不等價於立刻 `BATTLE_Exit()` 把 Entry 設成 -1。
下一輪 `BATTLE_PreCommandSeq()` 也仍會走該 Entry 的 complianceParameter。

所以原 C 的順序是：

1. 死亡但未 Exit 的 Entry 仍做 `BATTLE_DexCalc()`。
2. 一起進 `EntrySort()`。
3. 一起進 `ComboCheck()`。
4. 到真正 action loop 才因 `CHAR_ISDIE` / `HP <= 0` continue。

### 死亡 Entry 會中斷 ComboCheck

`ComboCheck()` 對每個已排序 Entry 都會先判斷：

```c
if( CHAR_getInt(charaindex, CHAR_HP) <= 0
 || BATTLE_CanMoveCheck(charaindex) == FALSE ){
    move = 0;
}
```

若前面已經有一個候選普通攻擊者，下一個 Entry 的 `move == 0` 會讓：

```c
start = -1;
```

也就是說，倒下角色即使自己不出手，仍可能位在兩個活角色中間，阻斷原本正在形成的合擊鏈。

V0.94 web 在排序前就用 `livingEnemyUnits()` / `petIsBattleActive()` 移除 HP=0 角色，
會把兩側原本不相鄰的活角色直接接在一起，產生來源不存在的合擊機會。

V0.95 改為：

- Enemy：只要還存在於本場 `enemy.units` Entry 集合，即使 HP=0 仍建立排序 actor。
- Active Pet：沿用 V0.94 的 `sourcePlayerSideEntries` snapshot；HP=0 仍保留，只有真正等價 `BATTLE_Exit` 的 `battlePetOutIds` 才排除。
- 死亡 Entry 使用 default `BATTLE_DexCalc` 路徑參與排序。
- `sourceComboCheck()` 會把死亡 Entry 視為不可移動，正確中斷 combo。
- attack / guard / capture 的真正 action loop 在 StatusSeq 前跳過 `sourceDeadEntry`，對齊 fixed C「排序後才檢查死亡」的時點。

### BATTLE_DexCalc 同輪審核結果

本輪也重新核對了幾個容易誤修的點，**沒有為了改版而硬改**：

- fixed `RAND(x,y)` 巨集允許 `y` 是小數運算式；`RAND(0, work*0.3)` 不是先把 `work*0.3` 截成 int。現行 `cRand()` 這點是正確的。
- `PETSKILL_SpeedyAttack` 的 `work + work*0.3` 與 `DamageToHp2` 的 `work + work*0.2` 已正確在最後回傳 int 時截斷。
- `enemyPrepareRoundAction()` 每輪都先把 `roundDexMode=null`，所以疾速／浴血的排序模式不會洩漏到下一輪。
- `_EQUIT_SEQUENCE` 在 fixed build 雖然開啟，但目前 web 尚沒有可證明的非 0 runtime sequence 資料；維持 0，不猜裝備順序值。
- 同 dex 時 fixed 使用 C `qsort`，其相等元素順序沒有可攜式保證；V0.95 不虛構一個「原版固定 tie-break」。

### V0.95 regression

- `game.js` JavaScript syntax：PASS
- dead Enemy Entry 仍進 `BATTLE_DexCalc` / sort / ComboCheck
- dead Active Pet Entry 仍進 sort / ComboCheck
- 真正 `BATTLE_Exit` 的 Pet 仍排除
- dead Entry 在 source ComboCheck 中 `move=false`
- attack / guard / capture 都在 StatusSeq 前跳過 dead Entry
- SpeedyAttack / DamageToHp2 Dex 模式不跨回合殘留
- RAND fractional upper-bound 語意維持，不做錯誤的預先 int 截斷
- V0.94 Enemy EscapeCheck dead-entry average 保留
- V0.93 SurpriseCheck 首回合流程保留
- V0.92 CAPTURE_FREES 全刪條件道具保留
- V0.91 CaptureCheck float pipeline / sleep +15 保留
- V0.90 StatusAttackCheck int semantics 保留
- V0.89 CounterCalc int return truncation 保留
- V0.88 SpeedyAttack defense int truncation 保留
- V0.87 DamageToHp2 critical int truncation 保留
- V0.86 BatFly no-wake lifecycle 保留
- V0.85 Modifyattack semantics 保留
- positive Enemy PetSkill coverage：158
- handled：134
- source missing：22
- source unregistered：2
- dispatcher gaps：0
- save schema：21


## V0.96 Combo member outer-loop consumption

V0.96 繼續沿 fixed `BATTLE_Command()` 掃共用戰鬥核心，修正合擊隊員被重複跑 `StatusSeq` 的生命週期差異。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`
- `case BATTLE_COM_COMBO`

原 C 在 leader 執行合擊時不是只留下標記，而是直接操作外層同一個 `i`：

```c
ComboId = EntryList[i].combo;
aAttackList[0] = EntryList[i].num;
i++;
for( ; EntryList[i].combo == ComboId && i < entrynum; i++ ){
    BATTLE_StatusSeq( EntryList[i].charaindex );
    ...
    aAttackList[k++] = EntryList[i].num;
}
i--;
BATTLE_Combo(...);
```

因此 leader 已經把後續 combo member 的 `BATTLE_StatusSeq()` 處理完，外層 `for` 下一次遞增後會直接跳到 combo 鏈後面的 Entry；那些 member 不會再進一次主迴圈 StatusSeq。

V0.95 web 的 `sourcePerformCombo()` 已經在 leader 階段對 follower 執行 `processBattleStatusTurn()`，也會設 `sourceComboConsumed=true`，
但外層 attack / guard / capture loop 原本是在再次跑完 `processBattleStatusTurn(actor)` 之後才檢查 `sourceComboConsumed`。
這會讓 combo follower 的毒、睡眠、石化、酒醉、混亂、WEAKEN/BARRIER lifecycle 等多推進一次。

V0.96 改為：

- `sourceDeadBattleEntry` / source C_WAIT 檢查後，立即檢查 `sourceComboConsumed`。
- 已被 leader 合擊流程吃掉的 Entry 在外層不再進第二次 `processBattleStatusTurn()`。
- leader 內的 `sourcePerformCombo()` 仍維持原本對每名 follower 執行一次 StatusSeq / CanMove / HP 檢查。
- surprise、dead Battle Entry、V0.95 ComboCheck dead-entry interrupt 規則不變。

### V0.96 regression

- `game.js` JavaScript syntax：PASS
- attack / guard / capture 三條 action loop：combo-consumed check 均位於 StatusSeq 前
- attack / guard 不再保留 StatusSeq 後的重複 consumed check
- `sourcePerformCombo()` follower StatusSeq 保留
- V0.95 dead Entry sort / ComboCheck semantics 保留
- V0.94 Enemy EscapeCheck int-average semantics 保留
- save schema：21


