## V0.97 BATTLE_PetLoyalCheck core / low-loyalty action override

V0.97 接回 fixed `BATTLE_PetLoyalCheck()` 的玩家出戰寵忠誠核心，並把它放回原 C 的 action lifecycle 時點。

固定來源：

- `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- `gmsv/src/battle/battle.c`：`BATTLE_PetLoyalCheck()` / `BATTLE_PetRandomSkill()` / `ComboCheck2()`
- `gmsv/src/battle/battle_event.c`：`BATTLE_LostEscape()`
- `gmsv/src/char/char.c`：`CHAR_initcharWorkInt()` 的 `CHAR_WORKFIXAI`
- `gmsv/src/char/pet.c`：捕獲時 7 格 PetSkill 原樣複製
- `gmsv/data/petskill.txt`

### FIXAI 最終仍是 int

來源先把忠誠算進 int：

```c
ai = ((hostLV * FIXCHARM * 1.10) / (petLV * modai) * 100);
if (ai > 100) ai = 100;
ai += CHAR_VARIABLEAI * 0.01;
...
CHAR_setWorkInt(index, CHAR_WORKFIXAI, ai);
```

`ai += double` 的 compound assignment 最後仍寫回 C `int`，所以 V0.97 把 `VARIABLEAI*0.01` 加完後再次向 0 截整數。
目前捕獲／任務寵的 VariableAI 初值仍是 0，但先把型別語意校正，避免未來接 VariableAI 後出現小數忠誠。

### 忠誠門檻保留 strict <

`Rand = RAND(1,100)`，來源是嚴格小於：

- FIXAI >= 80：正常。
- 70..79：roll < 10 才 TARGETRANDOM，也就是 9%。
- 60..69：roll < 20，19%。
- 50..59：roll < 35，34%。
- 40..49：roll < 50，49%。
- 30..39 / 20..29：roll < 70 時 RANDOMACT，69%；其餘正常。
- 10..19：roll < 80 打主人（79%），否則隨機打敵方（21%）。
- <10：roll < 60 打主人（59%），否則逃離本場（41%）。

不改成直覺的 10/20/35/50/70/80/60%。

### action lifecycle 時點

fixed `BATTLE_Battling()` 的順序是：

1. `BATTLE_StatusSeq()`
2. `BATTLE_CanMoveCheck()`
3. Surprise side 時跳過 LoyaltyCheck
4. `BATTLE_PetLoyalCheck()`
5. 讀取 COM，若是 COMBO 再跑 `ComboCheck2()`
6. 真正執行 action

因此 V0.97：

- 睡眠／石化等不能動時不做忠誠亂數。
- Surprise 首輪仍保留 V0.93 行為：confusion 可把原 NONE 改成 ATTACK，但 Surprise 分支本身不再做 LoyaltyCheck。
- 非 Surprise 的混亂寵：先產生混亂目標，再做 LoyaltyCheck；低忠誠仍可覆蓋混亂指定。
- Pet 是 combo leader 時：LoyaltyCheck 先跑。只要進非 NORMAL mode，就等價設 AIBAD，該 leader 的 `ComboCheck2()` 失敗；後面的 combo member 仍可在自己的 Entry 重新嘗試。
- 被前一位 combo leader 吃掉的 follower 維持 V0.96：不會再跑 LoyaltyCheck。

### 低忠誠 action

V0.97 已接：

- TARGETRANDOM：依原本 COM2 所在 side 用 `BATTLE_DefaultAttacker` 語意重抽。
- OWNERATTACK：出戰寵直接普通攻擊主人。
- ENEMYATTACK：隨機普通攻擊敵方。
- ESCAPE：等價 `BATTLE_LostEscape()`：
  - 寵物只退出本場，不刪除 pet。
  - `CHAR_DEFAULTPET=-1` 等價為取消 `activePetId`。
  - 魅力 -1，下限 0。
  - `battlePetOutIds` 標成真正 `BATTLE_Exit`，後續 Escape 平均等 Entry 規則會排除。
- RANDOMACT：
  - 保留 `RAND(0,6)` raw slot。
  - 保留 `BATTLE_PetRandomSkill()`「掃描 i、最後卻 PETSKILL_Use(iNum)」的舊索引語意。
  - skill 0 `PETSKILL_None`：待機。
  - skill 1 `PETSKILL_NormalAttack`：普通攻擊。
  - 來源 PetSkill array 不存在時，不猜 C 的越界記憶體讀取。
  - 忠犬 20／突擊 30／毒攻 60／酒醉攻 100 已辨識，但玩家側專用 guardian / charge / status lifecycle 尚未在 V0.97 偷換成普通攻擊；抽中時明確保留為 pending no-effect boundary，下一輪繼續接。

### 原版 NOACT bug 保留

`BATTLE_PetLoyalCheck()` 想用：

```c
if (CHAR_getCharHaveSkill(charaindex, i)) break;
```

檢查 Pet 是否有技能，但 `CHAR_getCharHaveSkill()` 回的是角色 haveSkill slot 指標，不是 `CHAR_getPetSkill()`。
合法 index 0 幾乎直接非 NULL，因此 `PETAI_MODE_NOACT` 在一般合法 Pet 上不可達。

V0.97 不把這個來源 bug「修正」成自創的無技能判斷。

### V0.97 regression

- `game.js` JavaScript syntax：PASS
- FIXAI VariableAI compound-assignment 後 int truncation
- 70/60/50/40 門檻維持 strict `<`
- 30/20 RANDOMACT 69% 邊界
- 10..19 OWNER 79% / ENEMY 21%
- <10 OWNER 59% / ESCAPE 41%
- Surprise branch 不做 LoyaltyCheck；confusion override 仍可行動
- 非 Surprise confusion Pet 會先 StatusSeq 再 LoyaltyCheck
- Pet combo leader AIBAD 可阻斷自己的 ComboCheck2
- combo-consumed follower 不重複 LoyaltyCheck
- LostEscape：退出本場、取消 active pet、charm -1、不刪 Pet
- random skill 0 / 1 已接
- random skill 20 / 30 / 60 / 100 明確 pending，不猜效果
- V0.96 combo follower StatusSeq consumption 保留
- V0.95 dead Entry sort / ComboCheck semantics 保留
- save schema：21


## V0.98 low-loyalty Pet RANDOMACT StatusChange 60 / 100

V0.98 接續 V0.97 的 `BATTLE_PetRandomSkill()`，先完成可捕獲寵實際可抽到的玩家側 `PETSKILL_StatusChange`：

- skill 60：毒攻擊，`毒 turn 3 攻%-30`
- skill 100：泥醉攻擊，`醉 turn 3 攻%-30`

固定來源：

- `gmsv/data/petskill.txt`
- `gmsv/src/battle/pet_skill.c`：`PETSKILL_StatusChange()`
- `gmsv/src/battle/battle_event.c`：`BATTLE_AttackSeq()` / `BATTLE_StatusAttackCheck()`
- fixed source commit 不變：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### 攻擊力不是最後傷害乘 0.7

來源：

```c
strdef = CHAR_getWorkInt(charaindex, CHAR_WORKFIXSTR);
strdef = (int)(strdef * fPer);
CHAR_setWorkInt(charaindex, CHAR_WORKATTACKPOWER,
    CHAR_getWorkInt(charaindex, CHAR_WORKFIXSTR) + strdef);
