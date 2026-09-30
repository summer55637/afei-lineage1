const BROWSER_WORLD_ENCOUNTER_ENEMY_RUNTIME_FORMAT='stoneage-browser-world-encounter-enemy-runtime-v1';
const ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE='WORLD_ENCOUNTER_ENEMY_GENERATE';
const GROUP_RUNTIME_FORMAT='stoneage-start-encounter-group-runtime-v1';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const toInt=value=>{const s=String(value??'').trim();if(s==='')return null;const m=s.match(/^[+-]?\d+/);return m?Number(m[0]):null;};
const RANDOM_ENEMY_RANGES=[[945,956],[964,969]];

function isSpecialRandomEnemy(enemyId){
  const id=toInt(enemyId);
  return id!=null&&RANDOM_ENEMY_RANGES.some(([a,b])=>id>=a&&id<=b);
}

function weightedSelect(candidates,roll){
  const total=candidates.reduce((n,c)=>n+c.weight,0);
  const r=toInt(roll);
  if(r==null||r<0||r>=total)return {ok:false,reason:'enemy-rng-required-or-out-of-range',totalWeight:total,roll:r};
  let cursor=0;
  for(const c of candidates){
    cursor+=c.weight;
    if(r<cursor)return {ok:true,candidate:c,totalWeight:total,roll:r};
  }
  return {ok:false,reason:'enemy-selection-internal-miss',totalWeight:total,roll:r};
}

function resolveSelectedGroup(encounter,groupId,groupCatalog,state,gateResolver){
  const id=toInt(groupId);
  if(id==null)return {ok:false,reason:'group-id-required'};
  const ids=Array.isArray(encounter?.groupIds)?encounter.groupIds.map(toInt).filter(v=>v!=null):[];
  const probs=Array.isArray(encounter?.groupProbs)?encounter.groupProbs:[];
  const index=ids.indexOf(id);
  if(index<0)return {ok:false,reason:'group-not-in-encounter',groupId:id};
  const weight=toInt(probs[index])??0;
  if(weight<=0)return {ok:false,reason:'group-zero-weight',groupId:id};
  const group=(groupCatalog.groups??[]).find(row=>Number(row.groupId)===id);
  if(!group||group.status!=='resolved')return {ok:false,reason:'group-unresolved',groupId:id};
  const gate=gateResolver(group,state);
  if(!gate.eligible)return {ok:false,reason:'group-item-gate-blocked',groupId:id,gate};
  return {ok:true,group,weight};
}

