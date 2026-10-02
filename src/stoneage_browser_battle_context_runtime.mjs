const BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT='stoneage-browser-battle-context-runtime-v1';
const ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD='ENCOUNTER_BATTLE_CONTEXT_BUILD';
const BATTLE_TYPE_P_VS_E=1;
const BATTLE_S_TYPE_PLAYER=0;
const BATTLE_S_TYPE_ENEMY=1;
const BATTLE_ENTRY_MAX=10;
const BATTLE_PLAYER_MAX=5;
const SIDE_OFFSET=10;
import { materializeEnemyCoreStats } from './stoneage_browser_world_encounter_enemy_core_stat_runtime.mjs';

const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const BATTLE_FINISH_HOOK_AUDIT_FORMAT='stoneage-battle-finish-hook-audit-v1';
const ORDINARY_WORLD_FINISH_HOOK_PROFILE=Object.freeze({
  auditFormat:BATTLE_FINISH_HOOK_AUDIT_FORMAT,
  profile:'ordinary-world-encounter',
  winFuncInjected:false,
  pkFuncInjected:false,
  dantai:false,
  linkedBattleCount:0
});

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=value=>{const s=String(value??'').trim();if(s==='')return null;const m=s.match(/^[+-]?\d+/);return m?Number(m[0]):null;};
function playerWorkFromState(player){
  const stats=player?.stats;
  if(!stats||typeof stats!=='object')return {ok:false,reason:'player-combat-stats-required'};
  const vital=intOr(stats.vital),str=intOr(stats.str),tgh=intOr(stats.tgh),dex=intOr(stats.dex);
  if([vital,str,tgh,dex].some(v=>v==null||v<0))return {ok:false,reason:'player-combat-stats-invalid'};
  return {
    ok:true,
    fixStr:Math.trunc(str+tgh*0.1+vital*0.1+dex*0.05),
    fixTgh:Math.trunc(tgh+str*0.1+vital*0.1+dex*0.05),
    fixDex:dex,
    fixLuck:intOr(player?.luck)??0
  };
}
function petWorkFromState(pet){
  const st=pet?.stats;
  if(!st||typeof st!=='object')return {ok:true,fixStr:null,fixTgh:null,fixDex:null,fixLuck:0,snapshotPending:true};
  const vital=intOr(st.vital),str=intOr(st.str),tgh=intOr(st.tgh),dex=intOr(st.dex);
  if([vital,str,tgh,dex].some(v=>v==null||v<0))return {ok:true,fixStr:null,fixTgh:null,fixDex:null,fixLuck:0,snapshotPending:true,reason:'pet-combat-stats-invalid'};
  const fixDex=Math.trunc(dex*0.01);
  const fixStr=Math.trunc(str*0.01+tgh*0.01*0.1+vital*0.01*0.1+dex*0.01*0.05);
  const fixTgh=Math.trunc(tgh*0.01+str*0.01*0.1+vital*0.01*0.1+dex*0.01*0.05);
  return {ok:true,fixStr,fixTgh,fixDex,fixLuck:0,snapshotPending:false};
}


const SOURCE_ENTRY_INIT=Object.freeze({escape:0,getitem:[-1,-1,-1]});
const SOURCE_BATTLE_INIT=Object.freeze({use:true,mode:1,turn:0,dpbattle:0,norisk:0,flg:0,fieldAtt:0,attCount:0});
const SOURCE_BATTLE_ENTRY_RUNTIME_INIT=Object.freeze({battleCharMode:1,battleFlg:0,battleCommands:[-1,-1,-1],modAttack:0,modDefence:0,modQuick:0,damageAbsorb:0,damageReflect:0,damageVanish:0,modCapture:0,isAttacked:1,battleWatch:0});