```

所以 -30% 是：

```
FIXSTR + trunc(FIXSTR * -0.30)
```

不是把最終傷害乘 0.7。

V0.98 直接從當輪 `petBattleView()` 的 FIX/compliance 等價 attack 起算，再做同一個 C int 截斷。

### Guardian 先換真正 defindex，再做狀態檢定

fixed `BATTLE_AttackSeq()`：

1. 原目標先做 dodge。
2. `BATTLE_GuardianCheck()` 成功時把 local `defindex` 改成 Guardian。
3. 傷害結算。
4. `BATTLE_StatusAttackCheck(attackindex, defindex, ...)` 使用已替換後的 `defindex`。

因此若敵方忠犬代擋，毒／酒醉必須套在真正代擋者。

Web 的 `resolveAttackToEnemyWithGuardian()` 已回傳 `actualTarget`，V0.98 直接用它做 status target。

### StatusAttackCheck 與酒醉 bug

沿用 V0.90 已校正的 int pipeline：

- base perOffset 30
- level difference × 2
- range ±40
- target resist / vital penalty
- 最終 int truncation
- cap 80
- `RAND(1,100) < per` 嚴格小於

一般 status 來源會先寫 `turn+1`。
酒醉再立刻：

```c
WORKDRUNK = WORKDRUNK / 2;
```

skill 100 的 turn=3 因此實際存成：

```
(3 + 1) / 2 = 2
```

維持 V0.76 之後已確認的酒醉 lifecycle bug。

### Counter 時點

狀態是在 `BATTLE_Attack()` 內、普通 Counter chain 前就寫入。

所以：

- 若將來抽到 sleep/stone 類 StatusChange，成功後目標已不能反擊。
- 目前 skill 60 poison / 100 drunk 不會禁止移動，仍可正常進 Counter。
- Guardian 代擋後由 actual Guardian 判斷是否能反擊。

### V0.98 regression

- `game.js` JavaScript syntax：PASS
- skill 60 / 100 從 RANDOMACT dispatcher 進玩家側 StatusChange
- attack = FIX attack + trunc(FIX attack * -30 / 100)
- Guardian actualTarget 接 status
- StatusAttackCheck 使用 Pet attacker level/luck 與 Enemy resist/stats
- poison turn 3 lifecycle
- drunk turn 3 -> stored 2
- status 在 Counter 前套用
- skill 20 Guardian / 30 Charge 仍 pending，不猜
- V0.97 BATTLE_PetLoyalCheck core 保留
- V0.96 combo follower lifecycle 保留
- save schema：21


## V0.99 low-loyalty Pet RANDOMACT ChargeAttack 30

V0.99 接回低忠誠 `BATTLE_PetRandomSkill()` 可抽到的 skill 30「突擊」。

固定來源：

- `gmsv/data/petskill.txt`：`突擊 ... PETSKILL_ChargeAttack,1 攻%+90,30`
- `gmsv/src/battle/pet_skill.c`：`PETSKILL_ChargeAttack()`
- `gmsv/src/battle/battle_event.c`：`BATTLE_Charge()`
- `gmsv/src/battle/battle.c`：`BATTLE_AllCharaCWaitSet()` / `BATTLE_IsCharge()` / LoyaltyCheck / direct attack
- `gmsv/src/battle/battle_command.c`：Charge 時 Pet menu off，但 preserved COM 可繼續
- fixed source commit：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### PETSKILL_ChargeAttack 寫入的狀態

skill 30：

```c
COM1 = BATTLE_COM_S_CHARGE;
COM2 = target;
LOW(COM3) = 1;
HIGH(COM3) = 90;
```

同一個 action 馬上進 `BATTLE_Charge()`：

- low > 0：low--，本回合 NoAction。
- low <= 0：以「釋放當輪」的 FIXSTR 做 `FIXSTR + trunc(FIXSTR*90/100)`，改成 CHARGE_OK 並攻擊。

因此 skill 30 是：

- 第一次抽到：1 → 0，蓄力，不攻擊。
- 下一次輪到且 command 沒被改掉：直接釋放 +90%。

不是「抽到後隔一個完整額外空白回合再打」。

### CHARGE 跨回合保留

`BATTLE_AllCharaCWaitSet()`：

```c
if (BATTLE_IsCharge(charaindex)) {
} else {
    COM1 = NONE;
}
MODE = C_WAIT;
```

而 `BATTLE_IsCharge()` 明確包含 `BATTLE_COM_S_CHARGE`。

所以 V0.99 用 battle-only `battlePetChargeStates` 保存 charge；每場開戰 reset，不寫進永久 save。

### LoyaltyCheck 對蓄力的特殊影響

LoyaltyCheck 發生在 `BATTLE_Charge()` 前。

- NORMAL：COM 不變，蓄力繼續。
- TARGETRANDOM：來源只覆寫 COM2，**不改 COM1**；所以仍是 CHARGE，只是目標重抽。
- RANDOMACT：`BATTLE_PetRandomSkill()` 覆寫 COM1，舊 charge 中斷。
- OWNERATTACK / ENEMYATTACK：改 COM1=ATTACK，舊 charge 中斷。
- ESCAPE：改 COM1=LOSTESCAPE，舊 charge 中斷並離場。
- CONFUSION 發作：StatusSeq 在 LoyaltyCheck 前先把 COM1 改成 ATTACK，charge 中斷。
- CanMove=false：主迴圈把 COM1 改 NONE，charge 中斷。

V0.99 全部照此順序。

### Charge 不能參與 Combo

ComboCheck 在 LoyaltyCheck 前，看的仍是本輪原 COM。

持續蓄力中的 Pet 是 `COM_S_CHARGE`，不是普通 `COM_ATTACK`，因此不能當 combo candidate。
V0.99 的 `sourceComboActorInfo()` 在 charge state 存在時會回 `normalAttack=false`。

第一次 RANDOMACT 當輪抽到 Charge 時，ComboCheck 已先跑過；若該 Pet 原本是 combo leader，Loyalty non-normal 會帶 AIBAD，等價原 `ComboCheck2()` 讓該 leader combo 失敗，再執行新 Charge command。

### 釋放不進普通 Counter

fixed direct-attack group：

```c
if (COM == BATTLE_COM_S_CHARGE_OK) {
    COM1 = BATTLE_COM_NONE;
}
BATTLE_Attack(...);
...
BATTLE_Counter(...);
```

而 `BATTLE_Counter()` 只允許原攻擊者目前 COM 是 ATTACK / NOGUARD。

所以 Charge release 雖走普通物理傷害與 Guardian／dodge，但原攻擊者 COM 已是 NONE，不能觸發後續普通 Counter chain。

V0.99 因此：

- 仍走 Enemy dodge / Guardian / damage。
- **不呼叫** `resolvePetEnemyCounterChain()`。

### V0.99 regression

- `game.js` JavaScript syntax：PASS
- battle-only charge runtime 每場 reset
- skill 30：first action low 1→0 no attack
- next preserved action：release +90%
- release 使用當輪 pet FIX/compliance attack
- invalid/dead old COM2：release 時才做 enemy-side fallback target
- TARGETRANDOM：只更新 charge target，charge 不取消
- RANDOMACT / OWNERATTACK / ENEMYATTACK / ESCAPE：取消舊 charge
- confusion 發作：StatusSeq 時點取消 charge
- status/CanMove skip：取消 charge
- charge state 不進 ComboCheck normalAttack
- CHARGE_OK release 不進普通 Counter
- V0.98 poison/drunk StatusChange 保留
- V0.97 LoyaltyCheck strict thresholds 保留
- V0.96 combo follower lifecycle 保留
- save schema：21


## V1.00 low-loyalty Pet RANDOMACT Guardian 20 core

V1.00 接回可捕獲寵低忠誠 RANDOMACT 的 skill 20「忠犬」核心。

固定來源：

- `gmsv/data/petskill.txt`：skill 20 `忠犬`，option `攻%-20 COM:攻击`
- `gmsv/src/battle/pet_skill.c`：`PETSKILL_Guardian()`
- `gmsv/src/battle/battle_event.c`：`BATTLE_GuardianCheck()` / `BATTLE_AttackSeq()` / `BATTLE_Attack()`
- `gmsv/src/battle/battle.c`：`BATTLE_PreCommandSeq()`
- fixed source commit：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### 忠犬只保護「本輪後半段」

每輪 `BATTLE_PreCommandSeq()` 都先：

```c
Entry[i].guardian = -1;
flg &= ~CHAR_BATTLEFLG_GUARDIAN;
```

skill 20 真正被 `PETSKILL_Use()` 選中後才：

- Pet 設 `CHAR_BATTLEFLG_GUARDIAN`
- 主人 Entry.guardian 指向 Pet slot
- Pet 自己以 `FIXSTR + trunc(FIXSTR * -20 / 100)` 攻擊

因此：

- 若 Enemy 比 Pet 快、先打主人：本輪忠犬尚未啟動，不能代擋。
- Pet 用完忠犬後，才保護同輪後續攻擊。
- 下一輪 PreCommandSeq 一開始自動清掉，必須再次使用才會再保護。

V1.00 用 battle-only `battlePlayerGuardianPetId` 對齊，不寫入 save。

### 代擋順序不是「直接把目標換寵物」

fixed `BATTLE_AttackSeq()`：

1. 原目標（主人）先做 `BATTLE_DuckCheck()`。
2. 主人成功閃避：直接 DODGE，忠犬不出場。
3. 主人沒閃掉：才 `BATTLE_GuardianCheck()`。
4. 代擋成功後，defindex 換成 Pet。
5. Critical、DamageCalc、GuardAdjust、屬性等全部以 Pet 自身能力結算。
6. 不再讓 Pet 做第二次 dodge。

V1.00 新增 `sourceInitialDodgeOnly()` + `resolveEnemyDirectAttackToPlayer()`，照相同順序執行。

### 忠犬成立條件

fixed `BATTLE_GuardianCheck()` 會拒絕：

- Guardian 已死亡。
- Guardian flag 不存在。
- sleep / confusion / paralysis / stone / barrier / dizzy 等無法守人的狀態。
- Guardian 就是攻擊者。
- 攻擊者使用投擲／遠距武器：
  - BOW
  - BOOMERANG
  - BREAKTHROW
  - BOUNDTHROW

玩家側目前 Guardian 與 Enemy 不可能是同一 actor；其餘已由現有 battle status / weaponType runtime 對應。

### 0 傷害的來源怪規則

`BATTLE_AttackSeq()`：

```c
if (*pDamage == 0) {
    iRet = BATTLE_RET_MISS;
    if (GuardianIndex != -1) {
        iRet = BATTLE_RET_NORMAL;
        *pDamage = 1;
    }
}
```

也就是忠犬一旦成功代擋，若計算傷害掉到 0，原 C 反而強制成 1 點 NORMAL。

V1.00 保留，不改成 MISS。

### Guardian 成功時不進普通 Counter chain

`BATTLE_Attack()` 在 Guardian 成功時最後固定：

```c
iRet = FALSE;
flg |= BCF_GUARDIAN;
```

外層普通 Counter loop 依 `ContFlg` 決定是否繼續，因此成功代擋不會再讓主人／忠犬接普通反擊。

Web 既有 `resolvePlayerEnemyCounterChain()` 已對 `primaryResult.guardian` 直接 return。

### V1.00 範圍邊界

這版先完成 **skill 20 本身 + 一般近戰 BATTLE_Attack 對主人** 的完整 Guardian substitution。

本輪另外確認固定原 C 有一個特殊舊 bug：

- `BATTLE_S_AttackDamage()` 也會呼叫 `BATTLE_AttackSeq()`，所以會用 Guardian 的防禦算 damage。
- 但它沒有像 `BATTLE_Attack()` 一樣把 caller 的 defindex 更新成 Guardian。
- 因此某些特殊 PetSkill 可能出現「用忠犬能力算傷害，血卻扣原目標」的怪行為。

V1.00 不把這兩條路徑錯誤合併；特殊 `BATTLE_S_AttackDamage` Guardian bug 留待下一版逐類對齊。

### V1.00 regression

- `game.js` JavaScript syntax：PASS
- skill 20 RANDOMACT dispatcher 已接
- Guardian attack = FIX attack + trunc(FIX attack * -20 / 100)
- 每輪 PreCommandSeq 等價清 Guardian mapping
- 主人 dodge 在 GuardianCheck 前
- Guardian 不做第二次 dodge
- Guardian damage/critical 用 Pet view
- 主人 GUARD 不會套到代擋 Pet
- BOW / BOOMERANG / BREAKTHROW / BOUNDTHROW 不可代擋
- Guardian damage 0 強制 1
- Guardian 成功不進普通 Counter
- V0.99 Charge 30 保留
- V0.98 StatusChange 60 / 100 保留
- V0.97 LoyaltyCheck core 保留
- save schema：21


## V1.01 BATTLE_S_AttackDamage Guardian defindex bug

V1.01 專門對齊 fixed C 的 `BATTLE_S_AttackDamage()` 忠犬 bug，避免把 V1.00 一般 `BATTLE_Attack()` 的正常代擋邏輯錯套到所有特殊技。

固定來源：

- `gmsv/src/battle/battle_event.c`
  - `BATTLE_AttackSeq()`
  - `BATTLE_Attack()`
  - `BATTLE_S_AttackDamage()`
- `gmsv/src/battle/battle.c` 對 `BATTLE_S_AttackDamage()` 的 command dispatch
- fixed commit：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### 一般 BATTLE_Attack 與特殊 BATTLE_S_AttackDamage 不一樣

正常 `BATTLE_Attack()` 在 `BATTLE_AttackSeq()` 返回後明確：

```c
if (Guardian >= 0)
    defindex = BATTLE_No2Index(battleindex, Guardian);
BATTLE_DamageSub(..., defindex, ...);
```

所以 V1.00 正常把傷害改扣忠犬。

但 `BATTLE_S_AttackDamage()`：

```c
iWork = BATTLE_AttackSeq(attackindex, defindex, &damage, &Guardian, skill_type);
...
BATTLE_DamageSub(attackindex, defindex, &damage, ...);
```

中間沒有把 caller 的 `defindex` 更新為 Guardian。

`BATTLE_AttackSeq()` 的 `defindex` 又只是傳值 local，所以來源實際流程是：

1. 原主人先做 DuckCheck。
2. 沒閃掉時 GuardianCheck 可以成功。
3. AttackSeq local defindex 換成忠犬。
4. Critical / DamageCalc / GuardAdjust 等以忠犬能力計算。
5. 若傷害算成 0，因 GuardianIndex 存在仍強制成 NORMAL / 1。
6. 返回 `BATTLE_S_AttackDamage()` 後，caller defindex 還是主人。
7. `BATTLE_DamageSub()` 與該技能後續效果仍落在原主人。

這是 fixed source 可直接證明的老 bug，不做合理化修正。

### V1.01 已切換的現有 handler

明確 dispatch 到 `BATTLE_S_AttackDamage()` 的現有 web handler：

- BattleTimid / 2BattleTimid
- Lighttakeed
- DamageToHp / DamageToHp2
- MpDamage
- ToothCrushe
- Modifyattack / Mdfyattack
- BattleTearDamage
- Sonic 主段與 SONIC2 貫穿段
- Regret 主段與 REGRET2 貫穿段

玩家目標改走 `resolveEnemyAttackSeqBugToPlayer()` / `enemyAttackSeqBugTargetResult()`。

原目標本來就是 Pet 時不經「主人 Entry 的 Guardian」替換，維持原 Pet path。

### 後續效果仍使用原 target

因 caller defindex 未更新：

- DamageToHp 吸血量依實際對原 target 的 damage。
- MpDamage 的 MP 扣除仍以原 Player 判定。
- Tear 的 missing HP bonus 仍讀原 target。
- Modifyattack 的目標屬性 bonus 仍讀原 target。
- Timid 的擊退／退出判定仍落原 target。
- Sonic / Regret 的原 primary / secondary target 結構不變。

### V1.01 regression

- `game.js` JavaScript syntax：PASS
- V1.00 一般 `BATTLE_Attack` Guardian 真正代擋不變
- `BATTLE_S_AttackDamage`：主人先 dodge
- Guardian 成功後 critical / damage 使用 Pet view
- Guardian 成功後主人 Guard 不套到 damage
- Guardian calc damage 0 強制 1
- HP 仍扣原 Player
- skill 後續效果仍落原 Player
- throw weapon 仍阻止 GuardianCheck
- Sonic primary + through 兩段都使用同一 source bug pipeline
- Regret primary + through 玩家段都使用同一 source bug pipeline
- V0.99 Charge / V0.98 StatusChange / V0.97 Loyalty core 保留
- save schema：21


## V1.02 GBreak / GBreak2 / FallGround Guardian local-defindex semantics

V1.02 繼續逐函式掃 fixed `BATTLE_AttackSeq()` 呼叫者，補齊 `BATTLE_S_GBreak()`、`BATTLE_S_GBreak2()`、`BATTLE_S_FallGround()` 的忠犬 local-defindex 語意。固定來源仍是 `gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

fixed `BATTLE_DuckCheck()` 對 `COM_GUARD` 直接 return FALSE，所以防禦中的原主人本來就不做一般閃避；V1.02 不改這點。

三個專用函式都以 `Guardian=-1` 呼叫 `BATTLE_AttackSeq()`，但 caller 沒有像正常 `BATTLE_Attack()` 那樣把自己的 `defindex` 更新成 Guardian。因此 Guardian 成功時，AttackSeq local defindex 會用忠犬做 critical / damage 計算，最後 `BATTLE_DamageSub()` 仍作用在原主人。

GBreak 只有原 caller defindex 自己是 GUARD 時才真的扣血，且 opt=GBREAK 跳過普通 GuardAdjust。V1.02 因此保留「原主人 GUARD → 不 dodge」，但 damage 可由忠犬 stats 計算、HP 仍扣主人。

GBreak2 的 ×1.3／×0.7 判定在 GuardianCheck 之後：沒有 Guardian 時，原主人 GUARD ×1.3，非 GUARD ×0.7；Guardian 成功時 local defindex 已換成 skill20 忠犬，而忠犬 command 是 GUARDIAN_ATTACK 不是 GUARD，因此改走 ×0.7，最後仍扣原主人。GBreak2 本身不再額外套普通 GuardAdjust。

FallGround 同樣保留 calc-only Guardian bug；後面的落馬條件仍以 caller 原主人為 target，因此忠犬不會把落馬效果轉移到自己。

本輪也額外確認 `BATTLE_Counter()` 使用 `Guardian=-2`，而 AttackSeq 只有 `*pGuardian==-1` 才呼叫 GuardianCheck，所以反擊刻意不允許忠犬介入，不做修改。

### V1.02 regression

