import { normalizeRewardPacket } from './stoneage_reward_transaction.mjs';

const BATTLE_RESULT_FORMAT='stoneage-battle-result-adapter-v1';
const SOURCE_PVE_TYPE='P_vs_E';
const PLAYER_SIDE=0;
const ENEMY_SIDE=1;

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;
const nonNegativeInt=value=>Math.max(0,intOr(value,0));

function normalizeSnapshot(value){
  if(value==null)return null;
  if(!isObject(value))return null;
  const out={};
  for(const key of ['hp','maxHp','mp','maxMp']) if(value[key]!=null) out[key]=nonNegativeInt(value[key]);
  return Object.keys(out).length?out:null;
}

function adaptSourceBattleResult(raw,{battleType=SOURCE_PVE_TYPE}={}){
  if(!isObject(raw))return {ok:false,reason:'battle-result-missing'};
  if(String(battleType)!==SOURCE_PVE_TYPE)return {ok:false,reason:'unsupported-idle-battle-type',battleType};
  const battleIndex=intOr(raw.battleIndex,-1);
  const winside=intOr(raw.winside,-1);
  if(battleIndex<0)return {ok:false,reason:'source-battle-index-missing'};
  if(winside!==PLAYER_SIDE&&winside!==ENEMY_SIDE)return {ok:false,reason:'source-winside-invalid',winside};
  if(raw.finished!==true)return {ok:false,reason:'source-battle-not-finished'};
  const outcome=winside===PLAYER_SIDE?'victory':'defeat';
  const player=normalizeSnapshot(raw.player);
  let reward=null;
  if(raw.reward!=null){
    reward=normalizeRewardPacket(raw.reward);
    if(!reward)return {ok:false,reason:'source-reward-packet-invalid'};
  }
  const onlyRescue={
    side0:raw.onlyRescue?.side0==null?null:intOr(raw.onlyRescue.side0,-1),
    side1:raw.onlyRescue?.side1==null?null:intOr(raw.onlyRescue.side1,-1)
  };
  for(const side of ['side0','side1']) if(onlyRescue[side]!=null&&onlyRescue[side]!==0&&onlyRescue[side]!==1) return {ok:false,reason:'source-onlyrescue-invalid',side,value:onlyRescue[side]};
  return {ok:true,result:{
    format:BATTLE_RESULT_FORMAT,
    outcome,
    source:{battleIndex,winside,battleType:SOURCE_PVE_TYPE,onlyRescue},
    player,
    reward
  }};
}

function assertBattleResultForIdle(result){
  if(!isObject(result)||result.format!==BATTLE_RESULT_FORMAT)return {ok:false,reason:'battle-result-adapter-format-required'};
  if(result.outcome!=='victory'&&result.outcome!=='defeat')return {ok:false,reason:'idle-outcome-invalid'};
  if(!isObject(result.source)||result.source.battleType!==SOURCE_PVE_TYPE)return {ok:false,reason:'idle-source-pve-required'};
  return {ok:true};
}

export { BATTLE_RESULT_FORMAT,SOURCE_PVE_TYPE,PLAYER_SIDE,ENEMY_SIDE,adaptSourceBattleResult,assertBattleResultForIdle };
