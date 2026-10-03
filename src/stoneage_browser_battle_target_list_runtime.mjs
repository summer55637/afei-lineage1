const BROWSER_BATTLE_TARGET_LIST_RUNTIME_FORMAT='stoneage-v450-browser-battle-target-list-v1';
const ACTION_BATTLE_TARGET_LIST_RESOLVE='BATTLE_TARGET_LIST_RESOLVE';
const SIDE_OFFSET=10;
const BATTLE_ENTRY_MAX=10;
const ITEM_BOW=4;
const A_BOW_W=Object.freeze([
  0,2,1,4,3,0,1,2,3,4,
  1,0,3,2,4,1,3,0,2,4,
  2,4,0,1,3,2,0,4,1,3,
  3,1,0,2,4,3,1,0,2,4,
  4,2,0,1,3,4,2,0,1,3
]);
const int=value=>{if(value==null||String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)&&Number.isInteger(n)?n:null;};

function resolveTargetList({
  attackNo=null,
  requestedTargetBid=null,
  weaponType=null,
  bowRowRoll=null
}={}){
  const attack=int(attackNo),defNo=int(requestedTargetBid);
  if(attack==null||attack<0||attack>19)return {ok:false,handled:false,stage:'battle-target-list',action:ACTION_BATTLE_TARGET_LIST_RESOLVE,reason:'attack-bid-required'};
  if(defNo==null||defNo<0||defNo>19)return {ok:false,handled:false,stage:'battle-target-list',action:ACTION_BATTLE_TARGET_LIST_RESOLVE,reason:'target-bid-required'};
  const isBow=int(weaponType)===ITEM_BOW||String(weaponType??'').trim().toLowerCase()==='bow';
  if(!isBow){
    return {
      ok:true,handled:true,stage:'battle-target-list-basic',
      format:BROWSER_BATTLE_TARGET_LIST_RUNTIME_FORMAT,
      action:ACTION_BATTLE_TARGET_LIST_RESOLVE,
      attackNo:attack,requestedTargetBid:defNo,weaponType,
      targets:[defNo],
      targetCount:1,
      rngConsumed:0,
      revalidateAliveAtExecution:true,
      source:{repository:'gavinlinasd/StoneAge',ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',function:'BATTLE_TargetListSet'}
    };
  }
  const roll=int(bowRowRoll);
  if(roll==null||roll<0||roll>1)return {ok:false,handled:false,stage:'battle-target-list-bow',action:ACTION_BATTLE_TARGET_LIST_RESOLVE,reason:'bow-row-rng-required-or-out-of-range'};
  const defsub=defNo%5;
  const deftop=defNo-defsub;
  const targets=[];
  for(let j=0;j<5;j++){
    let first=A_BOW_W[defsub*10+roll*5+j]+deftop;
    let second=deftop===0||deftop===10?first+5:first-5;
    if(first===attack)first=-1;
    if(second===attack)second=-1;
    targets.push(first,second);
  }
  return {
    ok:true,handled:true,stage:'battle-target-list-bow',
    format:BROWSER_BATTLE_TARGET_LIST_RUNTIME_FORMAT,
    action:ACTION_BATTLE_TARGET_LIST_RESOLVE,
    attackNo:attack,requestedTargetBid:defNo,weaponType:'bow',
    bowRowRoll:roll,defsub,deftop,
    targets,
    targetCount:targets.filter(x=>x>=0).length,
    terminator:-1,
    rngConsumed:1,
    revalidateAliveAtExecution:true,
    source:{
      repository:'gavinlinasd/StoneAge',
      ref:'1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
      function:'BATTLE_TargetListSet',
      constants:{aBowWLength:50}
    }
  };
}
function createBrowserBattleTargetListRuntime(){
  return {ok:true,format:BROWSER_BATTLE_TARGET_LIST_RUNTIME_FORMAT,resolve:(options={})=>resolveTargetList(options)};
}
export {
  BROWSER_BATTLE_TARGET_LIST_RUNTIME_FORMAT,
  ACTION_BATTLE_TARGET_LIST_RESOLVE,
  A_BOW_W,
  resolveTargetList,
  createBrowserBattleTargetListRuntime
};