- `game.js` syntax PASS
- GuardBreak 非 GUARD 仍 0 damage
- GuardBreak GUARD 不 dodge、無普通 GuardAdjust
- GuardBreak Guardian calc-only / HP 原主人
- GuardBreak2 無 Guardian：GUARD ×1.3、非 GUARD ×0.7
- GuardBreak2 有 Guardian：local Guardian 非 GUARD → ×0.7，HP 原主人
- FallGround Guardian calc-only，落馬 target 仍原主人
- Counter Guardian=-2 不改
- V1.01 AttackDamage bug、V1.00 normal Guardian substitution、V0.99 Charge、V0.98 StatusChange、V0.97 Loyalty 保留
- save schema 21


## V1.03 Firekill / BattleModel real Guardian substitution

V1.03 繼續按 fixed `BATTLE_AttackSeq()` caller 分類，這次補的是「來源會真的把受傷者改成 Guardian」的專用路徑。

固定來源：

- `BATTLE_Attack_FIREKILL()`
- `BATTLE_BattleModel_ATTACK()`
- `battle.c` 的 `BATTLE_COM_S_FIREKILL` caller
- fixed commit：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### Firekill：物理段改忠犬，火魔法仍打原 target

`BATTLE_Attack_FIREKILL()`：

```c
iWork = BATTLE_AttackSeq(..., &Guardian, ...);
if (Guardian >= 0)
    defindex = BATTLE_No2Index(battleindex, Guardian);
...
BATTLE_DamageSub_FIREKILL(attackindex, defindex, ...);
```

所以物理段忠犬成立時，HP／死亡／喚醒等都作用在忠犬。

但 caller 隨後仍用原本的 `defNo`：

```c
BATTLE_Attack_FIREKILL(battleindex, attackNo, defNo);
BATTLE_MultiAttMagic_Fire(battleindex, attackNo, defNo, 2, 200);
```

因此原版可以出現：

- 火線獵殺物理段被忠犬真正擋下。
- 接著固定 200 火魔法仍命中原主人。

V1.03 保留這個分段 target，不把火魔法錯轉給忠犬。

### BattleModel：狀態也跟著 Guardian

`BATTLE_BattleModel_ATTACK()` 在 physical type 明確：

```c
iDefState = BATTLE_AttackSeq(..., &iGuardian, -1);
if (iType & 0x00000004) {
    if (BATTLE_TargetCheck(battleindex, iGuardian))
        if (iGuardian >= 0)
            iDefindex = BATTLE_No2Index(battleindex, iGuardian);
}
```

來源註解也直接寫：「在這之後的 iDefindex 才是真正會受傷的目標」。

後面這些都使用 `iDefindex`：

- `BATTLE_DamageSub`
- DamageWakeUp
- death / ultimate
- `BATTLE_StatusAttackCheck`
- `StatusTbl[iEffect] = iTurn`
- 石化／魔障等成功後清 COM1

目前有實際 Enemy runtime 的 BattleModel 為：

- 590 / 655「虎虎生威」：5 個物理 AttackObject + 石化
- 689「Q雷分身術」：5 個物理 AttackObject + 魔障

沒有需要額外猜測的 drunk parser。

V1.03 因此把每個 Player AttackObject 改走正常 real-Guardian substitution；若忠犬代擋：

- damage 扣 Pet。
- status chance 用 Pet level / resist / stats。
- stone / barrier 落在 Pet。
- 主人的 `playerGuardingActive` 不會因 Pet 中狀態而被錯清。
- Guardian 若被前一個 AttackObject 打死，後續 AttackObject 會自然回到 Player。

### V1.03 regression

- `game.js` syntax PASS
- Firekill physical：Player dodge → GuardianCheck → actual Pet damage
- Firekill magic：仍鎖原 chosen target
- Firekill Guardian 死亡不把 magic target 改成 Pet
- BattleModel physical Player target 支援 real Guardian substitution
- BattleModel status target = actual Guardian target
- BattleModel Guardian death 後下一物件重新判斷
- BattleModel Pet 中 stone/barrier 不清 Player GUARD
- V1.02 calc-only GBreak/FallGround、V1.01 AttackDamage bug、V1.00 normal Guardian 保留
- save schema 21


## V1.04 low-loyalty Pet NormalGuard 2

V1.04 直接從正式捕獲資料 `data/generated/stoneage_general_lv1_pets.json`（166 species / 169 wild Lv1 variants）統計實際 PetSkill。
169 個 variant 共只使用 19 個 PetSkill ID；目前玩家側 RANDOMACT 最大未接缺口是 **skill 2「防禦」**，出現在 **151 / 169** 個 variant。

fixed source：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### 原 PETSKILL_NormalGuard

`gmsv/src/battle/pet_skill.c` 只做：

```c
COM1 = BATTLE_COM_GUARD;
COM2 = toindex;
MODE = C_OK;
```

因此 V1.04 新增 battle-only `battlePetGuardIds`：

- Pet 真正輪到低忠誠 RANDOMACT 並抽中 skill 2 後才開始防禦。
- 同輪較早打到 Pet 的 Enemy 不受影響。
- 同輪後續物理攻擊會讀到 Pet 自己的 GUARD。
- fixed `BATTLE_AllCharaCWaitSet()` 只保留 Charge，所以下一輪開頭清除 NormalGuard。
- 不寫入永久 save。

### COM_GUARD 與實際減傷分開

fixed `BATTLE_DuckCheck()` 只要看到 `COM_GUARD` 就直接不閃避。
但 AttackSeq 的 `BATTLE_GuardAdjust()` 還要求 `WORKCONFUSION<=0`。

因此若 Pet 先 GUARD 後又混亂：

- COM 仍是 GUARD，因此不能 dodge。
- 不吃 GuardAdjust。
- COM 不是 ATTACK / NOGUARD，因此不能進普通 Counter。

V1.04 以 `sourcePlayerPetGuardCommand()` 與 `sourcePlayerPetGuardAdjust()` 分開模擬。

### 共用 Pet-target 物理入口

已接入：

- `enemyAttackPetResult()`
- `enemySkillTargetResult()`
- `enemyAttackSeqBugTargetResult()`

所以普通攻擊、連續攻擊、狀態攻擊、狂暴、回旋、追跡、Firekill 物理段、BattleModel 物理 object 等現有共用路徑都能讀到 Pet GUARD。

### GBreak / GBreak2

`BATTLE_S_GBreak()`：

- Pet 必須是有效 GUARD 才保留傷害。
- COM_GUARD 不 dodge。
- opt=GBREAK 跳過普通 GuardAdjust，因此破防命中時不再吃 1/2 防禦減傷。

`BATTLE_S_GBreak2()`：

- multiplier 直接看 local Pet 的 `COM_GUARD`。
- Pet GUARD -> ×1.3。
- Pet 非 GUARD -> ×0.7。
- opt=GBREAK2 本身不再進普通 GuardAdjust。

### 禁行動狀態覆寫 command

fixed 普通 StatusAttack、`BATTLE_MultiStatusChange()`、BattleModel 都會在成功施加：

- paralysis
- sleep
- stone
- barrier

後寫 `COM1=NONE`。

因此 V1.04 在 `battleStatusApply()` / `battleStatusApplyRaw()` 成功時同步清除 Pet 的：

- NormalGuard battle state
- Charge battle state

只限上述四種；poison / confusion / drunk / deepPoison / nocast 不清 command。

### V1.04 regression

- `game.js` syntax PASS
- battle-only Pet Guard 每場 reset
- 每新 round 清 GUARD
- low-loyalty RANDOMACT skill 2 dispatcher
- ordinary Pet target：GUARD 禁 dodge + GuardAdjust
- confused GUARD：禁 dodge但不 GuardAdjust
- Pet COM_GUARD 不進 Counter
- GBreak Pet GUARD 專用路徑
- GBreak2 Pet GUARD ×1.3 / 非 GUARD ×0.7
- Firekill Pet physical 讀 Pet GUARD
- paralysis/sleep/stone/barrier 成功時清 Guard / Charge
- V1.03 Firekill/BattleModel true Guardian substitution 保留
- V1.02 / V1.01 Guardian 舊 bug 語意保留
- save schema 21


## V1.05 low-loyalty Pet ContinuationAttack 10 / Mighty 40

V1.05 接續 169 個 wild Lv1 variant 的實際未接清單：

- skill 10「連續攻擊」：1 個 variant（卡梅蘭恩）
- skill 40「一擊必殺」：3 個 variant（多薩金格／奧卡洛斯／沙瓦克）

fixed source 不變：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### skill 10 ContinuationAttack

`PETSKILL_ContinuationAttack()`：

- `COM1=BATTLE_COM_S_RENZOKU`
- `LOW(COM3)=N`

`battle.c`：

```c
attack_max = LOW(COM3);
gDamageDiv = attack_max;
```

而 `BATTLE_TargetListSet()` 對 non-BOW 會先把整個 `aDefList` 填成原 COM2。
目前捕獲 Pet 沒有 CHAR_ARM，因此玩家寵這條固定走 non-BOW：

- skill 10 的 option=2 -> 2 段。
- 每段普通 AttackSeq 傷害後再除以 2，正傷害最低 1。
- 原目標仍活著時兩段都打原目標。
- 原目標中途倒下，下一段的 TargetAdjust 改抓同 enemy side 其他存活目標。
- Guardian / dodge / guard 每一段各自重跑。
- 所有段數完成後才用最後一次 `ContFlg` 進普通 Counter chain，不是每段反擊。

### skill 40 Mighty

`PETSKILL_Mighty()` option：

```
倍2 回避30
```

source 在真正 attack 前：

```c
gBattleDamageModyfy = LOW(COM3) * 0.01; // 2.00
gBattleDuckModyfy = HIGH(COM3);          // +30
```

因此 V1.05：

- 最終物理 damage multiplier = ×2。
- 目標 DuckCheck 額外 +30。
- 仍走普通 BATTLE_Attack 的 Guardian / guard / critical / Counter lifecycle。
- 不把「回避30」誤當成攻擊者自己的回避。

### V1.05 regression

- `game.js` syntax PASS
- skill 10 dispatcher
- skill 10 option N clamp 1..10
- skill 10 每段 `damageDivisor=N`
- non-BOW target list 保留原目標直到失效
- skill 10 只在末段結果進 Counter
- skill 40 dispatcher
- skill 40 damage ×2 / target dodge +30
- skill 40 走 ordinary Guardian / Counter
- V1.04 NormalGuard 保留
- save schema 21


## V1.06 low-loyalty Pet PowerBalance 50 / 51

V1.06 接入實際 wild Lv1 捕獲清單中的：

- 50 背水之戰其之1：`攻%+25 防%-35`
- 51 背水之戰其之2：`攻%+45 防%-55`

fixed `PETSKILL_PowerBalance()` 不是最終 damage multiplier，而是直接重寫：

```c
WORKATTACKPOWER = FIXSTR + (int)(FIXSTR * attackPercent);
WORKDEFENCEPOWER = FIXTOUGH + (int)(FIXTOUGH * defensePercent);
```

所以 V1.06 新增 battle-only `battlePetPowerMods`：

- skill 發動時以當輪 Pet battle FIX 等價 attack/defense 為基底。
- 百分比乘積按 C int 向 0 截斷。
- 修改後的 attack 用於本次普通 BATTLE_Attack。
- 修改後的 defense 會保留到本輪後續 Enemy 攻擊。
- Counter / counter-counter 再讀 `petBattleView()` 時也沿用修改後攻防。
- `fixedTough` / `fixedDex` 不被 PowerBalance 改寫。
- 下一 round PreCommand/compliance 等價重建時清掉 power override。
- 不寫入 save。

V1.06 regression：

- game.js syntax PASS
- 50 / 51 共用 `PETSKILL_PowerBalance` dispatcher
- signed attack / defense percent from source option
- C-int truncation before add-back
- attack + defense persist for remainder of current round
- counter chain uses modified WORK values
- next round clears to FIX-equivalent values
- V1.05 Continuation/Mighty 保留
- V1.04 NormalGuard 保留
- save schema 21


## V1.07 low-loyalty Pet GuardBreak 3

V1.07 接回 wild Lv1 實際可捕獲清單中的 skill 3「破除防禦」（布伊比）。

fixed `PETSKILL_GuardBreak()` 設 `COM_S_GBREAK`；`BATTLE_S_GBreak()` 有兩條很不直覺的來源行為。

### 原目標沒有 GUARD

source 並不是一開始就 NoAction：

1. 先完整呼叫 `BATTLE_AttackSeq()`。
2. 原 defindex 若不是有效 `COM_GUARD && !CONFUSION`：
   `damage=0; iWork=MISS`。
3. `BATTLE_S_GBreak()` 對 MISS 回 `TRUE`。
4. battle.c 外層因此仍用 `ContFlg=TRUE` 進普通 Counter loop。

所以低忠誠 RANDOMACT 拿破防打普通攻擊中的 Enemy 時：

- Pet 本身造成 0。
- AttackSeq 的 dodge / critical / Guardian 等 RNG 仍先被消耗。
- Enemy 若具備反擊條件，仍可能反擊 Pet。

V1.07 保留這個怪行為。

### 原目標正在 GUARD

`BATTLE_DuckCheck()` 對 COM_GUARD 直接 FALSE。
而 opt=GBREAK 在 AttackSeq 中明確跳過普通 `BATTLE_GuardAdjust()`，所以破防命中不再吃防禦減傷。

