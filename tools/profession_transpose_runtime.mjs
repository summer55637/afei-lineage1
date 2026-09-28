// V2.75 Skill 21 source-parity core: PROFESSION_TRANSPOSE / 移形換位.
// Derived from gavinlinasd/StoneAge at ref 1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56.

export const PROFESSION_TRANSPOSE_SKILL_ID=21;
export const PROFESSION_TRANSPOSE_FUNCTION='PROFESSION_TRANSPOSE';
export const PROFESSION_TRANSPOSE_COMMON_COMMAND='BATTLE_COM_S_TRANSPOSE';

// Source battle_event.c thresholds.  The source uses PROFESSION_CHANGE_SKILL_LEVEL_M
// before applying these thresholds.
export function sourceProfessionTransposeProfile(skillLevel){
  const level=Math.trunc(Number(skillLevel)||0);
  let avoid=10;
  if(level>=10) avoid=70;
  else if(level>=9) avoid=60;
  else if(level>=8) avoid=50;
  else if(level>=6) avoid=45;
  else if(level>=5) avoid=30;
  else if(level>=3) avoid=25;

  let turn=1;
  if(level>=10) turn=5;
  else if(level>=6) turn=4;

  return {skillLevel:level,avoid,turn};
}

// Source BATTLE_COM_S_TRANSPOSE applies the temporary dodge work to every
// member returned by BATTLE_MultiList(defNo2).  This helper deliberately keeps
// target selection outside the formula so callers can supply their battle-side
// target list without inventing a new targeting rule.
export function sourceProfessionTransposeApply(targets,skillLevel){
  const profile=sourceProfessionTransposeProfile(skillLevel);
  const list=Array.isArray(targets)?targets:[];
  const applied=[];
  for(const target of list){
    if(!target) continue;
    const next={...target};
    next.professionTransposeDuckTurns=profile.turn+1;
    next.professionTransposeDuckPower=profile.avoid;
    applied.push(next);
  }
  return {profile,targets:applied};
}

export function sourceProfessionTransposeExecute(prepared){
  const p=prepared&&typeof prepared==='object'?prepared:{};
  const result=sourceProfessionTransposeApply(p.targets,p.displayLevel);
  return {
    handled:true,
    skillId:PROFESSION_TRANSPOSE_SKILL_ID,
    functionName:PROFESSION_TRANSPOSE_FUNCTION,
    commonCommand:PROFESSION_TRANSPOSE_COMMON_COMMAND,
    targetNo:p.toNo??null,
    ...result,
    sourceBattleEvent:'BATTLE_COM_S_TRANSPOSE',
    sourceTargetExpansion:'BATTLE_MultiList(defNo2)',
    sourceAnimation:'BATTLE_MagicEffect(attackNo,ToList,img1,img2)'
  };
}