function hydrateEnemyTeamCoreStats(team,enemyStatRolls=[]){
  if(!Array.isArray(team))return {ok:false,reason:'enemy-team-required'};
  if(!Array.isArray(enemyStatRolls)||enemyStatRolls.length!==team.length)return {ok:false,reason:'enemy-stat-rolls-required',expected:team.length,actual:Array.isArray(enemyStatRolls)?enemyStatRolls.length:null};
  const hydrated=[];
  for(let i=0;i<team.length;i++){
    const member=team[i];
    const template=member?.enemy?{...member.enemy,enemyId:member.enemyId,tempNo:member.enemy?.tempNo}:member;
    const result=materializeEnemyCoreStats(template,enemyStatRolls[i]??{});
    if(!result.ok)return {ok:false,reason:'enemy-core-stat-materialization-failed',rosterIndex:i,error:result};
    hydrated.push({...member,coreStats:result});
  }
  return {ok:true,team:hydrated};
}

function buildEnemyEntryLayout(team){
  if(!Array.isArray(team)||team.length<1)return {ok:false,reason:'enemy-team-required'};
  if(team.length>BATTLE_ENTRY_MAX)return {ok:false,reason:'enemy-team-entry-max-exceeded',count:team.length};
  const preSwap=Array(BATTLE_ENTRY_MAX).fill(null);
  for(let i=0;i<team.length;i++){
    const enemy=team[i];
    if(!isObject(enemy))return {ok:false,reason:'enemy-team-member-invalid',slot:i};
    const enemyId=intOr(enemy.enemyId);
    if(enemyId==null)return {ok:false,reason:'enemy-id-required',slot:i};
    preSwap[i]={
      sourceRosterIndex:i,
      enemyId,
      size:intOr(enemy.size)??0,
      createMaxNum:intOr(enemy.createMaxNum)??null,
      sourceTempNo:intOr(enemy.enemy?.tempNo)??null,
      coreStats:enemy.coreStats?clone(enemy.coreStats):null,
      sourceEnemyAi:enemy.enemy?.ai?clone(enemy.enemy.ai):(enemy.sourceEnemyAi?clone(enemy.sourceEnemyAi):null),
      sourceDropTable:Array.isArray(enemy.enemy?.dropTable)?clone(enemy.enemy.dropTable):(Array.isArray(enemy.sourceDropTable)?clone(enemy.sourceDropTable):[])
    };
  }
  const entries=Array(BATTLE_ENTRY_MAX).fill(null);
  for(let i=0;i<5;i++){
    const a=preSwap[i],b=preSwap[i+5];
    entries[i]=b?clone(b):null;
    entries[i+5]=a?clone(a):null;
  }
  return {ok:true,preSwap,entries};
}