### Enemy Guardian 的 calc-only bug

`BATTLE_S_GBreak()` 傳 `Guardian=-1`，所以 AttackSeq 可以找到 Enemy Guardian；
但 caller 沒有像 `BATTLE_Attack()` 一樣更新自己的 defindex。

因此 Guardian 成功時：

- critical / DamageCalc 用 Guardian。
- 0 damage 可因 GuardianIndex 被強制成 1。
- 最後 DamageSub 仍扣原本正在 GUARD 的 Enemy。
- 原 GUARD target 使函式回 FALSE，因此不進 Counter。

V1.07 regression：

- game.js syntax PASS
- skill 3 dispatcher
- non-GUARD target：AttackSeq RNG + forced 0/MISS
- non-GUARD target：ContFlg TRUE 可進 Counter
- GUARD target：no dodge
- GUARD target：GBREAK skips GuardAdjust
- Enemy Guardian：calc-only / HP stays original target
- GUARD path no ordinary Counter
- V1.06 PowerBalance 保留
- save schema 21


## V1.08 low-loyalty Pet NoGuard 150

V1.08 接回 wild Lv1 清單中的 skill 150「不防守戰法」（沙瓦克）。

source option：`回避%+30 反击%+50 会心%+20`。

固定原 C 中真正生效的是：

- `BATTLE_DuckCheck()`：defender COM=NOGUARD 時 + high(COM3) 回避。
- `BATTLE_CounterCheckPet()`：attacker COM=NOGUARD 時 + (low(COM3)>>8) 反擊率。
- `BATTLE_Counter()`：明確允許 COM_ATTACK 或 COM_S_NOGUARD 當反擊者。

「會心 +20」則是來源死資料：唯一讀取該 low-byte 的 `BATTLE_CriticalCheckPet()` 整段被 `#if 0`，現行 `BATTLE_CriticalCheck()` 對 Pet 也改走 `BATTLE_CriticalCheckPlayer()`，後者不讀 NoGuard critical bonus。

因此 V1.08：

- 回避 +30 生效。
- 反擊 +50 生效。
- 會心 +20 保留解析與 log，但不套入 critical。
- 技能本身 NoAction。
- 從 Pet 真正使用後維持本輪剩餘時間。
- 下一 round 清除。
- paralysis/sleep/stone/barrier 覆寫 COM 時立即清除。
- 不寫 save。

V1.08 regression：

- game.js syntax PASS
- NoGuard battle state reset
- petBattleView duckBonus / counterBonus
- existing sourceBattleDuckTotal consumes +30
- existing battleCounterChance consumes +50
- critical +20 intentionally ignored
- command-clearing status removes NoGuard
- next round removes NoGuard
- V1.07 GuardBreak retained
- save schema 21


## V1.09 low-loyalty Pet EarthRound 120 + direct-release Counter correction

V1.09 接回 wild Lv1 skill 120「地球一周」(`PETSKILL_EarthRound`, `攻%+90`)。

固定來源：`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### StatusChange 清單先校正

正式 runtime 已確認 61 猛毒、80 石化、90 混亂、110 催眠全部是 `PETSKILL_StatusChange`。V0.98 之後 player RANDOMACT 已按 handler 共用 dispatch，parser 也已支援 poison / stone / confusion / sleep，因此四筆已實際覆蓋，不另複製四套技能。

### EarthRound lifecycle

`PETSKILL_EarthRound()` 寫 EARTHROUND1 / COM2 / COM3；skill 120 的 COM3 為 90。第一回合 `BATTLE_EarthRoundHide()` 把 `CHAR_ISATTACKED=0`，並把 COM1 改為 EARTHROUND0，所以 Pet 不攻擊且 `BATTLE_TargetCheck()` 不能選中它。

V1.09 用 `battlePetEarthRoundStates` 保存 command / target / WORK-FIX snapshot，用獨立 `battlePetHiddenIds` 保存 CHAR_ISATTACKED 語意。Enemy 即使排序前已選到 Pet，真正行動時也會重新驗證 hidden 狀態並 fallback target。

EARTHROUND0 被 `BATTLE_IsCharge()` 保留到下一輪；`BATTLE_PreCommandSeq()` 對它直接 continue，所以 release round 不重新 complianceParameter、TurnParam、AttReverse。Web 因此沿用隱身前一輪的 attack / defense / fixedDex / quick base / fixedTough / element snapshot。

### 傷害倍率

來源：
```c
gBattleDamageModyfy = 1.0 + 0.01 * COM3;
```
COM3=90，因此實際最終傷害倍率是 **×1.90**，不是文案近似的 2.00。

### Loyalty 覆寫

EARTHROUND0 下一輪仍跑 `BATTLE_PetLoyalCheck()`：
- NORMAL：現身釋放。
- TARGETRANDOM：只改 COM2，EarthRound 繼續。
- RANDOMACT / OWNERATTACK / ENEMYATTACK / confusion / blocking status：覆寫或清除 COM1，EarthRound command 中斷。
- ESCAPE：離場。

重要：EarthRound command 中斷不等於立即 `CHAR_ISATTACKED=1`。原 C 只有真正進 direct-attack 區才恢復這個旗標。因此被改成 GUARD / NONE / NOGUARD / CHARGE 等非直接動作時，hidden flag 可繼續殘留；之後普通攻擊、狀態攻擊、忠犬攻擊、多段、Mighty、PowerBalance、Charge release、EarthRound release 等 direct path 才重新現身。

### Combo

EARTHROUND0 不是 COM_ATTACK，因此 active EarthRound command 不可成為 Combo candidate。若 command 已被覆寫而 hidden flag 因來源 bug 殘留，後續 COM_ATTACK 仍照來源可進 Combo；`BATTLE_Combo()` 本身沒有恢復 CHAR_ISATTACKED，本版不自行修漂亮。

### Charge / EarthRound 第一層 Counter

重新核對 direct-attack 後的 fixed Counter loop：
k=0 的反擊者其實是原 defender；k=1 才輪到原 attacker。

CHARGE_OK / EARTHROUND0 在 `BATTLE_Attack()` 前把原 Pet COM1 改 NONE，所以：
- defender 仍可做第一下 Counter；
- 下一層 Pet counter-counter 因 COM1=NONE 失敗。

V0.99「完全不進 Counter」少了第一層。V1.09 把 Charge release 與 EarthRound release 都改成最多執行一層 defender Counter。

### V1.09 regression
- game.js syntax PASS
- battle-only EarthRound state + hidden flag reset
- skill 120 RANDOMACT dispatcher
- EARTHROUND1 no damage + untargetable
- action-time Enemy target revalidation
- EARTHROUND0 cross-round preservation
- release uses frozen WORK/FIX snapshot
- final damage ×1.90
- TARGETRANDOM preserves command, changes target only
- non-direct override may retain hidden flag
- direct attack restores targetability
- active EarthRound excluded from Combo
- Charge release first Counter only
- EarthRound release first Counter only
- 61 / 80 / 90 / 110 confirmed covered by common StatusChange
- V1.08 and earlier low-loyalty handlers retained
- save schema 21


## V1.10 low-loyalty Pet FallGround 210

V1.10 接回正式 wild Lv1 清單中最後一個「runtime 有正式 handler、player RANDOMACT 尚未接」的技能：

- 210 落馬術
- `PETSKILL_FallGround`
- option：`攻%-30`

fixed build 同時開啟：
- `_PSKILL_FALLGROUND`
- `_ENEMY_FALLGROUND`

來源固定：
`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`。

### 攻擊力

`PETSKILL_FallGround()`：

```c
fPer = attackPercent / 100;
strdef = (int)(FIXSTR * fPer);
WORKATTACKPOWER = FIXSTR + strdef;
```

skill 210 為 -30%，所以 V1.10：

```
attack = FIXSTR + trunc(FIXSTR * -0.30)
```

不是最終 damage ×0.7。

### Guardian caller-defindex bug

`BATTLE_S_FallGround()`：

```c
Guardian = -1;
iWork = BATTLE_AttackSeq(attackindex, defindex, &damage, &Guardian, FALLRIDE);
BATTLE_DamageSub(attackindex, defindex, ...);
```

和 V1.02 的 Enemy->Player FallGround 一樣，caller 沒有把 defindex 更新成 Guardian。

因此 player Pet 攻擊 Enemy 時若敵方忠犬成立：

1. 原 target 先做 DuckCheck。
2. AttackSeq local defindex 改成 Guardian。
3. critical / defense / element / guard adjustment 用 Guardian 計算。
4. Guardian 若讓 damage 算到 0，AttackSeq 仍依 GuardianIndex 強制 NORMAL / 1。
5. 回到 BATTLE_S_FallGround 後，HP 仍扣原 target。
6. 落馬判定也仍讀原 target。

V1.10 以 `guardianCalcOnly` 保留，不把 HP 錯扣到 Guardian。

### 落馬 RNG

固定來源：

```c
if (damage > 0 && react == 0) {
    fallflg = RAND(0,100);
    if (fallflg > 50) { ... }
}
```

沒有裝備抗性時成功門檻是 50/101，不是整數 50%。

V1.10 在有效正傷害後仍消耗這次 `RAND(0,100)`，即使目前 target 沒有 ride runtime，以維持 RNG 次序。

### _ENEMY_FALLGROUND 現況

原 C 對 Enemy target 只有：

```c
if (CHAR_RIDEPET > 0) {
    CHAR_RIDEPET = -1;
    STR *= 0.7;
    TOUGH *= 0.7;
    VITAL *= 0.7;
    complianceParameter();
}
```

目前 `makeEnemyUnit()` 與 generated encounter runtime 沒有任何可證明的 `CHAR_RIDEPET` 對應欄位。

因此 V1.10：
- 不替野怪虛構騎乘寵。
- 不無條件把 Enemy 三能力 ×0.7。
- 只保留一個未來若 source-derived `ridePetId>0` 真正出現才可達的分支。

### CHAR_ISATTACKED

FallGround 是 battle.c 的獨立 special case，不經一般 direct-attack 群組的：
`CHAR_setFlg(charaindex, CHAR_ISATTACKED, 1)`。

所以若 Pet 因 V1.09 EarthRound command 被覆寫而留下 hidden flag，接著 RANDOMACT 抽到 FallGround，本技能不擅自讓它現身。

### Counter

`BATTLE_COM_S_FALLRIDE` 呼叫 `BATTLE_S_FallGround()` 後直接 break，不進普通 direct-attack Counter loop。

V1.10 不呼叫 `resolvePetEnemyCounterChain()`。

### V1.10 regression
- game.js syntax PASS
- 210 RANDOMACT dispatcher
- FIXSTR + trunc(FIXSTR * -30%)
- original target DuckCheck
- Enemy Guardian calc-only bug
- HP / fall target remains original Enemy
- positive damage consumes RAND(0,100)
- >50 threshold = 50/101
- no fabricated Enemy mount state
- no ordinary Counter chain
- no forced CHAR_ISATTACKED restore
- V1.09 EarthRound / Charge first-counter correction retained
- save schema 21

## V1.11 fixed petskill2.txt runtime + player Pet GuardBreak2 543

V1.11 修正 PetSkill runtime 的根資料源。fixed version.h 開啟 _PETSKILL2_TXT、_CFREE_petskill、_PETSKILL_OPTIMUM；configfile.c 因此讀 setup.cf 的 petskillfile2=./data/petskill2.txt，而不是舊的 petskill.txt。

舊 stoneage_petskill_runtime.json 只來自 petskill.txt 56 筆。V1.11 改為 fixed petskill2.txt 全表：282 筆、ID 0～841、無重複 ID，並保留 name/description/function/option/free/kind/field/target/useType/cost/illegal。

illegal 依 fixed loader 規則由 raw line 是否以 ASCII E 開頭決定；PETSKILL_Use 對 CHAR_TYPEPET 遇 PETSKILL_ILLEGAL 直接 return FALSE。player RANDOMACT 已同步。

fixed petskill2.txt 明確記錄 541=PETSKILL_WildViolentAttack、542=PETSKILL_SpeedyAttack、543=PETSKILL_GuardBreak2、573=PETSKILL_Sacrifice。wild 戈登爾頓 tempNo 768 / Enemy 1601 的 543 因此確實是破除防禦之2。

PETSKILL_GuardBreak2 本身只設 BATTLE_COM_S_GBREAK2 / target / C_OK。真正效果在 BATTLE_AttackSeq：GuardianCheck 後的 local defindex 若為 GUARD，damage ×1.3，否則 ×0.7；BATTLE_S_GBreak2 caller 又沒有把 defindex 更新成 Guardian，因此忠犬可參與 local 傷害計算，但最後 HP 仍扣原 target。

V1.11 的 sourcePerformPetGuardBreak2Skill 保留：原 target 先做 DuckCheck；GUARD 時不可 dodge；Guardian substitution 後才決定 ×1.3/×0.7；Guardian calc-only；HP 原 target；專用 case 不進普通 Counter；也不強制清除 V1.09 EarthRound 殘留 hidden flag。

Regression: game.js syntax PASS；runtime 282 unique IDs；min 0 / max 841；543 handler 正確；illegal gate 正確；GuardBreak2 dispatcher / local multiplier / calc-only / no-Counter 全部靜態檢查通過；save schema 21。

## V1.12 BATTLE_AttackSeq Guardian caller audit complete

V1.12 從 V1.02 指定的方向把 fixed `BATTLE_AttackSeq()` caller 全部掃完。固定來源仍是：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

fixed `gmsv/src/battle/battle_event.c` 共有 13 個實際 caller（不含 `BATTLE_AttackSeq` 自身）：

| caller | Guardian seed / caller 行為 | fixed 語意 | Web 狀態 |
| --- | --- | --- | --- |
| `BATTLE_Attack` | `Guardian=-1`，caller 會把 `defindex` 換成 Guardian | 真正代擋 | V1.00 |
| `BATTLE_Attack_FIREKILL` | `Guardian=-1`，物理段改 `defindex` | 物理真正代擋；後續固定火魔法仍用原 `defNo` | V1.03 |
| `BATTLE_Counter` | `Guardian=-2` | AttackSeq 不呼叫 GuardianCheck | 已確認，不改 |
| `BATTLE_S_GBreak` | `Guardian=-1`，caller 不改 `defindex` | calc-only；HP 原 target | V1.02 / V1.07 player |
| `BATTLE_S_GBreak2` | `Guardian=-1`，caller 不改 `defindex` | calc-only；×1.3/×0.7 看 local defindex | V1.02 / V1.11 player |
| `BATTLE_Combo` | 每段先設 `Guardian=-2` | 合擊明確不允許忠犬介入 | V0.74 |
| `BATTLE_S_FallGround` | `Guardian=-1`，caller 不改 `defindex` | calc-only；HP / 落馬 target 原目標 | V1.02 / V1.10 player |
| `BATTLE_S_Explode` | `Guardian=-1`，caller 不改 `defindex` | 若編譯會是 calc-only | fixed `_PETSKILL_EXPLODE` 關閉，不接 |
| `BATTLE_S_AttackDamage` | `Guardian=-1`，caller 不改 `defindex` | calc-only；後續效果仍原 target | V1.01 |
| `battle_profession_attack_fun` | `Guardian=-1`，caller 不改 `defindex` | calc-only | fixed 有編譯；Web 尚無職業技能 runtime |
| `battle_profession_status_chang_fun` 盾擊分支 | `Guardian=-1`，caller 不改 `defindex` | calc-only；傷害/狀態仍原 target | fixed 有編譯；Web 尚無職業技能 runtime |
| `battle_profession_status_chang_fun` 後段多目標分支 | `Guardian=-1`，AttackSeq 後明確改 `defindex=Guardian` | 真正代擋；DamageSub / 狀態跟 Guardian | fixed 有編譯；Web 尚無職業技能 runtime |
| `BATTLE_BattleModel_ATTACK` | physical type 才在 AttackSeq 後改 `iDefindex` | 物理傷害、死亡、StatusAttackCheck 全跟 Guardian | V1.03 |

固定 `version.h` 同時確認：

- `_PROFESSION_SKILL`：開啟。
- `_PETSKILL_FIREKILL`：開啟。
- `_PETSKILL_BATTLE_MODEL`：開啟。
- `_PETSKILL_EXPLODE`：關閉，且來源註記「不可開」。

因此目前 Guardian 核心不能再做任何「所有 AttackSeq caller 一律換 target」的全域處理。來源本身就同時存在 real substitution、calc-only 舊 bug、Guardian=-2 明確禁用與未編譯死碼四種語意。

另外用 V1.11 改成的 fixed `petskill2.txt` runtime 重新交叉檢查目前 166 組一般野外 Lv1 可捕獲資料：其實際 `skillIds` 所對應的 PetSkill function 已全部落在目前 player RANDOMACT 已支援集合（NormalAttack / NormalGuard / StatusChange / Mighty / Guardian / PowerBalance / GuardBreak / ContinuationAttack / ChargeAttack / EarthRound / GuardBreak2 / FallGround / NoGuard）。目前一般野外 Lv1 捕獲寵沒有新的 RANDOMACT function 缺口。

### V1.12 regression / audit

- main 基準：V1.11 `919abe99bd5621adacd6d16b88bd649ae23476da`
- fixed source：`1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`
- 13 個 AttackSeq caller 全數分類
- Firekill / BattleModel real substitution 保留
- GBreak / GBreak2 / FallGround / AttackDamage calc-only 保留
- Counter / Combo Guardian=-2 保留
- Explode fixed build disabled，不人工打開
- Profession 兩種不同 Guardian caller 語意記錄完成，但不在尚不存在的 Web profession runtime 上猜實作
- 一般野外 Lv1 捕獲寵 PetSkill function coverage：無新增缺口
- save schema：21


## V1.13 quest GetPet source template / progression

V1.13 從實際可達的任務獎勵寵回查 fixed C，修正三隻先前以手寫物件建立、沒有走原 `GetPet` 建立核心的寵物：

- Event 70：EnemyID 1479 → TempNo 718 瑪蕾菲雅
- Event 82：EnemyID 1563 → TempNo 730 布伊胖
- Event 83：EnemyID 1733 → TempNo 854 動物園養的拉斯基

固定來源仍是：
`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

