#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const audit=JSON.parse(fs.readFileSync('data/generated/stoneage_browser_battle_exit_transient_cleanup_audit.json','utf8'));
assert.equal(audit.format,'stoneage-browser-battle-exit-transient-cleanup-audit-v1');
assert.equal(audit.fixedSource.repository,'gavinlinasd/StoneAge');
assert.equal(audit.fixedSource.ref,'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56');
assert.equal(audit.playerTransientCleanup.battleMode,'BATTLE_CHARMODE_FINAL');
assert.equal(audit.playerTransientCleanup.battleIndex,-1);
assert.equal(audit.playerTransientCleanup.badStatusClear,'BATTLE_BadStatusAllClr(player)');
assert.equal(audit.petTransientCleanup.battleMode,'BATTLE_CHARMODE_NONE');
assert.equal(audit.petTransientCleanup.battleIndex,-1);
assert.equal(audit.petTransientCleanup.mailPetSkipped,true);
assert.equal(audit.ridePet.browserPersistentRepresentation,null);
assert.equal(audit.becomePig.browserPersistentRepresentation,null);
assert.match(audit.closureRule,/No persistent field is invented/);
console.log('V4.23 Browser Battle Exit transient cleanup audit: PASS');
