const IDLE_POLICY_FORMAT = 'stoneage-idle-policy-v1';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const intOr = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : fallback;

function validateIdlePolicy(policy = {}) {
  const errors=[];
  if (!isObject(policy)) return {ok:false,errors:['policy must be an object']};
  if (policy.supply != null) {
    if (!isObject(policy.supply)) errors.push('supply must be an object');
    else {
      if (policy.supply.hpBelowPercent != null && (Number(policy.supply.hpBelowPercent)<0 || Number(policy.supply.hpBelowPercent)>100)) errors.push('supply.hpBelowPercent must be 0..100');
      if (policy.supply.mpBelowPercent != null && (Number(policy.supply.mpBelowPercent)<0 || Number(policy.supply.mpBelowPercent)>100)) errors.push('supply.mpBelowPercent must be 0..100');
      if (policy.supply.healerServiceRequired != null && typeof policy.supply.healerServiceRequired !== 'boolean') errors.push('supply.healerServiceRequired must be boolean');
    }
  }
  if (policy.death != null) {
    if (!isObject(policy.death)) errors.push('death must be an object');
    else if (policy.death.recoveryMode != null && !['disabled','manual','save_point','nearest_healer'].includes(policy.death.recoveryMode)) errors.push('unsupported death.recoveryMode');
  }
  if (policy.offline != null) {
    if (!isObject(policy.offline)) errors.push('offline must be an object');
    else if (policy.offline.maxSeconds != null && (!Number.isFinite(Number(policy.offline.maxSeconds)) || Number(policy.offline.maxSeconds)<0)) errors.push('offline.maxSeconds must be non-negative');
  }
  return {ok:errors.length===0,errors};
}

function sourceHealerRecovery(state) {
  const next=JSON.parse(JSON.stringify(state));
  if (!next?.player) return {applied:false,reason:'player-state-missing',state};
  next.player.hp=Math.max(0,intOr(next.player.maxHp,0));
  next.player.mp=Math.max(0,intOr(next.player.maxMp,0));
  next.runtimeMeta ??={};
  next.runtimeMeta.updatedAt=new Date().toISOString();
  return {applied:true,reason:'source-healer-full-hp-mp',state:next};
}

function supplyRequired(state, policy = {}) {
  const checked=validateIdlePolicy(policy);
  if (!checked.ok) return {required:false,ok:false,errors:checked.errors};
  const p=state?.player;
  if (!p || intOr(p.maxHp,0)<=0 || intOr(p.maxMp,0)<0) return {required:false,ok:false,errors:['player hp/mp state missing']};
  const supply=policy.supply;
  if (!supply) return {required:false,ok:true,reason:'no-supply-policy'};
  const hpPct=p.maxHp>0?(Number(p.hp||0)/Number(p.maxHp))*100:100;
  const mpPct=p.maxMp>0?(Number(p.mp||0)/Number(p.maxMp))*100:100;
  const hpGate=supply.hpBelowPercent!=null && hpPct < Number(supply.hpBelowPercent);
  const mpGate=supply.mpBelowPercent!=null && mpPct < Number(supply.mpBelowPercent);
  return {required:hpGate||mpGate,ok:true,hpPercent:hpPct,mpPercent:mpPct,reason:hpGate?'hp-threshold':(mpGate?'mp-threshold':'above-threshold')};
}

function deathRecoveryDecision(state, policy = {}, { savePointAvailable = false, healerAvailable = false } = {}) {
  const checked=validateIdlePolicy(policy);
  if (!checked.ok) return {ok:false,errors:checked.errors};
  if (intOr(state?.player?.hp,0)>0) return {ok:true,dead:false,action:'none'};
  const mode=policy.death?.recoveryMode ?? 'disabled';
  if (mode==='disabled') return {ok:true,dead:true,action:'stop_idle'};
  if (mode==='manual') return {ok:true,dead:true,action:'await_manual_recovery'};
  if (mode==='save_point') return {ok:true,dead:true,action:savePointAvailable?'move_to_save_point':'blocked_missing_save_point'};
  if (mode==='nearest_healer') return {ok:true,dead:true,action:healerAvailable?'move_to_healer':'blocked_missing_healer'};
  return {ok:true,dead:true,action:'stop_idle'};
}

function offlineResumeWindow(closedAt,resumedAt,{maxSeconds=null}={}) {
  const a=Date.parse(String(closedAt));
  const b=Date.parse(String(resumedAt));
  if (!Number.isFinite(a)||!Number.isFinite(b)||b<a) return {ok:false,reason:'invalid-time-window',seconds:0};
  const elapsed=Math.floor((b-a)/1000);
  const cap=maxSeconds==null?elapsed:Math.min(elapsed,Math.max(0,intOr(maxSeconds,0)));
  return {ok:true,elapsedSeconds:elapsed,accruedSeconds:cap,capped:maxSeconds!=null&&cap<elapsed};
}

export { IDLE_POLICY_FORMAT, validateIdlePolicy, sourceHealerRecovery, supplyRequired, deathRecoveryDecision, offlineResumeWindow };
