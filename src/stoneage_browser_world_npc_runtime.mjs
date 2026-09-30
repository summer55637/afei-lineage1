const BROWSER_WORLD_NPC_RUNTIME_FORMAT='stoneage-browser-world-npc-runtime-v1';
const WORLD_NPC_INDEX_FORMAT='stoneage-world-npc-index-v1';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;
const clone=value=>JSON.parse(JSON.stringify(value));

function normalizeSourcePath(value){
  let path=String(value??'').replaceAll('\\','/').trim();
  path=path.replace(/^\.\/+/, '');
  if(path.startsWith('gmsv/data/npc/'))path=path.slice('gmsv/data/npc/'.length);
  return path;
}

function sourceKey(value){
  if(!isObject(value))return null;
  const path=normalizeSourcePath(value.path??value.sourcePath);
  const blockIndex=intOr(value.blockIndex,-1);
  return path&&blockIndex>=0?path+'#'+blockIndex:null;
}

function cellKey(floor,x,y){
  return intOr(floor,-1)+':'+intOr(x,-1)+':'+intOr(y,-1);
}

function normalizeCell(value){
  if(Array.isArray(value)&&value.length>=3){
    const floor=intOr(value[0],-1),x=intOr(value[1],-1),y=intOr(value[2],-1);
    if(floor>=0&&x>=0&&y>=0)return {floor,x,y};
    return null;
  }
  if(isObject(value)){
    const floor=intOr(value.floor??value.floorId,-1);
    const x=intOr(value.x,-1),y=intOr(value.y,-1);
    if(floor>=0&&x>=0&&y>=0)return {floor,x,y};
  }
  return null;
}

function exactPoint(create){
  const corner=create?.bornCorner;
  if(!isObject(corner))return null;
  const x1=Number(corner.x1),y1=Number(corner.y1),x2=Number(corner.x2),y2=Number(corner.y2);
  if(![x1,y1,x2,y2].every(Number.isFinite))return null;
  if(x1!==x2||y1!==y2)return null;
  const floor=intOr(create.floorId,-1);
  if(floor<0||x1<0||y1<0)return null;
  return {floor,x:x1,y:y1};
}

function validateWorldNpcIndex(worldNpcIndex){
  const errors=[];
  if(!isObject(worldNpcIndex))errors.push('world NPC index must be an object');
  if(worldNpcIndex?.format!==WORLD_NPC_INDEX_FORMAT)errors.push('world NPC index format drift');
  if(!Array.isArray(worldNpcIndex?.creates))errors.push('world NPC index creates must be an array');
  if(!isObject(worldNpcIndex?.fixedSource))errors.push('world NPC index fixedSource required');
  return {ok:errors.length===0,errors};
}

function buildWorldNpcPointIndex(worldNpcIndex){
  const validation=validateWorldNpcIndex(worldNpcIndex);
  if(!validation.ok)return {ok:false,reason:'invalid-world-npc-index',errors:validation.errors};
  const byCell={};
  const unresolved=[];
  let pointCount=0,nonPointCount=0;
  for(const create of worldNpcIndex.creates){
    const key=sourceKey(create);
    if(!key)continue;
    const point=exactPoint(create);
    if(!point){nonPointCount++;continue;}
    const enemies=Array.isArray(create.enemy)?create.enemy:[];
    if(!enemies.length){
      unresolved.push({npcKey:key,reason:'npc-template-reference-missing',source:create});
      continue;
    }
    const candidates=enemies.map(enemy=>({
      templateName:enemy.templateName??null,
      normalizedTemplateName:enemy.normalizedTemplateName??null,
      fileRef:enemy.fileRef??null,
      raw:enemy.raw??null,
      templateCandidates:Array.isArray(enemy.templateCandidates)?clone(enemy.templateCandidates):[],
      fileExists:enemy.fileExists??null
    }));
    const npc={
      floor:point.floor,
      sourceFunctionSets:Array.isArray(worldNpcIndex.sourceFunctionSets)?worldNpcIndex.sourceFunctionSets.slice():[],
      npc:[point.x,point.y],
      x:point.x,
      y:point.y,
      path:normalizeSourcePath(create.path),
      blockIndex:intOr(create.blockIndex,-1),
      startLine:create.startLine??null,
      dir:create.dir??null,
      name:create.name??null,
      createNum:create.createNum??null,
      bornCorner:clone(create.bornCorner),
      enemies:candidates
    };
    const cell=cellKey(point.floor,point.x,point.y);
    (byCell[cell]??=[]).push(npc);
    pointCount++;
  }
  for(const rows of Object.values(byCell)){
    rows.sort((a,b)=>sourceKey(a).localeCompare(sourceKey(b)));
  }
  return {
    ok:true,
    index:{
      format:BROWSER_WORLD_NPC_RUNTIME_FORMAT,
      fixedSource:clone(worldNpcIndex.fixedSource),
      byCell,
      statistics:{pointInstanceCount:pointCount,nonPointCreateBlocks:nonPointCount,unresolvedCreateBlocks:unresolved.length}
    },
    unresolved
  };
}

