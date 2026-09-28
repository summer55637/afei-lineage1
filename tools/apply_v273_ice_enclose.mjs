import fs from 'node:fs';
import { execSync } from 'node:child_process';

const path='game.js';
let s=fs.readFileSync(path,'utf8');
const replaceOnce=(oldText,newText,label)=>{
  const count=s.split(oldText).length-1;
  if(count!==1)throw new Error(label+': expected 1 match, got '+count);
  s=s.replace(oldText,newText);
};

replaceOnce(
`  const effectiveOnHitTurn=element==='thunder'
    ?1
    :(attackTier>=10?3:(attackTier>=5?2:1));
  const statusAuraToken=element==='thunder'?'击':'炎';
  const statusHitToken=element==='thunder'?'电':'烧';`,
`  const effectiveOnHitTurn=element==='thunder'
    ?1
    :(attackTier>=10?3:(attackTier>=5?2:1));
  const statusAuraToken=element==='thunder'?'擊':element==='ice'?'凍':'炎';
  const statusHitToken=element==='thunder'?'電':element==='ice'?'霜':'燒';`,
'Enclose aura tokens'
);

replaceOnce(
`  const expectedSkillId=element==='thunder'?16:15;
  const functionName=element==='thunder'?'PROFESSION_THUNDER_ENCLOSE':'PROFESSION_FIRE_ENCLOSE';`,
`  const expectedSkillId=element==='thunder'?16:element==='ice'?17:15;
  const functionName=element==='thunder'
    ?'PROFESSION_THUNDER_ENCLOSE'
    :element==='ice'?'PROFESSION_ICE_ENCLOSE':'PROFESSION_FIRE_ENCLOSE';`,
'Enclose expected skill mapping'
);

replaceOnce(
`  const tokenName=element==='thunder'?'雷附體':'火附體';
  const onHitField=element==='thunder'?'sourceThunderEncloseOnHitTurns':'sourceFireEncloseOnHitTurns';
  const modField=element==='thunder'?'sourceThunderEncloseModTier':'sourceFireEncloseModTier';
  const activeField=element==='thunder'?'sourceThunderEncloseAuraActive':'sourceFireEncloseAuraActive';`,
`  const tokenName=element==='thunder'?'雷附體':element==='ice'?'冰附體':'火附體';
  const onHitField=element==='thunder'
    ?'sourceThunderEncloseOnHitTurns'
    :element==='ice'?'sourceIceEncloseOnHitTurns':'sourceFireEncloseOnHitTurns';
  const modField=element==='thunder'
    ?'sourceThunderEncloseModTier'
    :element==='ice'?'sourceIceEncloseModTier':'sourceFireEncloseModTier';
  const activeField=element==='thunder'
    ?'sourceThunderEncloseAuraActive'
    :element==='ice'?'sourceIceEncloseAuraActive':'sourceFireEncloseAuraActive';`,
'Enclose holder fields'
);

replaceOnce(
`    const practiceFunction=element==='thunder'
      ?'PROFESSION_THUNDER_PRACTICE'
      :'PROFESSION_FIRE_PRACTICE';`,
`    const practiceFunction=element==='thunder'
      ?'PROFESSION_THUNDER_PRACTICE'
      :element==='ice'?'PROFESSION_ICE_PRACTICE':'PROFESSION_FIRE_PRACTICE';`,
'Enclose practice function'
);

const dexMarker=`function sourceProfessionThunderEncloseDexRoll(quick,{randMacro=sourceCRandMacroValue}={}){
  const work=Math.trunc(n(quick))+20;
  const lower=work*0.2;
  const upper=work*0.5;
  const roll=randMacro(lower,upper);
  let dex=work-roll;
  if(dex<=0)dex=1;
  return Math.trunc(dex);
}
`;
if(!s.includes('function sourceProfessionIceEncloseDexRoll(')){
  if((s.split(dexMarker).length-1)!==1)throw new Error('Thunder dex marker count mismatch');
  const iceDex=`${dexMarker}
function sourceProfessionIceEncloseDexRoll(quick,{randMacro=sourceCRandMacroValue}={}){
  return sourceProfessionThunderEncloseDexRoll(quick,{randMacro});
}
`;
  s=s.replace(dexMarker,iceDex);
}