### GetPet 真正建立路徑

`npc_eventaction.c::NPC_ActionAddPet()` 對 `GetPet` 參數是 **EnemyID**，找到 `enemy1.txt` 對應列後直接：

```c
ret = ENEMY_createPetFromEnemyIndex(talker, i);
```

`enemy.c::ENEMY_createPetFromEnemyIndex()` 再從該 Enemy 的 `enemybase1.txt` template 建 CHAR_TYPEPET；不是只拿名稱／四圍手寫一隻寵。

固定函式明確會：

- 四項 base stat 各自 `RAND(0,4)-2`
- 將這四項存入 `CHAR_ALLOCPOINT`
- 再把 10 點逐點 `RAND(0,3)` 分到四項
- 用 `((level-1)*atoi(LVUPPOINT)+INITNUM) * stat` 建立 CHAR 能力
- 複製四屬性
- 複製六項異常抗性
- 複製 `PETSKILL1..7`
- 由原始 base stat 總和算 `CHAR_PETRANK`
- 後續升級走 `CHAR_PetLevelUp`

三個 reward Enemy 在 `enemy1.txt` 都是 Lv1～Lv1，因此初次取得等級仍固定 Lv1。

### fixed enemybase1 模板

TempNo 718 瑪蕾菲雅：

- INITNUM 20
- LVUPPOINT `5.00` → fixed loader / C 計算為 5
- base V/S/T/D = 25/25/25/25
- 地100 水0 火0 風0
- 抗性 = 10/10/10/50/10/10
- PetSkill = 1 攻擊、2 防禦、其餘 -1
- image = 100451
- PETRANK = 0（base sum 100）
- source LIMITLEVEL = 79

TempNo 730 布伊胖：

- INITNUM 27
- LVUPPOINT 原字串 `4.50`；`ENEMYTEMP_initEnemy()` 用 `atoi()` 載入，因此 server progression 實際值為 4
- 資料展示保留 raw growth 4.5
- base V/S/T/D = 34/29/25/23
- 地0 水0 火60 風40
- 六抗全 0
- PetSkill = 1 攻擊、2 防禦；空白欄因 loader 預設 -1，所以其餘五格 = -1
- image = 100825
- PETRANK = 0（base sum 111）

TempNo 854 動物園養的拉斯基：

- INITNUM 10
- LVUPPOINT = 4
- base V/S/T/D = 20/23/21/26
- 地0 水0 火60 風40
- 六抗全 0
- PetSkill = 1 攻擊、2 防禦，其餘 -1
- image = 100853
- PETRANK = 2（base sum 90）
- source LIMITLEVEL = 10

### 修正內容

V1.13 新增共用 `sourceCreateQuestGetPet()`：

- 三個任務獎勵不再各自手寫不完整 Pet object。
- 直接使用 fixed template 常數。
- 初次建立重新使用既有 `rollEnemyCreateStats()` / `serverEnemyDerived()`，與 Enemy create 的來源 RNG 相同。
- 寫入 `serverStats / serverCombat / allocPointPacked / petRank / serverProgression`。
- 後續升級因此真正能進既有 `serverPetLevelUp()`，不再只有 level 增加、能力不成長。

舊版三隻任務寵因沒有 server progression，V1.13 將 save schema 21 → 22，載入舊存檔時只做一次 source migration：

- 保留原本 level / exp。
- 重新依原 C 產生 Lv1 建立 RNG。
- 按目前 level 重播對應次數的 `CHAR_PetLevelUp` 等價成長。
- 保留現有 HP 數值，僅在新 maxHP 下 clamp，不自行猜 HP 比例。
- 補回 source skills / resist / elements / image / progression metadata。
- 只處理帶 quest reward 標記且 TempNo 為 718 / 730 / 854 的舊寵，不碰玩家正常捕獲的同 TempNo 物件。

瑪蕾菲雅的放置版回憶巡禮門檻仍維持既有 `levelCap=10 → 15 → … → 79` 流程；V1.13 只修底層 Pet 能力與升級，不改 Event 69/70/71/83 任務狀態機。

### V1.13 regression targets

- quest GetPet 730 / 854 / 718 都走共用 source builder
- PetSkill 皆為 `[1,2,-1,-1,-1,-1,-1]`
- 718 抗性 `[10,10,10,50,10,10]`
- 730 / 854 火60風40
- 718 image 100451
- 730 raw growth 4.5 + server LVUPPOINT 4 的 atoi 差異保留
- PETRANK：718=0、730=0、854=2
- quest pet server progression 可進 `serverPetLevelUp()`
- schema 22 one-time migration
- Marefia memory levelCap lifecycle 保留


## V1.14 captured Pet loyalty / VARIABLEAI lifecycle

V1.14 繼續沿用固定原 C：

`gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56`

本輪不是新增自訂忠誠規則，而是把一般捕獲寵目前漏掉的原服務端 lifecycle 接回來。

### 1. PET_createPetFromCharaIndex 會複製原 Enemy 的寵物欄位

`gmsv/src/char/pet.c::PET_createPetFromCharaIndex()` 會把被捕獲 Enemy 的：

- VITAL / STR / TOUGH / DEX
- LUCK
- 四屬性
- SLOT / MODAI / LV
- 六種異常抗性
- RARE / PETRANK / PETID / CRITICAL / COUNTER
- PETSKILL1..7
- ALLOCPOINT

複製進新 Pet。

`char_base.h` 中 Pet alias 又明確定義：

- `CHAR_MODAI = CHAR_CHARM`
- `CHAR_VARIABLEAI = CHAR_LUCK`

fixed Enemy 預設 `CHAR_LUCK=0`，因此一般捕獲寵建立後 VariableAI 的來源初值為 0。

### 2. 捕獲成功後有效忠誠最高 60

`battle_event.c::BATTLE_Capture()` 在 `PET_createPetFromCharaIndex()` 成功後會：

1. 設 `CHAR_PETGETLV = 當下 Pet Lv`
2. `CHAR_complianceParameter(pindex)`
3. 強制 `CHAR_VARIABLEAI = 0`
4. 計算 `CHAR_DEFAULTMAXAI(60) - CHAR_WORKFIXAI`
5. 若結果 < 0，加入 `差值 * 100` 的負 VariableAI

所以如果捕獲當下原公式會算出 FIXAI 100：

- 差值 = 60 - 100 = -40
- VariableAI = -4000
- 最終有效 FIXAI = 60

如果原 FIXAI 本來只有 48，就不會補正，仍維持 48。

V1.14 新增 `sourceApplyCapturedPetInitialAi()`，只在**新捕獲**當下依目前玩家等級、魅力、Pet 等級與 source MODAI 做這個修正。

舊存檔不強制回推，因為舊資料沒有保存「當初捕獲時」的玩家等級與魅力；用現在狀態倒算會是假資料，違反「原 C 規則優先、不猜數值」。

新捕獲 Pet 同時保存 `petGetLv`，對應原 `CHAR_PETGETLV`。

### 3. 擊倒 Enemy 會增加 VariableAI

固定 `battle.c::BATTLE_AddExp()` 對有參戰並存活的 Pet，每一名被擊倒 Enemy 都會：

- Enemy Lv > Pet Lv：`AI_FIX_PETGOLDWIN = +20`
- 否則：`AI_FIX_PETWIN = +1`

VariableAI 的單位是百分之一，所以分別等於：

- +0.20 有效忠誠
- +0.01 有效忠誠

比較使用的是戰鬥獎勵處理當下的 Pet 等級；原版是先做每隻 Enemy 的獎勵，再處理 Pet 升級，因此 V1.14 對整場所有 Enemy 都使用**升級前 Pet Lv snapshot**。

### 4. 每升一級再 +5 忠誠

固定戰鬥結果流程：

```c
for (j = 0; j < UpLevel; j++) {
    CHAR_PetLevelUp(petindex);
    CHAR_PetAddVariableAi(petindex, AI_FIX_PETLEVELUP);
}
```

而：

```c
#define AI_FIX_PETLEVELUP (+5*100)
```

