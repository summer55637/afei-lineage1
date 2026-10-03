#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  createBrowserBattleRidePetAdjustRuntime,
  adjustRidePetStats
} from '../src/stoneage_browser_battle_ride_pet_adjust_runtime.mjs';
import {
  damagePlan,
  createBrowserBattleDamagePlanRuntime
} from '../src/stoneage_browser_battle_damage_plan_runtime.mjs';

const ride=createBrowserBattleRidePetAdjustRuntime();
assert.equal(ride.ok,true);

const melee=adjustRidePetStats({
  character:{value:100},pet:{value:80},work:'attack',action:'attack',throwWeapon:false
});
assert.equal(melee.ok,true,JSON.stringify(melee));
assert.equal(melee.value,144);

const thrown=adjustRidePetStats({
  character:{value:100},pet:{value:80},work:'attack',action:'attack',throwWeapon:true
});
assert.equal(thrown.ok,true,JSON.stringify(thrown));
assert.equal(thrown.value,132);

const defence=adjustRidePetStats({
  character:{value:100},pet:{value:80},work:'defence',action:'defence'
});
assert.equal(defence.ok,true,JSON.stringify(defence));
assert.equal(defence.value,126);

const quickMelee=adjustRidePetStats({
  character:{value:100},pet:{value:80},work:'quick',action:'attack',throwWeapon:false
});
assert.equal(quickMelee.value,84);

const quickThrow=adjustRidePetStats({
  character:{value:100},pet:{value:80},work:'quick',action:'attack',throwWeapon:true
});
assert.equal(quickThrow.value,96);

const quickDef=adjustRidePetStats({
  character:{value:100},pet:{value:80},work:'quick',action:'defence'
});
assert.equal(quickDef.value,82);

const noRideContext={format:'stoneage-browser-battle-context-runtime-v1',context:{
  mode:'battle',sourceMode:2,
  fieldAtt:4,attPow:0,
  sides:[
    {side:0,type:0,entries:[{bid:0,attackPower:100,fixStr:100,elements:{fire:0,water:0,earth:0,wind:0}}]},
    {side:1,type:1,entries:[{bid:10,defencePower:50,fixTgh:50,quick:90,fixDex:90,fixVital:40,elements:{fire:0,water:0,earth:0,wind:0}}]}
  ]
}};
const plain=damagePlan(noRideContext,{
  attackerBid:0,targetBid:10,damageRollNear:0,damageRollWide:0,
  includeAttr:false
});
assert.equal(plain.ok,true,JSON.stringify(plain));
assert.equal(plain.defence,35);
assert.equal(plain.fixedCDefensePath,'_BATTLE_NEWPOWER');

const rideContext={format:'stoneage-browser-battle-context-runtime-v1',context:{
  mode:'battle',sourceMode:2,
  fieldAtt:4,attPow:0,
  sides:[
    {side:0,type:0,entries:[
      {bid:0,attackPower:100,fixStr:100,elements:{fire:0,water:0,earth:0,wind:0}},
      null,null,null,null,
      {bid:5,sourceType:'pet',attackPower:80,fixStr:80,defencePower:60,fixTgh:60,quick:80,fixDex:80}
    ]},
    {side:1,type:1,entries:[
      {bid:10,defencePower:50,fixTgh:50,quick:90,fixDex:90,fixVital:40,elements:{fire:0,water:0,earth:0,wind:0}},
      null,null,null,null,
      {bid:15,sourceType:'pet',defencePower:30,fixTgh:30,quick:70,fixDex:70}
    ]}
  ]
}};
const combined=damagePlan(rideContext,{
  attackerBid:0,targetBid:10,damageRollNear:0,damageRollWide:0,
  includeAttr:false,throwWeapon:false,
  ridePetBidByBid:{0:5,10:15},ridePetAdjustRuntime:ride
});
assert.equal(combined.ok,true,JSON.stringify(combined));
assert.equal(combined.attack,144);
assert.ok(Math.abs(combined.defence-39.2)<1e-12);
assert.equal(combined.ridePetAdjustment.attacker.value,144);
assert.equal(combined.ridePetAdjustment.defender.value,56);

const runtime=createBrowserBattleDamagePlanRuntime();
assert.equal(runtime.ok,true);

console.log(JSON.stringify({
  pass:true,
  format:'stoneage-v458-browser-battle-ride-pet-adjust-v1',
  attack:{melee:melee.value,thrown:thrown.value},
  defence:{plain:plain.defence,rideAdjusted:combined.defence,rawRideAdjust:combined.ridePetAdjustment.defender.value},
  quick:{melee:quickMelee.value,thrown:quickThrow.value,defence:quickDef.value},
  noRng:true,
  persistentMutation:false
},null,2));
