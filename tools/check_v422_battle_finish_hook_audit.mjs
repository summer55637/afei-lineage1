#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_battle_finish_hook_audit.json','utf8'));
assert.equal(audit.format,'stoneage-battle-finish-hook-audit-v1');
assert.equal(audit.fixedSource.repository,'gavinlinasd/StoneAge');
assert.equal(audit.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(audit.worldEncounter.createFunction,'BATTLE_CreateVsEnemy(fd_charaindex,0,-1)');
assert.equal(audit.worldEncounter.battleType,'BATTLE_TYPE_P_vs_E');
assert.equal(audit.worldEncounter.winFuncInjected,false);
assert.equal(audit.npcEnemy.winFuncInjected,true);
assert.equal(audit.npcEnemy.winFunc,'NPC_NPCEnemy_Dying');
assert.equal(audit.pvp.pkFuncInjected,true);
assert.equal(audit.dantai.condition,'BATTLE_TYPE_P_vs_P && DANTAI');
assert.equal(audit.browserPolicy.syntheticHookRegistration,false);
console.log('V4.22 Battle Finish hook audit: PASS');