因此 V1.14 的 `awardActivePetExp()` 每升一級除了既有 `CHAR_PetLevelUp` 等價能力成長，也同步：

`VariableAI += 500`

即有效忠誠 +5。

這也適用於 Event reward Pet；`GetPet` 本身不套「捕獲上限 60」，但之後正常參戰／升級仍依相同 VariableAI lifecycle 成長。

### 5. Clamp

fixed `CHAR_PetAddVariableAi()`：

- 最大 `+100*100 = +10000`
- 最小 `-100*100 = -10000`

V1.14 的 `sourcePetAddVariableAi()` 完全使用同一範圍。

### 本輪刻意未擴充

來源另有玩家死亡、Pet 死亡、必殺飛出、復活、騎乘等 VariableAI 增減。

這些行為只有在對應 Web lifecycle 能完整對齊時才接；V1.14 先處理目前可完整證明且正常流程直接可達的：

- 捕獲
- 擊倒 Enemy
- Pet 升級

不為未完整建模的系統猜補效果。

### V1.14 regression targets

- new capture：先 VariableAI=0，再把 FIXAI >60 的部分壓到 60
- FIXAI <=60 的捕獲寵不被硬抬到 60
- capture petGetLv 保存
- 每 defeated Enemy：EnemyLv>PetLv => +20；否則 +1
- 多敵人戰逐隻累積
- victory AI 比較使用升級前 Pet Lv
- 每升 1 級 VariableAI +500
- VariableAI clamp -10000..10000
- quest GetPet 不套 capture 60 cap
- 舊存檔不以現在玩家狀態偽造歷史 capture offset


## V1.15 battle death loyalty / Marefia _PET_LIMITLEVEL

固定來源仍是 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪對齊 battle.c 的 BATTLE_AddProfit、BATTLE_NormalDeadExtra 與 Pet_Check_Die。

### 死亡只處理一次

原 BATTLE_AddExpItem 每次只處理 HP <= 0 且 CHAR_ISDIE == FALSE 的 Battle Entry，然後立刻把 CHAR_ISDIE 設為 TRUE。因此同一隻角色即使被多段技能打到 0 HP，死亡 lifecycle 也只執行一次。

V1.15 新增每場 battlePetDeathProcessedIds，於 battle reset 時清空。

### 一般 Pet 戰鬥死亡

AI_FIX_PETDEAD = -5*100。

- 玩家 Lv1～10：VariableAI -250，也就是有效忠誠 -2.5
- 玩家 Lv11+：VariableAI -500，也就是有效忠誠 -5

### 玩家戰鬥死亡

CH_FIX_PLAYERDEAD = -2，AI_FIX_PLAYERDEAD = -1*100，玩家 Lv<=10 時兩者除以 2。

- Lv1～10：魅力 -1；當前出戰寵 VariableAI -50
- Lv11+：魅力 -2；當前出戰寵 VariableAI -100

CHAR_AddCharm 的原範圍是 0～100，V1.15 同樣 clamp。

如果同一場 Pet 先倒下、玩家之後也倒下，兩種效果依原 C 疊加。

### Marefia 718 的 _PET_LIMITLEVEL

固定 version.h 明確開啟 _PET_LIMITLEVEL。

Pet_Check_Die 對 TempNo 718：
- 從 CHAR_ALLOCPOINT 解四個 byte
- VITAL 扣 RAND(1,8)
- STR / TOUGH / DEX 各扣 RAND(1,4)
- 四項各 clamp 0～50
- 重新 pack 回 ALLOCPOINT
- MODAI 減少 5%，寫回 int 時截斷

這裡改的是未來成長使用的 ALLOCPOINT，不是直接倒扣目前已生成的 VITAL/STR/TOUGH/DEX。因此 Web 只更新 allocPointPacked；serverStats 不倒退。

MODAI 是 Pet instance 可變欄位，因此 V1.15 新增 modAiOverride；petSourceModAi 先讀 override，再退回 TempNo 原始表。

同一次 Marefia 死亡順序保持原 C：
1. Pet_Check_Die 的 ALLOCPOINT / MODAI
2. BATTLE_NormalDeadExtra 的一般 Pet VariableAI 死亡扣減

### Regression targets

- battle reset 清空 death processed set
- 同一 Pet HP 歸零只處理一次
- Pet death：Lv<=10 -250；Lv11+ -500
- Player death：Lv<=10 charm -1 / active Pet -50；Lv11+ charm -2 / active Pet -100
- charm clamp 0～100
- Marefia VITAL RAND(1,8)
- Marefia STR/TGH/DEX RAND(1,4)
- Marefia ALLOCPOINT clamp 0～50
- Marefia MODAI 每次死亡衰減 5% 並 int 截斷
- pending Pet death 在 win / defeat early-return 前仍會被處理


## V1.16 owner attacks own Pet / AI_FIX_SEKKAN

固定來源：

gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56

本輪對齊 battle_event.c 的 BATTLE_AttackSeq。

原 C 在真正做 DuckCheck、CriticalCheck、DamageCalc 之前先判斷：

- defender 是 CHAR_TYPEPET
- battle norisk == 0
- battle type == BATTLE_TYPE_P_vs_E
- Pet 的 CHAR_WORKPLAYERINDEX == attackindex

成立時直接：

CHAR_PetAddVariableAi(defindex, AI_FIX_SEKKAN)

而 battle.h 定義：

AI_FIX_SEKKAN = -2*100

所以主人每一次物理攻擊自己的 Pet，都會讓 VariableAI -200，也就是有效忠誠 -2。

### V1.16 對應目前 Web 可達路徑

目前玩家正常指令只攻擊敵方；但混亂 BATTLE_StatusSeq 已能把玩家改成普通攻擊己方 Pet。

另外混亂 Counter chain 也可能讓玩家在反擊階段再次攻擊自己的 Pet。

V1.16 因此把 source penalty 放進共用 battleApplyPhysicalHit 的 player -> pet 路徑。

順序刻意在 dodged / miss 判斷之前，對齊 BATTLE_AttackSeq：

1. owner/pet relationship check
2. AI_FIX_SEKKAN -200
3. DuckCheck
4. critical / damage
5. DamageSub

因此：

- Pet 閃避仍會扣忠誠
- 物理結果 MISS 仍會扣忠誠
- 每一次 Counter owner -> pet 都各自再扣一次
- Pet -> owner 不會反向套這個規則

VariableAI 仍沿用 V1.14 的 -10000..10000 source clamp。

### Regression targets

- player -> own pet primary confusion attack => VariableAI -200
- player -> own pet counter => VariableAI -200 per AttackSeq
- dodge still applies -200
- miss still applies -200
- pet -> player does not apply AI_FIX_SEKKAN
- enemy -> player/pet does not apply AI_FIX_SEKKAN
- clamp continues through sourcePetAddVariableAi


## V1.17 persist BATTLE_LostEscape default-pet rest state

固定來源仍是 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

原 battle_event.c::BATTLE_LostEscape 在低忠誠 Pet 逃跑時：

- BATTLE_Exit(pet, battleindex)
- CHAR_setInt(owner, CHAR_DEFAULTPET, -1)
- CHAR_AddCharm(owner, CH_FIX_PETESCAPE)

目前 Web 的即時戰鬥流程早已做到：

- battlePetOutIds.add(pet.id)
- activePetId = null
- charm -1
- Pet 本身仍留在 petBox / team

但 normalizeState 以前只要看到 activePetId 為 null，就會在 reload 時把 team 第一隻自動指定成 activePetId，等於把原 CHAR_DEFAULTPET=-1 狀態消掉。

V1.17 改成：

- 如果舊存檔根本沒有 activePetId 欄位，才做 legacy 自動補選
- 如果現行存檔明確保存 activePetId:null，就保留 null
- 如果舊存檔根本沒有 team 欄位，才自動把第一隻 Pet 放入 team
- 現行存檔若明確保存空 team，不再偷偷補第一隻

因此低忠誠逃跑後，即使重新整理頁面，該 Pet 仍只是留在持有欄／隊伍欄，不會自動重新變成出戰 Pet；玩家必須自己再次選「設為出戰」。

### Regression targets

- current save activePetId:null + team has Pet => reload keeps null
- legacy save missing activePetId + team has Pet => first team Pet may still auto-select
- current save explicit empty team + petBox nonempty => reload keeps empty team
- legacy save missing team + petBox nonempty => first Pet migrates into team
- BATTLE_LostEscape current flow still charm -1 and battle exit


## V1.18 Ultimate / knock-away death lifecycle

固定來源：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪對齊 BATTLE_DamageSub / DamageSub2 / Attack / Counter / Combo 與 BATTLE_UltimateExtra。

原 DamageSub：
- 單次 damage >= MAXHP * 1.2 + 20 => Ultimate type 2
- 否則只有 HP 打成負值的 overkill addpoint 累積到 CHAR_WORKULTIMATE
- 累積 addpoint >= 同門檻 => type 1
- Ultimate 成立後 WORKULTIMATE 清 0

BATTLE_Attack / Counter 對死亡的非 PLAYER 目標，若本擊 critical，另做嚴格 RAND(1,100)<50；成功值 1..49，會把 ultimate 指定成 type 1，連原本 type 2 都可能被覆寫成 1。 BATTLE_Combo 的同類判定更窄，只在死亡目標是 CHAR_TYPEENEMY 時做，因此 V1.18 的 Combo tracker 使用 enemy-only critical 模式。

V1.18 用 battleUltimateWork / battleUltimateFlags 重建 battle-local WORKULTIMATE / BENT_FLG_ULTIMATE。

固定 _PETSKILL_LER 只以 CHAR_BASEBASEIMAGENUMBER 101813/101814 禁止打飛。Web 現有資料通常只有 animationGroupId，因此不從 TempNo 或名稱猜；只有物件真的提供 exact baseBase image 欄位時才套例外。

Ultimate Player：
- Lv1～10：魅力 -2、DEFAULTPET VariableAI -500
- Lv11+：魅力 -4、DEFAULTPET VariableAI -1000

Ultimate Pet：
- owner Lv1～10：VariableAI -500
- owner Lv11+：VariableAI -1000
- DEFAULTPET=-1 等價為 activePetId=null
- 本場 BATTLE_Exit 等價為 battlePetOutIds

普通死亡與 UltimateExtra 互斥。Marefia 718 的 Pet_Check_Die 在原流程先於兩個死亡分支，所以被打飛時仍先套 ALLOCPOINT / MODAI 死亡懲罰。

已接入目前可明確對應 DamageSub / DamageSub2 的普通物理、Counter、Guardian 代擋、Bow/Boomerang/BoundThrow/BreakThrow、混亂物理、已接 Enemy 物理 PetSkill，以及 Combo aggregate damage。純 attack magic／直接 HP 傷害不套 Ultimate。

Regression：
- damage >= maxHp*1.2+20 => type2
- overkill 才累積 WORKULTIMATE
- non-player lethal critical strict <50
- player critical 不做該 50% roll
- Ultimate Pet -1000 / low-level -500 + activePetId=null
- Ultimate Player charm -4 / low-level -2；Pet -1000 / low-level -500
- normal death仍保留 V1.15 數值
- battle reset 清空 Ultimate work/flags


## V1.19 BATTLE_AddExpItem kill-credit

固定來源：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

BATTLE_AddExpItem 不會在整場勝利後把每隻 Enemy EXP 平均或共享給所有出戰者。它在每次 BATTLE_AddProfit 被呼叫時掃描「HP<=0 且 ISDIE==FALSE」的 Enemy，然後只對這一次傳入的 pBidList 累加 CHAR_WORKGETEXP。

普通攻擊／Counter 的 pBidList 通常只有目前攻擊者；Combo 的 pAttackList 則可以同時包含玩家與 Pet，因此 Combo 成員各自取得完整的該 Enemy EXP。

同一段程式裡 AI_FIX_PETWIN / AI_FIX_PETGOLDWIN 也只對 pBidList 中 CHAR_TYPEPET 的成員執行。因此 V1.14 先前「只要 Pet 出戰，整場每隻死怪都增加忠誠」過寬。

V1.19 新增 Enemy death credit：
- Enemy 第一次 HP 歸 0 時固定 sourceRewardProcessed
- 記錄當次 player-side attack list 到 sourceRewardCredits
- Pet credit 在死亡當下立即執行 AI_FIX_PETWIN / PETGOLDWIN
- 後續 battle finish 不再補整場 Pet win AI
- Enemy 自己因 poison/status 或 enemy-side confusion 死亡時沒有 player-side credit，不補 EXP／掉落

一般 source-resolved encounter：
- 玩家只取得自己在 death pBidList 中的 Enemy EXP
- Pet 只取得自己在 death pBidList 中的 Enemy EXP
- Combo 中玩家＋Pet 都在 attack list 時兩者各拿完整 EXP
- Pet 若之後死亡，原 battle result 會因 CHAR_ISDIE 跳過 Pet EXP；Web 同樣不發
- Pet 若只是 LostEscape 而仍存活，原 CHAR_WORKGETEXP 仍可在結算時領取；Web 改用 petId credit，因此不要求 activePetId 仍存在