function materializeNpc(row,enemyIndex=0){
  const enemy=row?.enemies?.[enemyIndex]??row?.enemies?.[0]??null;
  if(!enemy)return null;
  const sourceFunctionSets=Array.isArray(row?.sourceFunctionSets) ? row.sourceFunctionSets : [];
  const services=[];
  for(const sourceEnemy of row?.enemies??[]){
    for(const item of sourceEnemy.templateCandidates??[]){
      const functionSet=String(item?.functionSet??'').trim();
      if(!functionSet)continue;
      if(!services.some(x=>x.functionSet.toLowerCase()===functionSet.toLowerCase())){
        services.push({
          functionSet,
          templateName:sourceEnemy.templateName??null,
          templatePath:item.path??null,
          templateBlockIndex:intOr(item.blockIndex,-1),
          sourceStatus:sourceFunctionSets.some(x=>String(x).toLowerCase()===functionSet.toLowerCase())?'known':'unknown'
        });
      }
    }
  }
  const template=enemy.templateName??null;
  const candidate=enemy.templateCandidates?.[0]??null;
  return {
    floor:row.floor,
    npc:[row.npc[0],row.npc[1]],
    x:row.x,
    y:row.y,
    path:row.path,
    blockIndex:row.blockIndex,
    startLine:row.startLine,
    dir:row.dir,
    name:row.name,
    template,
    templateName:template,
    fileRef:enemy.fileRef??null,
    sourceEnemy:clone(enemy),
    sourceTemplateCandidate:clone(candidate),
    functionSet:candidate?.functionSet??null,
    services,
    runtimeModuleStatus: candidate?.functionSet ? 'source_template_reference_present' : 'unresolved_in_world_npc_index'
  };
}

function resolveWorldNpcAt(index,position,{template=null,functionSet=null}={}){
  const cell=normalizeCell(position);
  if(!cell)return {ok:false,reason:'world-npc-target-cell-required'};
  const rows=index?.byCell?.[cellKey(cell.floor,cell.x,cell.y)]??[];
  let candidates=rows;
  if(template!=null){
    const wanted=String(template).trim().toLowerCase();
    candidates=candidates.filter(row=>row.enemies?.some(enemy=>String(enemy.templateName??'').trim().toLowerCase()===wanted));
  }
  if(functionSet!=null){
    const wanted=String(functionSet).trim().toLowerCase();
    candidates=candidates.filter(row=>row.enemies?.some(enemy=>
      (enemy.templateCandidates??[]).some(candidate=>String(candidate?.functionSet??'').trim().toLowerCase()===wanted)
    ));
  }
  if(candidates.length===0)return {ok:false,reason:'npc-not-found-at-cell',cell,npcs:[]};
  if(candidates.length>1){
    return {
      ok:false,
      reason:'ambiguous-npc-at-cell',
      cell,
      npcs:candidates.map(row=>({npcKey:sourceKey(row),templateNames:[...new Set((row.enemies??[]).map(x=>x.templateName).filter(Boolean))]}))
    };
  }
  const row=candidates[0];
  let enemyIndex=0;
  if(functionSet!=null){
    const wanted=String(functionSet).trim().toLowerCase();
    const found=row.enemies.findIndex(enemy=>
      (enemy.templateCandidates??[]).some(candidate=>String(candidate?.functionSet??'').trim().toLowerCase()===wanted)
    );
    enemyIndex=found>=0?found:0;
  } else if(template!=null){
    const wanted=String(template).trim().toLowerCase();
    const found=row.enemies.findIndex(enemy=>String(enemy.templateName??'').trim().toLowerCase()===wanted);
    enemyIndex=found>=0?found:0;
  }
  return {ok:true,cell,npc:materializeNpc(row,enemyIndex)};
}

function createBrowserWorldNpcRuntime({worldNpcIndex}={}){
  const built=buildWorldNpcPointIndex(worldNpcIndex);
  if(!built.ok){
    return {ok:false,format:BROWSER_WORLD_NPC_RUNTIME_FORMAT,reason:built.reason,errors:built.errors??[]};
  }
  return {
    ok:true,
    format:BROWSER_WORLD_NPC_RUNTIME_FORMAT,
    index:built.index,
    unresolved:built.unresolved,
    resolveAt:(position,options={})=>resolveWorldNpcAt(built.index,position,options)
  };
}

export {
  BROWSER_WORLD_NPC_RUNTIME_FORMAT,
  WORLD_NPC_INDEX_FORMAT,
  normalizeSourcePath,
  sourceKey,
  cellKey,
  normalizeCell,
  exactPoint,
  validateWorldNpcIndex,
  buildWorldNpcPointIndex,
  materializeNpc,
  resolveWorldNpcAt,
  createBrowserWorldNpcRuntime
};
