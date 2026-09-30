const SOURCE_CHARM_RUNTIME_FORMAT='stoneage-source-charm-runtime-v1';
const SOURCE_CHARM_MAX=100;

const intOr=(v,f=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):f;

function applySourceCharm(currentCharm,value,eventNo){
  const current=intOr(currentCharm,-1);
  const amount=intOr(value,0);
  const ev=intOr(eventNo,-1);
  if(ev<=0)return {ok:true,applied:false,reason:'source-event-no-not-positive',eventNo:ev,currentCharm:current,nextCharm:current};
  if(current>=SOURCE_CHARM_MAX)return {ok:true,applied:false,reason:'source-charm-already-capped',eventNo:ev,currentCharm:current,nextCharm:SOURCE_CHARM_MAX};
  const next=Math.min(SOURCE_CHARM_MAX,current+amount);
  return {ok:true,applied:true,eventNo:ev,currentCharm:current,amount,nextCharm:next};
}

function createSourceCharmHandler(){
  return (state,payload)=>{
    if(!state?.player||typeof state.player!=='object')return {ok:false,reason:'canonical-player-state-required'};
    const result=applySourceCharm(state.player.charm,payload?.value,payload?.eventNo);
    if(!result.ok)return result;
    if(result.applied===true)state.player.charm=result.nextCharm;
    return result;
  };
}

export {
  SOURCE_CHARM_RUNTIME_FORMAT,
  SOURCE_CHARM_MAX,
  applySourceCharm,
  createSourceCharmHandler
};