掉落也沿用 BATTLE_AddExpItem 的 proflg：
- 只有 sourceRewardPlayerSide=true 的死 Enemy 進戰利品池
- enemy-side 自滅不產生玩家戰利品
- 既有全場最多 3 格 getitem 等價池仍保留

手工任務編成目前缺少可信的逐 Enemy 原始 EXP，因此 V1.19 不把 fallbackBattleExp 硬拆成猜測值；這些戰鬥暫時維持原本明確標示的 fallback EXP。Pet 勝利忠誠仍依真實 kill-credit 即時處理。

Regression：
- player kill => player source EXP only
- Pet kill => Pet source EXP only + immediate AI_FIX_PETWIN/GOLDWIN
- player+Pet Combo kill => both get full source EXP
- enemy-side self/status death => no source EXP/drop
- Pet death after earlier kill => AI already retained, but Pet EXP skipped
- LostEscape after earlier kill => alive Pet may still receive accumulated EXP
- source-resolved drop pool only contains player-side credited Enemy
- fallback quest EXP remains explicit fallback, no invented per-unit values


## V1.20 source-timed getitem[3] carried-loot pool

固定來源：gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

V1.19 已把 Enemy reward ownership 改回死亡當下的 pBidList。V1.20 繼續把 BATTLE_AddExpItem 中 carried item 的 getitem 時序接回來。

Enemy ENEMY_ITEM1..10 / ITEMPROB1..10 是否生成 existing item，仍在 Enemy 建立時決定；V1.20 不改這個既有來源規則。

真正 Enemy 死亡且 proflg==1、玩家側 pBidList 有效時，原碼對每一個 Enemy carried item 依序：

1. CHAR_setItemIndex(enemy,item,-1)
2. k = RAND(0, allnum-1)
3. 嘗試放入 pEntryPlayer[k]->getitem[0..2] 第一個空格
4. 若 3 格已滿：
   - RAND(0,1) 為真：RAND(0,2) 選一格替換，舊 item existing index 釋放
   - 否則：新 item existing index 直接釋放

本專案是單玩家模型；玩家與自己的 Pet 在原 pEntryPlayer 對映都回到同一個玩家 Entry，所以實際只有一個 3 格池。但 k = RAND(0,allnum-1) 仍會消耗原始 RNG：
- 普通 player / Pet kill：allnum=1，仍會呼叫一次 RAND(0,0)
- Player + Pet Combo kill：allnum=2，會呼叫 RAND(0,1)，即使最後仍落到同一玩家池

V1.20 新增 battleGetItemPool，並在 sourceMarkEnemyDeathCredit 內、Pet win AI 之前立即執行 sourceQueueEnemyCarriedLoot。這保持原 BATTLE_AddExpItem 的 statement order：getitem -> EXP/kill count -> Pet AI。

勝利結算時 rollVerifiedDrops 不再重新跑 carried-item reservoir RNG，只取 sourceTakeBattleGetItemPool 中已經決定留下的最多 3 件 existing item，再轉成 player ownership。

敗北／捕獲／逃離／無獎勵清場等沒有把 getitem 移入玩家背包的情況，resetBattleStatuses 會以 sourceDiscardBattleGetItemPool 釋放暫存 existing item，對應 BATTLE_DeleteItem。

原 BATTLE_GetExpGold 也確認：只有 CHAR_ISDIE==FALSE 的玩家才會把 pEntryChara->getitem 移進正式背包；玩家死亡時不領取，稍後 DeleteItem 清掉。因此 Web 戰敗不保留先前暫存 getitem 是來源一致行為。

手工 questDrop / conditionItems 的非 server carried-loot fallback 仍維持既有邏輯；V1.20 只改有 existing-index 證據的 Enemy carried item，不替任務 fallback 猜來源時序。

Regression：
- source carried loot reservoir RNG happens at enemy death, not win
- every carried item consumes owner RAND(0, allnum-1), including allnum=1
- first three items fill getitem[0..2] in order
- full pool uses RAND(0,1), then optional RAND(0,2) replacement
- replaced/rejected existing item index is immediately freed
- win takes pool without rerolling reservoir
- defeat/no-reward reset frees unclaimed battle-getitem indices
- player/pet Combo uses allnum=2 RNG while still mapping to one owner pool
- source getitem handling remains before Pet win AI


## V1.21 Marefia CHAR_CheckPetDoLimitlevel / batch level-up order

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪繼續沿 BATTLE_GetExpGold → CHAR_LevelUpCheck 往下補 Pet 升級 lifecycle。

### 原始順序

BATTLE_GetExpGold 對有 WORKGETEXP 的 Pet：

1. BATTLE_GetExp(pet)
2. UpLevel = CHAR_LevelUpCheck(pet, owner)
3. 若 UpLevel > 0：
   - for(j=0; j<UpLevel; j++)
   - CHAR_PetLevelUp(pet)
   - CHAR_PetAddVariableAi(pet, AI_FIX_PETLEVELUP)

也就是「先一次算完整個 UpLevel，再做 UpLevel 次成長」，不是每升一級就立刻插一個 CHAR_PetLevelUp。

一般 Pet 這兩種寫法目前核心四圍結果等價；718 的 _PET_LIMITLEVEL 特殊規則則不等價。

### CHAR_CheckPetDoLimitlevel

fixed version.h 已開啟 _PET_LIMITLEVEL。

CHAR_LevelUpCheck 每次準備從目前 level 升到下一級前，對 Pet 呼叫：

CHAR_CheckPetDoLimitlevel(petindex, owner, level)

TempNo 718 瑪蕾菲雅在：

current level % 20 == 0

時會：

- 連續 3 次 RAND(0,3)
- 0 => VITAL -1
- 1 => STR -1
- 2 => TOUGH -1
- 3 => DEX -1
- 每項下限 0
- pack 回 CHAR_ALLOCPOINT

因此實際發生在：

- Lv20 → 21 前
- Lv40 → 41 前
- Lv60 → 61 前

來源 LIMITLEVEL=79，所以正常任務路徑不會進到 Lv80 → 81。

### RNG / 多級順序

這 3 次 RAND 發生在 CHAR_LevelUpCheck 內，而所有 CHAR_PetLevelUp 的 10 次 Param 分配 RNG + PETRANK growth RNG 都在 LevelUpCheck 完成後才開始。

因此若一場戰鬥讓瑪蕾菲雅一次從 Lv19 升到 Lv22：

- 先判 19→20
- 判 20→21 時先扣 3 次 ALLOCPOINT
- 再判 21→22
- 最後才用「已扣過的 ALLOCPOINT」連續跑 3 次 CHAR_PetLevelUp

V1.21 把 awardPetExp 改成同一順序，避免舊 Web 的「先做一次成長、再遇到 20 級門檻」造成 RNG 與能力值錯位。

### 放置版回憶 levelCap 保留

瑪蕾菲雅既有 Lv10 / 15 / 20 / 25 / ... / 75 / 79 回憶巡禮是依 ptalk01.arg EVENTRUN 節點做的可玩流程控制；V1.21 不取消這些關卡。

所以只有在回憶已解鎖到可跨過 20 / 40 / 60 時，才會觸發 source 的 level%20 成長底值衰減。

### Owner mismatch 分支暫不接

CHAR_CheckPetDoLimitlevel 另有「Pet owner 與目前帶領玩家不同」時四圍各 RAND(2,10) 扣減的分支。

目前純單機 Web 沒有寵物交易／轉手，也沒有第二玩家 owner identity 可達，因此 V1.21 不創造假的 owner mismatch；等對應系統真的存在時再接。

### 舊存檔

V1.21 不對已經跨過 20/40/60 的舊瑪蕾菲雅補抽歷史 RNG。

原因是舊存檔沒有保存當時的 rand sequence，也可能已經發生過 V1.15 的死亡 ALLOCPOINT 懲罰；現在硬補會改變原本應有的 RNG 時序與 clamp 順序。

只從 V1.21 之後「實際發生的新 level transition」按 source 規則處理，不猜歷史數值。

### Regression targets

- non-718 Pet：UpLevel batch order 不新增 limit penalty
- 718 current level 20 / 40 / 60：升下一級前恰好 3 次 RAND(0,3)
- 718 current level 10/15/25/...：不觸發 level%20 penalty
- penalty 先改 allocPointPacked，之後才跑全部 UpLevel 次 serverPetLevelUp
- 每次真正升級仍 AI_FIX_PETLEVELUP +500
- 一次連升多級時所有 PetLevelUp 都在 LevelUpCheck phase 完成後執行
- 現有 memory levelCap 流程保留
- owner-mismatch 不在不可達的單機模型中猜實作


## V1.22 _BATTLE_Exit owned Pet HP=1 recovery

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪沿 BATTLE_Finish → BATTLE_GetProfit → BATTLE_Exit 繼續補最終戰鬥離場 lifecycle。

### 原始 Player BATTLE_Exit

fixed _BATTLE_Exit() 在處理 CHAR_TYPEPLAYER 時，會再掃玩家全部 CHAR_MAXPETHAVE Pet slot。

對每一隻持有 Pet：

- 若 CHAR_ISDIE == TRUE，或
- CHAR_HP <= 0

就：

- CHAR_ISDIE = FALSE
- CHAR_HP = 1

接著清 Battle mode / battle index / battle bad status 並重新 compliance。

因此「寵物在戰鬥中倒下」不是永久保留 0 HP；玩家真正離開整場戰鬥時，倒下寵會回到 **HP 1**。

### 順序非常重要

BATTLE_Finish 對每個 Battle Entry：

1. BATTLE_GetProfit / BATTLE_GetExpGold
2. BATTLE_Exit

而 BATTLE_GetExpGold 在掃持有 Pet 時先：

- CHAR_ISDIE == TRUE => continue

所以死亡寵在本場：

- **先拿不到 EXP**
- 之後 Player BATTLE_Exit 才回復到 HP 1

V1.22 保留這個順序：winBattle 先完成 V1.19 的 Pet EXP 判定，再做 sourceFinalizeOwnedPetsBattleExit。

### 全部持有寵，不只 active/team

原碼掃的是 CHAR_MAXPETHAVE，不只 DEFAULTPET。

V1.22 因此遍歷完整 state.petBox：

- active Pet
- team 內其他 Pet
- 未放入 team 的持有 Pet

只要 HP<=0，在整場離場時都改成 HP 1。

### 中途 BATTLE_Exit 不立即復活

下列流程只是單隻 Pet 在戰鬥中離場，不是玩家整場離場：

- BATTLE_LostEscape 低忠誠逃跑
- BATTLE_UltimateExtra Pet 被打飛

V1.22 不在這兩條 mid-battle 路徑直接回 HP。

如果被打飛 Pet 的 HP 已是 0，它會保持 0 到整場戰鬥真正 teardown；此時才由 Player BATTLE_Exit 等價 cleanup 回到 1。

### activePetId 不自動恢復

BATTLE_Exit 的 HP=1 掃描不會替 owner 重新設定 CHAR_DEFAULTPET。

因此 V1.17 / V1.18 的語意保留：

- LostEscape / Ultimate Pet 可把 activePetId 設成 null
- 整場結束把 Pet HP 從 0 改成 1
- **不會因此自動把 activePetId 指回該 Pet**
- reload 仍保留 explicit null

### Web 的整場 teardown

V1.22 在以下整場結束路徑做同一個 final cleanup：

- 勝利 winBattle
- 戰敗 defeat
- 捕獲使整場結束
- 敵方全逃／最後成員直接離場
- UI 切換地圖／任務區時若當下仍有 battle，clearEnemyBattleNoReward

clearEnemyBattleNoReward 只有 hadBattle=true 才跑 cleanup；單純沒戰鬥時切地圖不會碰 Pet HP。

### 玩家本人的 defeat full-heal

目前放置版 defeat() 仍保留既有「回村後玩家 HP/MP 補滿」的遊戲便利規則。

fixed _BATTLE_Exit 對玩家自身死亡的 HP 處理不是本輪範圍；V1.22 只修明確缺漏且會影響持有寵後續可用性的 Pet HP=1 lifecycle，不順手改玩家回村設計。

### Regression targets

- Pet HP=0 at win: no Pet EXP, then final exit => HP 1
- Pet HP=0 at defeat: death/loyalty penalty first, then HP 1
- all owned Pet slots are scanned, not only active/team
- alive Pet HP remains unchanged
- LostEscape does not heal mid-battle
- Ultimate Pet does not heal mid-battle
- after final exit, activePetId explicit null stays null
- capture / enemy escape / direct exit full teardown also runs cleanup
- clearEnemyBattleNoReward with no active enemy does not mutate Pet HP


## V1.23 BecomePig battle-exit lifecycle

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪延續 V1.22 的 _BATTLE_Exit 稽核，修正 _PETSKILL_BECOMEPIG（黑烏力化）的最終離場語意。

### net.c 每秒倒數

fixed CONNECT_SysEvent_Loop 每秒檢查 CHAR_BECOMEPIG > -1：

- 剩餘值 - 1 > 0：減 1
- 剩餘值 - 1 <= 0：先設 CHAR_BECOMEPIG = 0
- 只有 WORKBATTLEMODE == BATTLE_CHARMODE_NONE 時，才再設成 -1、compliance 並顯示失效

