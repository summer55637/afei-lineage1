const BROWSER_BATTLE_CONTEXT_RUNTIME_FORMAT='stoneage-browser-battle-context-runtime-v1';
const ACTION_ENCOUNTER_BATTLE_CONTEXT_BUILD='ENCOUNTER_BATTLE_CONTEXT_BUILD';
const BATTLE_TYPE_P_VS_E=1;
const BATTLE_S_TYPE_PLAYER=0;
const BATTLE_S_TYPE_ENEMY=1;
const BATTLE_ENTRY_MAX=10;
const BATTLE_PLAYER_MAX=5;
const SIDE_OFFSET=10;
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=value=>{const s=String(value??'').trim();if(s==='')return null;const m=s.match(/^[+-]?\d+/);return m?Number(m[0]):null;};

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
      sourceTempNo:intOr(enemy.enemy?.tempNo)??null
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
  playerId=null,player=null,activePet=null,team=null,encounter=null,groupId=null,battleFieldNo=null
}={}){
  if(!isObject(player))return {ok:false,handled:false,stage:'battle-context',reason:'player-runtime-required'};
  const enemyTeam=Array.isArray(team)?team:[];
  const enemyLayout=buildEnemyEntryLayout(enemyTeam);
  if(!enemyLayout.ok)return {ok:false,handled:false,stage:'battle-context',reason:enemyLayout.reason,detail:enemyLayout};
  const field=intOr(battleFieldNo);
  if(field==null||field<0)return {ok:false,handled:false,stage:'battle-context',reason:'battle-field-no-required'};
  const playerEntry={
    sourceType:'player',
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
    battleMode:'init'
  };
  const petEntry=activePet&&isObject(activePet)?{
    sourceType:'pet',
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
    battleMode:'init'
  }:null;
  const enemyEntries=enemyLayout.entries.map((entry,slot)=>{
    if(!entry)return null;
    return {
      sourceType:'enemy',
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
      battleMode:'init'
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
      type:BATTLE_TYPE_P_VS_E,
      fieldNo:field,
      turn:0,
      leaderId:playerEntry.characterId,
      sourceEncounter:{
        encounterId:intOr(encounter?.encounterId),
        floorId:intOr(encounter?.floorId),
        x:intOr(encounter?.x),
        y:intOr(encounter?.y)
      },
      sourceGroupId:intOr(groupId),
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
  buildEnemyEntryLayout,
  buildBattleContext,
  validateBattleContext
};