function buildBattleContext({
  playerId=null,player=null,playerElements=null,activePet=null,team=null,encounter=null,groupId=null,battleFieldNo=null,materializeEnemyStats=false,enemyStatRolls=[]
}={}){
  if(!isObject(player))return {ok:false,handled:false,stage:'battle-context',reason:'player-runtime-required'};
  if(intOr(player.hp)===null||intOr(player.maxHp)===null)return {ok:false,handled:false,stage:'battle-context',reason:'player-hp-runtime-required'};
  if(intOr(player.hp)<=0)return {ok:false,handled:false,stage:'battle-context',reason:'player-dead-cannot-start-battle'};
  let enemyTeam=Array.isArray(team)?team:[];
  let enemyCoreHydration=null;
  if(materializeEnemyStats===true){
    enemyCoreHydration=hydrateEnemyTeamCoreStats(enemyTeam,enemyStatRolls);
    if(!enemyCoreHydration.ok)return {ok:false,handled:false,stage:'battle-context',reason:enemyCoreHydration.reason,detail:enemyCoreHydration};
    enemyTeam=enemyCoreHydration.team;
  }
  const enemyLayout=buildEnemyEntryLayout(enemyTeam);
  if(!enemyLayout.ok)return {ok:false,handled:false,stage:'battle-context',reason:enemyLayout.reason,detail:enemyLayout};
  const field=intOr(battleFieldNo);
  if(field==null||field<0)return {ok:false,handled:false,stage:'battle-context',reason:'battle-field-no-required'};
  const playerWork=playerWorkFromState(player);
  if(!playerWork.ok)return {ok:false,handled:false,stage:'battle-context',reason:playerWork.reason,detail:playerWork};
  const playerEntry={
    sourceType:'player',
    sourcePartyMode:0,
    sourceAiTargetStats:{str:intOr(player?.stats?.str,0)*100,dex:intOr(player?.stats?.dex,0)*100},
    sourceAiElements:isObject(playerElements)?clone(playerElements):null,
    characterId:String(playerId??player.id??'player').trim()||'player',
    battleSlot:0,
    bid:0,
    stateId:'player',
    name:String(player.name??'').trim(),
    level:intOr(player.level)??1,
    hp:intOr(player.hp)??0,
    maxHp:intOr(player.maxHp)??0,
    mp:intOr(player.mp)??0,
    maxMp:intOr(player.maxMp)??0,
    battleMode:'init',
    sourceBattleCharMode:1,
    battleSide:BATTLE_S_TYPE_PLAYER,
    battleFlg:0,
    battleCommands:[-1,-1,-1],
    modAttack:0,
    modDefence:0,
    modQuick:0,
    damageAbsorb:0,
    damageReflect:0,
    damageVanish:0,
    modCapture:0,
    isAttacked:1,
    battleWatch:0,
    isDie:false,
    deadCount:0,
    battleOutcomeFlags:0,
    ultimate:0,
    workUltimate:intOr(player?.workUltimate)??0,
    relife:0,
    duelPoint:intOr(player?.duelPoint)??0,
    workGetExp:intOr(player?.workGetExp)??0,
    escape:0,
    getitem:[-1,-1,-1],
    fixStr:playerWork.fixStr,
    fixTgh:playerWork.fixTgh,
    fixDex:playerWork.fixDex,
    fixLuck:playerWork.fixLuck,
    quick:playerWork.fixDex,
    attackPower:playerWork.fixStr,
    defencePower:playerWork.fixTgh
  };
  if(activePet&&isObject(activePet)&&(intOr(activePet.hp)??0)<=0)return {ok:false,handled:false,stage:'battle-context',reason:'active-pet-dead-cannot-start-battle'};
  let petWork=null;
  if(activePet&&isObject(activePet)){
    petWork=petWorkFromState(activePet);
    if(!petWork.ok)return {ok:false,handled:false,stage:'battle-context',reason:petWork.reason,detail:petWork};
  }
  const petEntry=activePet&&isObject(activePet)?{
    sourceType:'pet',
    sourcePartyMode:0,
    sourceAiTargetStats:isObject(activePet.stats)?{str:intOr(activePet.stats.str,0),dex:intOr(activePet.stats.dex,0)}:null,
    sourceAiElements:isObject(activePet.elements)?clone(activePet.elements):(isObject(activePet.sourceElements)?clone(activePet.sourceElements):null),
    characterId:String(activePet.id??activePet.petId??'pet').trim()||'pet',
    battleSlot:5,
    bid:5,
    stateId:String(activePet.id??activePet.petId??'pet').trim()||'pet',
    petId:intOr(activePet.petId)??null,
    tempNo:intOr(activePet.tempNo)??null,
    name:String(activePet.name??'').trim(),
    level:intOr(activePet.level)??1,
    hp:intOr(activePet.hp)??0,
    maxHp:intOr(activePet.maxHp)??0,
    mp:intOr(activePet.mp)??0,
    maxMp:intOr(activePet.maxMp)??0,
    battleMode:'init',
    sourceBattleCharMode:1,
    battleSide:BATTLE_S_TYPE_PLAYER,
    battleFlg:0,
    battleCommands:[-1,-1,-1],
    modAttack:0,
    modDefence:0,
    modQuick:0,
    damageAbsorb:0,
    damageReflect:0,
    damageVanish:0,
    modCapture:0,
    isAttacked:1,
    battleWatch:0,
    isDie:false,
    deadCount:0,
    battleOutcomeFlags:0,
    ultimate:0,
    workUltimate:intOr(activePet?.workUltimate)??0,
    relife:0,
    duelPoint:intOr(activePet?.duelPoint)??0,
    workGetExp:intOr(activePet?.workGetExp)??0,
    escape:0,
    getitem:[-1,-1,-1],
    fixStr:petWork?.fixStr??0,
    fixTgh:petWork?.fixTgh??0,
    fixDex:petWork?.fixDex??0,
    fixLuck:petWork?.fixLuck??0,
    quick:petWork?.fixDex??0,
    attackPower:petWork?.fixStr??0,
    defencePower:petWork?.fixTgh??0
  }:null;
  const enemyEntries=enemyLayout.entries.map((entry,slot)=>{
    if(!entry)return null;
    return {
      sourceType:'enemy',
      sourcePartyMode:0,
      sourceAiTargetStats:entry.coreStats?.stats?{str:intOr(entry.coreStats.stats.str),dex:intOr(entry.coreStats.stats.dex)}:null,
      sourceAiElements:entry.coreStats?.sourceTemplate?.element?clone(entry.coreStats.sourceTemplate.element):null,
      characterId:`encounter-${intOr(encounter?.encounterId)??'unknown'}-${entry.sourceRosterIndex}-${entry.enemyId}`,
      sourceRosterIndex:entry.sourceRosterIndex,
      battleSlot:slot,
      bid:slot+SIDE_OFFSET,
      enemyId:entry.enemyId,
      sourceTempNo:entry.sourceTempNo,
      size:entry.size,
      createMaxNum:entry.createMaxNum,
      hp:null,
      maxHp:null,
      mp:null,
      maxMp:null,
      battleMode:'init',
      level:entry.coreStats?.level??null,
      hp:entry.coreStats?.derived?.hp??null,
      maxHp:entry.coreStats?.derived?.maxHp??null,
      mp:entry.coreStats?.derived?.mp??null,
      maxMp:entry.coreStats?.derived?.maxMp??null,
      stats:entry.coreStats?clone(entry.coreStats.stats):null,
      derived:entry.coreStats?clone(entry.coreStats.derived):null,
      rank:entry.coreStats?.rank??null,
      elements:entry.coreStats?clone(entry.coreStats.sourceTemplate.element):null,
      resist:entry.coreStats?clone(entry.coreStats.sourceTemplate.resist):null,
      sourceCoreStats:entry.coreStats?clone(entry.coreStats):null,
      sourceEnemyAi:entry.sourceEnemyAi?clone(entry.sourceEnemyAi):null,
      sourceDropTable:Array.isArray(entry.sourceDropTable)?clone(entry.sourceDropTable):[],
      sourceDropRollsResolved:false,
      sourceBattleCharMode:1,
      battleSide:BATTLE_S_TYPE_ENEMY,
      battleFlg:0,
      battleCommands:[-1,-1,-1],
      modAttack:0,
      modDefence:0,
      modQuick:0,
      damageAbsorb:0,
      damageReflect:0,
      damageVanish:0,
      modCapture:0,
      isAttacked:1,
      battleWatch:0,
      isDie:false,
      deadCount:0,
      battleOutcomeFlags:0,
      ultimate:0,
      workUltimate:0,
      relife:0,
      duelPoint:intOr(entry.coreStats?.sourceTemplate?.duelPoint)??0,
      workGetExp:0,
      escape:0,
      getitem:[-1,-1,-1],
      fixStr:entry.coreStats?.derived?.fixStr??null,
      fixTgh:entry.coreStats?.derived?.fixTgh??null,
      fixDex:entry.coreStats?.derived?.fixDex??null,
      fixLuck:0,
      quick:entry.coreStats?.derived?.fixDex??null,
      attackPower:entry.coreStats?.derived?.fixStr??null,
      defencePower:entry.coreStats?.derived?.fixTgh??null
    };
  });
  return {
    ok:true,handled:true,stage:'battle-context-built',
    format:BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
    action:ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
    context:{
      battleindex:null,
      use:true,
      mode:'init',
      sourceMode:SOURCE_BATTLE_INIT.mode,
      type:BATTLE_TYPE_P_VS_E,
      fieldNo:field,
      turn:0,
      dpbattle:0,
      norisk:0,
      flg:0,
      fieldAtt:0,
      attCount:0,
      damageCommitRevision:0,
      damageCommitReceipts:{},
      sourceBattleInit:clone(SOURCE_BATTLE_INIT),
      sourceEntryInit:clone(SOURCE_ENTRY_INIT),
      sourceBattleEntryRuntimeInit:clone(SOURCE_BATTLE_ENTRY_RUNTIME_INIT),
      enemyCoreStatHydrated:materializeEnemyStats===true,
      enemyCoreStatRngRollCount:materializeEnemyStats===true?enemyCoreHydration.team.reduce((n,e)=>n+(e.coreStats?.rngConsumedCount??0),0):0,
      conditionalResetsOmitted:['PROFESSION_SKILL','PETSKILL_ACUPUNCTURE','PETSKILL_RETRACE','PETSKILL_BECOMEFOX','PROFESSION_ADDSKILL'],
      leaderId:playerEntry.characterId,
      sourceEncounter:{
        encounterId:intOr(encounter?.encounterId),
        floorId:intOr(encounter?.floorId),
        x:intOr(encounter?.x),
        y:intOr(encounter?.y)
      },
      sourceGroupId:intOr(groupId),
      finishHookProfile:clone(ORDINARY_WORLD_FINISH_HOOK_PROFILE),
      sides:[
        {
          side:0,type:BATTLE_S_TYPE_PLAYER,entries:[
            playerEntry,
            null,null,null,null,
            petEntry,
            null,null,null,null
          ]
        },
        {side:1,type:BATTLE_S_TYPE_ENEMY,entries:enemyEntries}
      ],
      battleEntryMax:BATTLE_ENTRY_MAX,
      battlePlayerMax:BATTLE_PLAYER_MAX,
      sideOffset:SIDE_OFFSET
    },
    persistentMutation:false,
    battleStarted:false,
    rngConsumed:false,
    source:{repository:SOURCE_REPOSITORY,ref:SOURCE_REF}
  };
}