if(s.includes('/* V273_ICE_ENCLOSE_RUNTIME_PATCH'))throw new Error('V273 patch already exists');

s += `

/* V273_ICE_ENCLOSE_RUNTIME_PATCH
 * Fixed C Skill 17 冰附體:
 *   冻 -> CHAR_WORK_I_ENCLOSE_2 (on-hit aura counter)
 *   霜 -> CHAR_WORK_I_ENCLOSE   (DEX -10% status tick)
 *   chance = 20 + A-tier*2
 *   effective on-hit turns: tier<5 -> 1, 5-9 -> 2, 10 -> 3
 *   stored StatusTbl = effective turns + 1
 */
function sourceProfessionIceEncloseAuraProc(attackerKind,actual,r){
  if(attackerKind!=='player'||!actual||!r||n(r.damage)<=0)return null;
  const turns=Math.trunc(n(state?.sourceIceEncloseOnHitTurns));
  if(turns<=0){
    if(state)state.sourceIceEncloseAuraActive=false;
    return null;
  }
  const tier=Math.trunc(n(state?.sourceIceEncloseModTier));
  const chance=20+tier*2;
  const targetDesc={kind:'enemy',unit:actual,unitId:actual.id};
  const check=sourceProfessionStatusAttackCheck(targetDesc,chance);
  if(!check.success){
    addLog('「冰附體」命中附體效果未觸發（roll '+check.roll+' / '+check.threshold+'）。');
    return {element:'ice',triggered:false,check,turnsRemaining:turns,tier};
  }
  const effectiveTurn=tier>=10?3:(tier>=5?2:1);
  const storedTurns=effectiveTurn+1;
  const key=battleStatusKey(targetDesc);
  if(!key)return {element:'ice',triggered:false,reason:'status-key',check,turnsRemaining:turns,tier};
  if(battleHasAnyStatus(targetDesc))return {element:'ice',triggered:false,reason:'existing-status',check,turnsRemaining:turns,tier};
  battleStatuses.set(key,{
    type:'iceEnclose',
    turns:storedTurns,
    encloseElement:'ice',
    sourceStatusToken:'霜',
    sourceAuraTier:tier
  });
  addLog('「冰附體」觸發：'+actual.name+' 敏捷下降 10%，StatusTbl='+storedTurns+'。','good');
  return {
    element:'ice',triggered:true,check,
    turnsRemaining:turns,tier,effectiveTurn,storedTurns,
    status:'iceEnclose',img1:101697,img2:101699
  };
}

function sourceProfessionIceEncloseStatusTick(desc,st){
  const holder=desc?.kind==='player'
    ?state
    :(desc?.kind==='pet'?desc.pet:desc?.unit);
  if(!holder)return {ok:false,reason:'missing-holder'};
  const baseQuick=Math.max(1,Math.trunc(n(holder?.roundQuick ?? holder?.quick ?? holder?.dex ?? 1)));
  const fixedBefore=Math.max(1,Math.trunc(n(holder?.roundFixQuick ?? baseQuick)));
  const fixedAfter=Math.max(1,Math.trunc(baseQuick*0.9));
  holder.roundFixQuick=fixedAfter;
  return {
    ok:true,fixedDexBefore:fixedBefore,fixedDexAfter:fixedAfter,
    baseDex:baseQuick,roundQuick:Math.trunc(n(holder?.roundQuick ?? baseQuick)),
    sourceFixedDexOnly:true,sourceNextPreCommandRebuildsFixDex:true,
    sourceCanMoveUnaffected:true,turnsRemaining:Math.max(0,Math.trunc(n(st?.turns))-1)
  };
}

function sourceProfessionBattleFunctionSupportedV273(functionName,skillId=null){
  return functionName==='PROFESSION_ICE_ENCLOSE'
    ?Math.trunc(n(skillId))===17
    :sourceProfessionBattleFunctionSupportedV272(functionName,skillId);
}

function sourceProfessionBattleDexRollV273(prepared,quick,opts={}){
  if(String(prepared?.commonCommand||'')==='BATTLE_COM_S_ICE_ENCLOSE'){
    return sourceProfessionIceEncloseDexRoll(quick,opts);
  }
  return sourceProfessionBattleDexRollV272(prepared,quick,opts);
}

function sourceProfessionBattleSkillExecuteV273(prepared,actor=null){
  if(prepared?.functionName==='PROFESSION_ICE_ENCLOSE'&&Math.trunc(n(prepared?.skillId))===17){
    const row=sourceProfessionSkillTemplate(prepared.skillId);
    return sourceProfessionEncloseAuraExecute(prepared,String(row?.name||'冰附體'),'ice');
  }
  return sourceProfessionBattleSkillExecuteV272(prepared,actor);
}

(function installV273IceEncloseRuntimePatch(){
  const sourceProfessionBattleFunctionSupportedV272Local=sourceProfessionBattleFunctionSupported;
  const sourceProfessionBattleDexRollV272Local=sourceProfessionBattleDexRoll;
  const sourceProfessionBattleSkillExecuteV272Local=sourceProfessionBattleSkillExecute;
  const applyFriendlyEnemyHitV272Local=applyFriendlyEnemyHit;
  const processBattleStatusTurnV272Local=processBattleStatusTurn;

  globalThis.sourceProfessionBattleFunctionSupportedV272=sourceProfessionBattleFunctionSupportedV272Local;
  globalThis.sourceProfessionBattleDexRollV272=sourceProfessionBattleDexRollV272Local;
  globalThis.sourceProfessionBattleSkillExecuteV272=sourceProfessionBattleSkillExecuteV272Local;

  sourceProfessionBattleFunctionSupported=function(functionName,skillId=null){
    return sourceProfessionBattleFunctionSupportedV273(functionName,skillId);
  };

  sourceProfessionBattleDexRoll=function(prepared,quick,opts={}){
    return sourceProfessionBattleDexRollV273(prepared,quick,opts);
  };

  sourceProfessionBattleSkillExecute=function(prepared,actor=null){
    return sourceProfessionBattleSkillExecuteV273(prepared,actor);
  };

  applyFriendlyEnemyHit=function(attackerKind,attackerName,target,r,attackerPetId=null,options={}){
    const actual=applyFriendlyEnemyHitV272Local(attackerKind,attackerName,target,r,attackerPetId,options);
    if(r?.professionEnclose)return actual;
    const proc=sourceProfessionIceEncloseAuraProc(attackerKind,actual,r);
    if(proc)r.professionEnclose=proc;
    return actual;
  };

  processBattleStatusTurn=function(actor){
    const desc=battleStatusActorDesc(actor);
    const st=desc?battleStatusGet(desc):null;
    if(st?.type==='iceEnclose'){
      st.turns=Math.max(0,Math.trunc(n(st.turns))-1);
      const tick=sourceProfessionIceEncloseStatusTick(desc,st);
      if(st.turns<=0){
        const key=battleStatusKey(desc);
        if(key)battleStatuses.delete(key);
        const holder=desc.kind==='player'?state:(desc.kind==='pet'?desc.pet:desc.unit);
        if(holder)holder.sourceIceEncloseAuraActive=false;
      }
      return tick;
    }
    return processBattleStatusTurnV272Local(actor);
  };
})();
`;

fs.writeFileSync(path,s,'utf8');
execSync('node --check game.js',{stdio:'inherit'});
execSync('git diff --check',{stdio:'inherit'});
console.log('V2.73 game.js patch applied; syntax and diff checks pass');
