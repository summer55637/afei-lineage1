import { validatePersistentState } from './stoneage_persistent_state.mjs';

const BROWSER_WORLD_ENCOUNTER_GROUP_RUNTIME_FORMAT='stoneage-browser-world-encounter-group-runtime-v1';
const ACTION_WORLD_ENCOUNTER_GROUP_SELECT='WORLD_ENCOUNTER_GROUP_SELECT';
const GROUP_CATALOG_FORMAT='stoneage-start-encounter-group-runtime-v1';
const ENCOUNTER_TARGET_INDEX_FORMAT='stoneage-start-encounter-target-index-v1';
const SOURCE_REPOSITORY='gavinlinasd/StoneAge';
const SOURCE_REF='1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56';
const GROUP_BLOB_SHA='1be75eb3e56ab16d4b433146ec59538ad651c874';
const ENEMY_BLOB_SHA='bf245a391adeace09915b6e425754b54ab69a8f6';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const toInt=value=>{
  const s=String(value??'').trim();
  if(s==='')return null;
  const m=s.match(/^[+-]?\d+/);
  return m?Number(m[0]):null;
};

function hasPlayerItem(state,itemId){
  const wanted=toInt(itemId);
  if(wanted==null||wanted<0)return false;
  const slots=state?.inventory?.playerItemSlots;
  const runtime=state?.inventory?.itemRuntime?.slots;
  if(!Array.isArray(slots)||!isObject(runtime))return false;
  for(const ref of slots){
    if(ref==null)continue;
    const item=runtime[String(toInt(ref))];
    if(!isObject(item))continue;
    const actual=toInt(item.itemId??item.data?.[0]);
    if(actual===wanted)return true;
  }
  return false;
}

function groupGate(group,state){
  const appear=toInt(group?.appearByItemId);
  const notAppear=toInt(group?.notAppearByItemId);
  if(appear!=null&&appear!==-1&&!hasPlayerItem(state,appear))return {eligible:false,reason:'required-item-missing',itemId:appear};
  if(notAppear!=null&&notAppear!==-1&&hasPlayerItem(state,notAppear))return {eligible:false,reason:'excluded-item-present',itemId:notAppear};
  return {eligible:true,reason:'item-gates-pass'};
}

function validateCatalog(catalog){
  const errors=[];
  if(!isObject(catalog))errors.push('group catalog must be an object');
  if(catalog?.format!==GROUP_CATALOG_FORMAT)errors.push('group catalog format mismatch');
  if(catalog?.fixedSource?.repository!==SOURCE_REPOSITORY)errors.push('group catalog source repository mismatch');
  if(catalog?.fixedSource?.ref!==SOURCE_REF)errors.push('group catalog source ref mismatch');
  if(catalog?.fixedSource?.groupBlobSha!==GROUP_BLOB_SHA)errors.push('group blob sha mismatch');
  if(catalog?.fixedSource?.enemyBlobSha!==ENEMY_BLOB_SHA)errors.push('enemy blob sha mismatch');
  if(!Array.isArray(catalog?.groups))errors.push('group catalog groups missing');
  return {ok:errors.length===0,errors};
}

function selectEncounterGroup(encounter,state,catalog,{groupRoll=null}={}){
  const stateErrors=validatePersistentState(state);
  if(stateErrors.length)return {ok:false,handled:false,stage:'group-state-validation',reason:'persistent-state-invalid',errors:stateErrors,state:clone(state)};
  if(!isObject(encounter))return {ok:false,handled:false,stage:'group-selection',reason:'prepared-encounter-required',state:clone(state)};
  const ids=Array.isArray(encounter.groupIds)?encounter.groupIds.map(toInt).filter(v=>v!=null):[];
  const probs=Array.isArray(encounter.groupProbs)?encounter.groupProbs:[];
  if(!ids.length)return {ok:false,handled:false,stage:'group-selection',reason:'encounter-group-ids-missing',state:clone(state)};
  if(probs.length<ids.length)return {ok:false,handled:false,stage:'group-selection',reason:'encounter-group-probabilities-missing',state:clone(state)};
  const byId=new Map((catalog.groups??[]).map(row=>[Number(row.groupId),row]));
  const candidates=[];
  for(let i=0;i<ids.length;i++){
    const groupId=ids[i],weight=toInt(probs[i])??0,group=byId.get(groupId);
    if(weight<=0)continue;
    if(!group||group.status!=='resolved'){
      continue;
    }
    const gate=groupGate(group,state);
    candidates.push({groupId,weight,group,gate});
  }
  const eligible=candidates.filter(x=>x.gate.eligible);
  const totalWeight=eligible.reduce((sum,x)=>sum+x.weight,0);
  if(totalWeight<=0)return {
    ok:false,handled:false,stage:'group-selection',reason:'no-eligible-group',
    candidates:candidates.map(x=>({groupId:x.groupId,weight:x.weight,gate:x.gate})),
    state:clone(state)
  };
  const roll=toInt(groupRoll);
  if(roll==null||roll<0||roll>=totalWeight){
    return {
      ok:false,handled:false,stage:'group-selection',reason:'group-rng-required-or-out-of-range',
      groupRoll:roll,totalWeight,
      candidates:eligible.map(x=>({groupId:x.groupId,weight:x.weight})),
      state:clone(state)
    };
  }
  let cursor=0,selected=null;
  for(const candidate of eligible){
    cursor+=candidate.weight;
    if(roll<cursor){selected=candidate;break;}
  }
  if(!selected)return {ok:false,handled:false,stage:'group-selection',reason:'group-selection-internal-miss',state:clone(state)};
  return {
    ok:true,
    handled:true,
    stage:'group-selected',
    format:BROWSER_WORLD_ENCOUNTER_GROUP_RUNTIME_FORMAT,
    action:ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
    encounterId:toInt(encounter.encounterId),
    group:{
      groupId:selected.groupId,
      weight:selected.weight,
      appearByItemId:toInt(selected.group.appearByItemId),
      notAppearByItemId:toInt(selected.group.notAppearByItemId),
      members:clone(selected.group.members)
    },
    selection:{
      groupRoll:roll,
      totalWeight,
      eligibleGroupIds:eligible.map(x=>x.groupId)
    },
    rngConsumed:true,
    battleStarted:false,
    persistentMutation:false,
    state:clone(state)
  };
}

function createBrowserWorldEncounterGroupRuntime({groupCatalog=null}={}){
  const check=validateCatalog(groupCatalog);
  if(!check.ok)return {ok:false,format:BROWSER_WORLD_ENCOUNTER_GROUP_RUNTIME_FORMAT,reason:'dependency-validation-failed',errors:check.errors};
  return {
    ok:true,
    format:BROWSER_WORLD_ENCOUNTER_GROUP_RUNTIME_FORMAT,
    select:(encounter,state,options={})=>selectEncounterGroup(encounter,state,groupCatalog,options)
  };
}

export {
  BROWSER_WORLD_ENCOUNTER_GROUP_RUNTIME_FORMAT,
  ACTION_WORLD_ENCOUNTER_GROUP_SELECT,
  GROUP_CATALOG_FORMAT,
  ENCOUNTER_TARGET_INDEX_FORMAT,
  SOURCE_REPOSITORY,
  SOURCE_REF,
  GROUP_BLOB_SHA,
  ENEMY_BLOB_SHA,
  hasPlayerItem,
  groupGate,
  validateCatalog,
  selectEncounterGroup,
  createBrowserWorldEncounterGroupRuntime
};