function validateBattleContext(context){
  const errors=[];
  if(!isObject(context))errors.push('battle context must be object');
  if(context?.format!==BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT)errors.push('battle context format mismatch');
  if(context?.context?.type!==BATTLE_TYPE_P_VS_E)errors.push('battle type must be P_vs_E');
  const hook=context?.context?.finishHookProfile;
  if(hook?.auditFormat!==BATTLE_FINISH_HOOK_AUDIT_FORMAT)errors.push('finish hook audit format mismatch');
  if(hook?.profile!=='ordinary-world-encounter')errors.push('finish hook profile must be ordinary-world-encounter');
  if(hook?.winFuncInjected!==false)errors.push('ordinary world encounter must not inject WinFunc');
  if(hook?.pkFuncInjected!==false)errors.push('ordinary world encounter must not inject PkFunc');
  if(hook?.dantai!==false)errors.push('ordinary world encounter must not use DANTAI finish hook');
  if(hook?.linkedBattleCount!==0)errors.push('ordinary world encounter must not contain linked battles');
  if(!Array.isArray(context?.context?.sides)||context.context.sides.length!==2)errors.push('two battle sides required');
  const side0=context?.context?.sides?.[0],side1=context?.context?.sides?.[1];
  if(side0?.type!==BATTLE_S_TYPE_PLAYER)errors.push('side0 must be PLAYER');
  if(side1?.type!==BATTLE_S_TYPE_ENEMY)errors.push('side1 must be ENEMY');
  if(!Array.isArray(side0?.entries)||side0.entries.length!==10)errors.push('side0 needs 10 entries');
  if(!Array.isArray(side1?.entries)||side1.entries.length!==10)errors.push('side1 needs 10 entries');
  return {ok:errors.length===0,errors};
}

export {
  BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT,
  ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD,
  BATTLE_TYPE_P_VS_E,
  BATTLE_S_TYPE_PLAYER,
  BATTLE_S_TYPE_ENEMY,
  BATTLE_ENTRY_MAX,
  BATTLE_PLAYER_MAX,
  SIDE_OFFSET,
  SOURCE_ENTRY_INIT,
  SOURCE_BATTLE_INIT,
  SOURCE_BATTLE_ENTRY_RUNTIME_INIT,
  hydrateEnemyTeamCoreStats,
  buildEnemyEntryLayout,
  buildBattleContext,
  validateBattleContext,
  BATTLE_FINISH_HOOK_AUDIT_FORMAT,
  ORDINARY_WORLD_FINISH_HOOK_PROFILE
};