因此倒數在戰鬥中到 0 時，狀態仍保留到戰鬥離場。現有 playerPigActive(enemy exists => expired timer still active) 保留。

### _BATTLE_Exit 強制復原

fixed _BATTLE_Exit 在 _PETSKILL_BECOMEPIG 開啟時：

- CHAR_BECOMEPIG > -1
- 且角色為 PLAYER

就立刻恢復 BECOMEPIG_BBI 外觀並 CHAR_complianceParameter；不檢查剩餘秒數。

所以即使還剩 150 秒，只要整場 battle exit，就立即解除。

### V1.23

新增 sourceFinalizePlayerBattleExit：

1. 先執行 V1.22 的全部持有死亡 Pet HP=1 cleanup
2. 若 playerPigUntilMs > 0，整場離場時立即清為 0

完整 Player battle teardown 改走此 helper：

- winBattle
- defeat
- clearEnemyBattleNoReward（捕獲結束、敵方全逃／直接離場、切地圖中止整場）

Pet 自己 LostEscape / Ultimate mid-battle 不觸發 Player BecomePig cleanup。

### Regression

- pig timer positive + win => immediately clear
- pig timer positive + defeat => immediately clear
- pig timer positive + capture/enemy escape full teardown => clear
- timer expires while battle continues => remains pig until exit
- Pet LostEscape / Ultimate mid-battle => does not clear player pig
- V1.22 dead-Pet HP=1 cleanup remains


## V1.24 BecomeFox / ENEMY_PETFLG core lifecycle

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

本輪接回 _PETSKILL_BECOMEFOX（PetSkill 625 媚惑術）的可達核心，不猜 PETFLG。

### ENEMY_PETFLG

fixed version.h 開啟 _BATTLENPC_WARP_PLAYER，因此 enemy.c 的 ENEMY_STARTINTNUM=4。
依 enemy.h 的 ENEMY_DATAINT 排序，ENEMY_PETFLG 對應 enemy1.txt 第 14 欄（1-based）。

從固定 commit 的 gmsv/data/enemy1.txt 解析：

- 2,958 個 EnemyID
- 0 個同 ID PETFLG 衝突
- 現行 encounter runtime 使用的 818 個 EnemyID 全部有對應值
- 其中 567 個 PETFLG != 0

結果寫入 stoneage_general_encounter_runtime.json 的 enemyPetFlg；makeEnemyUnit 只按最終 resolved EnemyID 查表，缺值回 null，不猜 0/1。

### 命中後判定

fixed battle.c 的順序是：

1. 先完成普通 BATTLE_Attack
2. 完成 Counter chain
3. 原始 defNo 仍存活
4. primary attack 不是 MISS / DODGE / ALLGUARD / ARRANGE
5. 先執行 rand()%100 < 31
6. target 不是 PLAYER
7. target CHAR_WORK_PETFLG != 0
8. caster 沒有 BECOMEPIG

Enemy 對玩家／玩家持有 Pet 的附加條件仍不可達；真正可達的是玩家出戰 Pet 在低忠誠 random-act 抽到 skill 625 後攻擊 Enemy。

V1.24 新增 sourcePerformPetBecomeFoxSkill，保留普通物理攻擊 + Counter，再按上述順序做變狐判定。PETFLG=0 時仍先消耗 31% roll，維持原 RNG 時序。

### WORKFOXROUND / battle turn

fixed pBattle->turn 每個 BATTLE_Command round 在 AI 前 +1。

V1.24 為每場 battle 加入 sourceBattleTurn，normalBattleOrder 每輪 +1；成功變狐時把當下 turn 寫到 sourceFoxTurn。

Enemy 自己進 StatusSeq 時：

- currentTurn - sourceFoxTurn <= 2：保持
- currentTurn - sourceFoxTurn > 2：解除

因此 T / T+1 / T+2 仍有效，T+3 的該 Enemy StatusSeq 恢復。

### 能力與指令

變狐有效時，依 fixed battle.c：

- WORKATTACKPOWER = WORKFIXSTR * 0.8
- WORKDEFENCEPOWER = WORKFIXTOUGH * 0.8
- WORKQUICK = WORKFIXDEX * 0.8
- int 寫回直接截斷

AI / PetSkill 仍先在 PreCommand 選好；到該 Enemy 真正執行自己的 action 時，只有 ATTACK / GUARD / NONE 保留，其餘特殊 command 改成 NONE。

### Regression targets

- game.js syntax PASS
- enemy1 PETFLG 2,958 IDs / 0 conflicts
- current runtime 818/818 EnemyID 有 PETFLG
- primary MISS / DODGE / ALLGUARD / ARRANGE 不 roll
- primary hit + target alive：PETFLG=0 仍消耗 roll，但不變狐
- PETFLG!=0 + roll 0..30 成功；31..99 失敗
- Counter 後 caster Pet 即使倒下，只要原始 target 仍活著仍可完成判定
- T / T+1 / T+2 active；T+3 StatusSeq recovery
- active fox：FIX attack / defense / quick 各 80% int truncate
- active fox：特殊 command -> NONE；ATTACK / GUARD / NONE 保留
- V1.18 Ultimate / death branch regression 不回退


## V1.25 BecomeFox ranged-weapon mixed semantics

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

V1.24 已接回 WORKFOXROUND 核心；V1.25 補齊 battle.c 中「實際裝備」與 battle loop global gWeponType 分離造成的遠距武器特殊行為。

### Source order

角色進 BATTLE_Battling 後：

1. gWeponType = BATTLE_GetWepon(charaindex)
2. 若 WORKFOXROUND != -1 或圖號 101749，gWeponType 強制改成 ITEM_FIST
3. attack_max = BATTLE_GetAttackCount(charaindex)
4. BATTLE_GetAttackCount 仍直接讀 CHAR_ARM 的 ITEM_ATTACKNUM_MIN/MAX
5. 若 attack_max > 0 且 global gWeponType == FIST，gDamageDiv = attack_max
6. BREAKTHROW 麻痺只在 global gWeponType == ITEM_BREAKTHROW 時啟用，因此 fox 狀態不啟用
7. BATTLE_TargetListSet 再次直接呼叫 BATTLE_GetWepon(charaindex)，並不讀 global gWeponType

這造成一個刻意保留的混合狀態：外層像拳頭，但部分底層仍看真正裝備。

### Current reachable weapon data

目前 stoneage_enemy_weapon_runtime 的來源武器：

- AXE：AttackNum 1
- CLUB：AttackNum 1
- SPEAR：來源 0，BATTLE_GetAttackCount 會修正為 1
- BOW 400：AttackNum 1..3
- BOW 2498：AttackNum 3..5
- BOOMERANG：AttackNum 1
- BOUNDTHROW：AttackNum 1
- BREAKTHROW：AttackNum 1

因此現行真正會因 fox + AttackNum 產生多段差異的是 Bow；其他遠距仍需要取消其專用 command / status 語意。

### Fox + actual Bow

固定原 C 的 RNG / target 順序：

1. 先 RAND(actual ITEM_ATTACKNUM_MIN, MAX)
2. 再由 BATTLE_TargetListSet 因「實際裝備是 Bow」做 RAND(0,1)，生成 aBowW 10 格序列
3. 真正執行時 global gWeponType 已是 FIST，因此第一擊不是用 aDefList[0]，而是對原 COM2 做 BATTLE_TargetAdjust
4. 第一擊後 k 由 0 變 1，才開始讀 aDefList[1]、[2]...
5. 每個候選格若無效，BATTLE_TargetAdjust 會呼叫 BATTLE_DefaultAttacker，從對方存活 Entry 均勻 RAND 一名
6. 每次正傷害在 BATTLE_Attack() 尾端除以 attack_max，最低 1
7. 動作封包分支是 BH / FIST，不是 BB-w0

V1.25 以 sourceFoxTargetAdjust / sourceFoxDefaultPlayerSideTarget 保留這個空格重抽行為，不把 bow list 的空格直接 skip。

### Which rules still use the actual equipped item

即使 fox 強制 global gWeponType=FIST，下列來源仍重新讀實際 CHAR_ARM：

- BATTLE_GetAttackCount
- BATTLE_TargetListSet 的 Bow 判定
- BATTLE_GuardianCheck 的 BATTLE_IsThrowWepon
- BATTLE_CounterCheckPlayer/Pet 的 BATTLE_IsThrowWepon
- BATTLE_CriticalCheckPlayer 的 ITEM_CRITICAL
- BATTLE_AttackSeq critical damage 內的 local gWeponType = BATTLE_GetWepon()

因此 V1.25 不修改 unit.weaponType / throwWeapon 本體，而是只把 BATTLE_DuckCheck 對應的 outer weapon type 覆寫為 FIST。

特別是 actual Bow：
- global gWeponType 已不是 Bow，所以 BATTLE_DuckCheck 不再吃原 Bow 的 +20 / +20 回避加成
- critical damage 仍因 local BATTLE_GetWepon()==Bow 而不加 CriDamageCalc 的額外防禦傷害
- Guardian / Counter 仍因實際遠距武器而被阻止

### Other actual ranged weapons

- Boomerang：不再把 ATTACK 轉成 BATTLE_COM_BOOMERANG，不走 30% 橫掃；改走 FIST/BH 單目標
- BoundThrow：改走 FIST/BH；現行 AttackNum=1
- BreakThrow：改走 FIST/BH，且不建立 paralysis；現行 AttackNum=1

### Regression targets

- game.js syntax PASS
- fox gate：ATTACK forceFist=true；GUARD/NONE 不阻擋也不 force
- normal non-fox ranged behavior完全不變
- fox + Bow：AttackNum RNG 在 Bow target-list RNG 之前
- fox + Bow：第一擊使用原 COM2；後續從 aDefList[1] 開始
- bow list 空／死格走 BATTLE_DefaultAttacker uniform fallback，而不是 skip
- fox + Bow：sourceOuterWeaponType=FIST，所以 DuckCheck 不加 Bow +40%
- actual Bow critical 判定／critical damage仍讀 actual weaponType=4
- fox + Boomerang 不走 BOOMERANG 30% 橫掃
- fox + BreakThrow 不做 paralysis
- V1.24 BecomeFox lifecycle / 31% RNG regression 不回退
- V1.18 Ultimate / death branch regression 不回退


## V1.26 Player creation elements / no guessed NONE attribute

固定來源仍為 gavinlinasd/StoneAge@1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56。

V1.25 以前沒有保存玩家創角時的 CHAR_EARTHAT / WATERAT / FIREAT / WINDAT。
舊 web 的 battleBaseElements() 對缺值會回空 object，後續 BATTLE_GetAttr 等價成 none=100。
這個 fallback 雖可讓戰鬥繼續，但不是固定原 C 能證明的玩家創角值。

V1.26 移除這個猜值：舊存檔元素保持 unknown，直到玩家自己依原創角規則確認。

### Fixed CHAR_makeCharFromOptionAtCreate rules

原 gmsv/src/char/char.c：

- earth / water / fire / wind 每項必須 0..10
- 四項總和必須剛好 10
- 非 0 屬性最多兩種
- Earth + Fire 禁止
- Water + Wind 禁止
- 寫入角色時各自乘 10：
  - CHAR_EARTHAT = earth * 10
  - CHAR_WATERAT = water * 10
  - CHAR_FIREAT = fire * 10
  - CHAR_WINDAT = wind * 10

因此合法例子包含：
- 10/0/0/0 => Earth 100
- 5/5/0/0 => Earth 50 / Water 50
- 0/5/5/0 => Water 50 / Fire 50
- 0/0/5/5 => Fire 50 / Wind 50
- 5/0/0/5 => Earth 50 / Wind 50

而 5/0/5/0、0/5/0/5、三屬並存、總和不是 10 都是原 C invalid。

### Save migration

save schema 22 -> 23。

對 schema < 23：
- elements = null
- playerElementsConfigured = false
- 不從等級、能力值、寵物、地圖或既有戰鬥倒推元素

V1.26 確認成功後才持久化：
- playerElementsConfigured = true
- elements 使用原 CHAR 百分值 0..100

確認後 UI 永久鎖定，不提供免費重配，對齊「創角 option」而不是一般能力點。

### Battle gate

玩家元素未設定時：
- 自動遇敵 / 戰鬥 tick 等待
- UI 明確顯示「等待元素配點」
- 不再把 unknown player element 偷換成 none=100

確認後 existing physical / magic element pipeline 直接讀 state.elements，不另寫第二套公式。

### Regression targets

- game.js syntax PASS
- schema 23 fresh save => unconfigured / elements null
- schema 22 migration => unconfigured / elements null even if unrelated old state exists
- valid pure / adjacent dual allocations PASS
- invalid total, fractional, >10, >2 elements, Earth+Fire, Water+Wind FAIL
- stored CHAR values must be multiples of 10 and map back to a valid 10-point creation allocation
- confirmation writes point*10 and locks permanently
- unconfigured player battleBaseElements returns null, not NONE=100
- configured player battleBaseElements returns exact stored source values
- tick does not spawn/fight before configuration
- V1.25 fox ranged regression unchanged
- V1.24 BecomeFox lifecycle / 31% regression unchanged
- V1.18 Ultimate / death branch regression unchanged