function generateEnemyRoster(encounter,selectedGroup,{entryMaxRoll=null,enemyRolls=[]}={}){
  if(!isObject(encounter))return {ok:false,handled:false,stage:'enemy-generation',reason:'prepared-encounter-required'};
  if(!isObject(selectedGroup))return {ok:false,handled:false,stage:'enemy-generation',reason:'selected-group-required'};
  const rawMembers=Array.isArray(selectedGroup.members)?selectedGroup.members:[];
  const members=rawMembers.map(m=>{
    const enemy=m?.enemy??null;
    const id=toInt(m?.enemyId);
    const weight=toInt(m?.createProb)??0;
    const max=toInt(enemy?.createMaxNum)??0;
    const size=toInt(enemy?.base?.size);
    return {slot:toInt(m?.slot),enemyId:id,weight,createMaxNum:max,createMinNum:toInt(enemy?.createMinNum)??0,size,enemy:clone(enemy)};
  }).filter(m=>m.enemyId!=null&&m.weight>0&&m.createMaxNum>0);
  if(!members.length)return {ok:false,handled:false,stage:'enemy-generation',reason:'selected-group-has-no-spawnable-members'};
  const special=members.find(m=>isSpecialRandomEnemy(m.enemyId));
  if(special)return {ok:false,handled:false,stage:'enemy-generation',reason:'random-enemy-replacement-runtime-required',enemyId:special.enemyId};
  if(members.some(m=>m.size!==0&&m.size!==1))return {ok:false,handled:false,stage:'enemy-generation',reason:'enemy-size-unsupported'};
  const createEnemyNum=members.reduce((n,m)=>n+m.createMaxNum,0);
  const encounterMax=toInt(encounter.enemyMax);
  if(encounterMax==null||encounterMax<1)return {ok:false,handled:false,stage:'enemy-generation',reason:'encounter-enemy-max-invalid'};
  const enemyEntryMax=Math.min(encounterMax,createEnemyNum);
  if(enemyEntryMax<1)return {ok:false,handled:false,stage:'enemy-generation',reason:'enemy-entry-max-zero'};
  const firstRoll=toInt(entryMaxRoll);
  if(firstRoll==null||firstRoll<1||firstRoll>enemyEntryMax)return {ok:false,handled:false,stage:'enemy-generation',reason:'entry-max-rng-required-or-out-of-range',enemyEntryMax,roll:firstRoll};
  let entryMax=firstRoll;
  const working=members.map(m=>({...m}));
  const totalWeight=working.reduce((n,m)=>n+m.weight,0);
  let selected=[];
  let bigCount=0;
  let loopCounter=0;
  let rollCursor=0;
  const maxLoop=100;
  while(selected.length<entryMax&&loopCounter<maxLoop){
    const roll=toInt(enemyRolls[rollCursor++]);
    loopCounter++;
    const pick=weightedSelect(working,roll);
    if(!pick.ok)return {ok:false,handled:false,stage:'enemy-generation',reason:pick.reason,loopCounter,totalWeight,enemyRollsConsumed:rollCursor,partial:clone(selected)};
    const chosen=pick.candidate;
    const sameCount=working.filter(m=>m.enemyId===chosen.enemyId).length;
    const currentCount=selected.filter(m=>m.enemyId===chosen.enemyId).length;
    if(currentCount>=chosen.createMaxNum*sameCount)continue;
    if(chosen.size===1){
      if(bigCount>=5){entryMax--;continue;}
      if(selected.length>4){
        let normalIndex=-1;
        for(let j=0;j<Math.min(5,selected.length);j++){
          if(selected[j].size===0){normalIndex=j;break;}
        }
        if(normalIndex<0)continue;
        selected.push(clone(selected[normalIndex]));
        selected[normalIndex]=clone(chosen);
      }else{
        selected.push(clone(chosen));
      }
      bigCount++;
    }else{
      selected.push(clone(chosen));
    }
  }
  if(selected.length===0)return {ok:false,handled:false,stage:'enemy-generation',reason:'enemy-team-empty',entryMax,loopCounter,enemyRollsConsumed:rollCursor};
  const completed=selected.length===entryMax;
  return {
    ok:true,handled:true,stage:'enemy-generated',
    format:BROWSER_WORLD_ENCOUNTER_ENEMY_RUNTIME_FORMAT,
    action:ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
    encounterId:toInt(encounter.encounterId),
    group:{groupId:toInt(selectedGroup.groupId),weight:toInt(selectedGroup.weight)??null},
    enemyEntryMax,
    requestedEntryMax:firstRoll,
    finalEntryMax:entryMax,
    createEnemyNum,
    team:clone(selected),
    completed,
    loopCounter,
    enemyRollsConsumed:rollCursor,
    rngConsumedCount:rollCursor+1,
    battleStarted:false,
    persistentMutation:false
  };
}

function createBrowserWorldEncounterEnemyRuntime({groupCatalog=null,gateResolver=null}={}){
  if(!isObject(groupCatalog)||groupCatalog.format!==GROUP_RUNTIME_FORMAT){
    return {ok:false,format:BROWSER_WORLD_ENCOUNTER_ENEMY_RUNTIME_FORMAT,reason:'group-catalog-invalid'};
  }
  const gate=typeof gateResolver==='function'?gateResolver:(group,state)=>{
    const appear=toInt(group?.appearByItemId),notAppear=toInt(group?.notAppearByItemId);
    const slots=state?.inventory?.playerItemSlots;
    const runtime=state?.inventory?.itemRuntime?.slots;
    const has=id=>{
      if(id==null||id===-1||!Array.isArray(slots)||!isObject(runtime))return false;
      return slots.some(ref=>{
        const item=runtime[String(toInt(ref))];
        return isObject(item)&&toInt(item.itemId??item.data?.[0])===id;
      });
    };
    if(appear!=null&&appear!==-1&&!has(appear))return {eligible:false,reason:'required-item-missing',itemId:appear};
    if(notAppear!=null&&notAppear!==-1&&has(notAppear))return {eligible:false,reason:'excluded-item-present',itemId:notAppear};
    return {eligible:true,reason:'item-gates-pass'};
  };
  return {
    ok:true,
    format:BROWSER_WORLD_ENCOUNTER_ENEMY_RUNTIME_FORMAT,
    resolveGroup:(encounter,state,groupId)=>resolveSelectedGroup(encounter,groupId,groupCatalog,state,gate),
    generate:(encounter,groupId,state,options={})=>{
      const resolved=resolveSelectedGroup(encounter,groupId,groupCatalog,state,gate);
      if(!resolved.ok)return {ok:false,handled:false,stage:'group-resolution',reason:resolved.reason,groupId:resolved.groupId??toInt(groupId),gate:resolved.gate};
      return generateEnemyRoster(encounter,{...resolved.group,groupId:toInt(groupId),weight:resolved.weight},options);
    }
  };
}

export {
  BROWSER_WORLD_ENCOUNTER_ENEMY_RUNTIME_FORMAT,
  ACTION_WORLD_ENCOUNTER_ENEMY_GENERATE,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  isSpecialRandomEnemy,
  weightedSelect,
  resolveSelectedGroup,
  generateEnemyRoster,
  createBrowserWorldEncounterEnemyRuntime
};
