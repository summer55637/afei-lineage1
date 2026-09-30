const SOURCE_ITEM_RUNTIME_FORMAT='stoneage-item-source-runtime-v1';
const ITEM_MAKE_RUNTIME_FORMAT='stoneage-item-make-runtime-v2';
const ITEM_DATA_INT_COUNT=66;

const ITEM_ID=0;
const ITEM_USEPILENUMS=8;
const ITEM_CANBEPILE=9;
const ITEM_LEAKLEVEL=59;

const FIXED_ITEM_DATA_DEFAULTS=[
  0,0,0,16,0,0,0,-1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,0,
  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
];

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const intOr=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;
const nonNegativeInt=value=>Math.max(0,intOr(value,0));

function defaultRandInclusive(min,max){
  const lo=Math.trunc(Number(min));
  const hi=Math.trunc(Number(max));
  if(!Number.isFinite(lo)||!Number.isFinite(hi)||hi<lo) throw new RangeError('invalid inclusive RNG bounds');
  return lo+Math.floor(Math.random()*(hi-lo+1));
}

function assertPairArray(value,label){
  if(value==null)return [];
  if(!Array.isArray(value)||value.length%2!==0)throw new Error(label+' must be an even-length flat pair array');
  const out=[];
  for(let i=0;i<value.length;i+=2){
    const field=intOr(value[i],-1);
    const number=intOr(value[i+1],0);
    if(field<0||field>=ITEM_DATA_INT_COUNT)throw new Error(label+' field out of range: '+field);
    if(!Number.isInteger(Number(value[i+1])))throw new Error(label+' value must be an integer: '+value[i+1]);
    out.push([field,number]);
  }
  return out;
}

function validateItemMakeCatalog(catalog){
  const errors=[];
  if(!isObject(catalog))return {ok:false,errors:['catalog must be an object']};
  if(catalog.format!==ITEM_MAKE_RUNTIME_FORMAT)errors.push('catalog format must be '+ITEM_MAKE_RUNTIME_FORMAT);
  if(intOr(catalog.itemDataIntCount,-1)!==ITEM_DATA_INT_COUNT)errors.push('catalog itemDataIntCount must be 66');
  if(!Array.isArray(catalog.defaultData)||catalog.defaultData.length!==ITEM_DATA_INT_COUNT)errors.push('catalog defaultData must contain 66 integers');
  if(!isObject(catalog.byItemId))errors.push('catalog byItemId must be an object');
  if(errors.length===0){
    for(const [index,value] of catalog.defaultData.entries())if(!Number.isInteger(Number(value)))errors.push('catalog defaultData['+index+'] must be an integer');
  }
  return {ok:errors.length===0,errors};
}

function resolveSourceItemTemplate(catalog,itemId){
  const validation=validateItemMakeCatalog(catalog);
  if(!validation.ok)return {ok:false,reason:'invalid-item-make-catalog',errors:validation.errors};
  const normalizedItemId=intOr(itemId,-1);
  if(normalizedItemId<0)return {ok:false,reason:'invalid-item-id'};
  const row=catalog.byItemId[String(normalizedItemId)];
  if(!isObject(row))return {ok:false,reason:'source-item-template-missing',itemId:normalizedItemId};
  try{
    const data=Array.from(catalog.defaultData,Number);
    const widths=Array(ITEM_DATA_INT_COUNT).fill(0);
    for(const [field,value] of assertPairArray(row.b,'row.b'))data[field]=value;
    for(const [field,value] of assertPairArray(row.w,'row.w')){
      if(value<0)throw new Error('row.w contains a negative width: '+value);
      widths[field]=value;
    }
    if(data[ITEM_ID]!==normalizedItemId)return {ok:false,reason:'source-item-template-id-mismatch',itemId:normalizedItemId,templateId:data[ITEM_ID]};
    const functions=isObject(row.f)?Object.fromEntries(Object.entries(row.f).filter(([key,value])=>['i','a','d'].includes(key)&&String(value)!=='')): {};
    const argument=typeof row.g==='string'?row.g:null;
    return {
      ok:true,
      itemId:normalizedItemId,
      baseData:data,
      randomWidths:widths,
      functions,
      argument
    };
  }catch(error){
    return {ok:false,reason:'invalid-source-item-template',itemId:normalizedItemId,message:String(error?.message??error)};
  }
}

function sourceMakeItemData(catalog,itemId,{randInclusive=defaultRandInclusive}={}){
  const template=resolveSourceItemTemplate(catalog,itemId);
  if(!template.ok)return template;
  if(typeof randInclusive!=='function')return {ok:false,reason:'randInclusive-function-required',itemId:template.itemId};
  const data=template.baseData.slice();
  const rngRolls=[];
  for(let i=0;i<ITEM_DATA_INT_COUNT;i++){
    const width=template.randomWidths[i];
    const roll=Number(randInclusive(0,width));
    if(!Number.isFinite(roll)||!Number.isInteger(roll)||roll<0||roll>width){
      return {ok:false,reason:'invalid-rng-result',itemId:template.itemId,field:i,width,roll,rngCalls:rngRolls.length};
    }
    data[i]+=roll;
    rngRolls.push({field:i,width,roll});
  }
  data[ITEM_LEAKLEVEL]=1;
  return {
    ok:true,
    format:SOURCE_ITEM_RUNTIME_FORMAT,
    itemId:template.itemId,
    data,
    rngRolls,
    rngCalls:rngRolls.length,
    sourceTemplate:{
      functions:template.functions,
      argument:template.argument
    }
  };
}

function itemRuntimeSlotMap(state){
  if(isObject(state?.inventory?.itemRuntime?.slots))return state.inventory.itemRuntime.slots;
  if(isObject(state?.itemRuntime?.slots))return state.itemRuntime.slots;
  return null;
}

function sourceItemRuntimeCapacity(state,{itemCapacity=null}={}){
  const requested=intOr(itemCapacity,-1);
  if(requested>1)return requested;
  const rt=state?.inventory?.itemRuntime;
  const direct=intOr(rt?.itemnum,-1);
  if(direct>1)return direct;
  const legacy=intOr(state?.itemRuntime?.itemnum,-1);
  if(legacy>1)return legacy;
  const slots=itemRuntimeSlotMap(state);
  if(slots){
    const numeric=Object.keys(slots).map(Number).filter(Number.isInteger);
    const largest=numeric.length?Math.max(...numeric):1;
    return Math.max(2,largest+1);
  }
  return 28000;
}

function slotIsUsed(slots,index){
  const value=slots?.[String(index)] ?? slots?.[index];
  if(value==null)return false;
  if(isObject(value)&&value.use===false)return false;
  return true;
}

function createSourceItemAllocator({
  catalog,
  itemCapacity=28000,
  cursor=1,
  randInclusive=defaultRandInclusive,
  initHandlers={}
}={}){
  let nextCursor=Math.max(1,intOr(cursor,1));
  const handlers=isObject(initHandlers)?initHandlers:{};
  const normalizedCapacity=Math.max(2,intOr(itemCapacity,28000));

  return {
    format:SOURCE_ITEM_RUNTIME_FORMAT,
    get cursor(){return nextCursor;},
    set cursor(value){nextCursor=Math.max(1,intOr(value,1));},
    allocate({state,itemId}={}){
      const make=sourceMakeItemData(catalog,itemId,{randInclusive});
      if(!make.ok)return {ok:false,reason:make.reason,itemId:make.itemId,errors:make.errors,message:make.message,rngCalls:make.rngCalls??0};
      const slots=itemRuntimeSlotMap(state);
      if(!slots)return {ok:false,reason:'item-runtime-slots-required',itemId:make.itemId,rngCalls:make.rngCalls};
      const capacity=sourceItemRuntimeCapacity(state,{itemCapacity:normalizedCapacity});
      let selected=-1;
      for(let guard=0;guard<capacity;guard++){
        let index=nextCursor;
        nextCursor++;
        if(nextCursor>=capacity)nextCursor=1;
        if(index<1)index=1;
        if(!slotIsUsed(slots,index)){selected=index;break;}
      }
      if(selected<0)return {ok:false,reason:'item-runtime-full',itemId:make.itemId,rngCalls:make.rngCalls};
      const initFunc=String(make.sourceTemplate.functions?.i??'').trim();
      const item={
        use:true,
        itemId:make.data[ITEM_ID],
        owner:null,
        pile:Math.max(1,nonNegativeInt(make.data[ITEM_USEPILENUMS])),
        canBePile:make.data[ITEM_CANBEPILE]!==0,
        leakLevel:make.data[ITEM_LEAKLEVEL],
        data:make.data.slice(),
        sourceItemId:make.itemId,
        sourceTemplateFormat:ITEM_MAKE_RUNTIME_FORMAT,
        sourceCallbacks:{
          init:initFunc||null,
          attach:String(make.sourceTemplate.functions?.a??'').trim()||null,
          detach:String(make.sourceTemplate.functions?.d??'').trim()||null,
          argument:make.sourceTemplate.argument
        }
      };
      if(initFunc){
        const handler=handlers[initFunc];
        if(typeof handler!=='function'){
          return {ok:false,reason:'source-init-callback-unresolved',itemId:make.itemId,existingIndex:selected,initFunc,rngCalls:make.rngCalls};
        }
        try{
          const initialized=handler(item,{itemId:make.itemId,state});
          if(initialized===false)return {ok:false,reason:'source-init-callback-rejected',itemId:make.itemId,existingIndex:selected,initFunc,rngCalls:make.rngCalls};
        }catch(error){
          return {ok:false,reason:'source-init-callback-error',itemId:make.itemId,existingIndex:selected,initFunc,message:String(error?.message??error),rngCalls:make.rngCalls};
        }
      }
      return {ok:true,format:SOURCE_ITEM_RUNTIME_FORMAT,existingIndex:selected,item,rngCalls:make.rngCalls,itemMake:make};
    }
  };
}

function sourceItemRuntimeAlloc(state,itemId,options={}){
  const allocator=createSourceItemAllocator(options);
  return allocator.allocate({state,itemId});
}

function sourceItemRuntimeFree(state,existingIndex){
  const index=intOr(existingIndex,-1);
  if(index<1)return {ok:false,reason:'invalid-existing-index',state};
  const slots=itemRuntimeSlotMap(state);
  if(!slots||slots[String(index)]==null)return {ok:false,reason:'existing-item-runtime-missing',existingIndex:index,state};
  const next=JSON.parse(JSON.stringify(state));
  const nextSlots=itemRuntimeSlotMap(next);
  delete nextSlots[String(index)];
  return {ok:true,existingIndex:index,state:next};
}

export {
  SOURCE_ITEM_RUNTIME_FORMAT,
  ITEM_MAKE_RUNTIME_FORMAT,
  ITEM_DATA_INT_COUNT,
  ITEM_ID,
  ITEM_USEPILENUMS,
  ITEM_CANBEPILE,
  ITEM_LEAKLEVEL,
  FIXED_ITEM_DATA_DEFAULTS,
  defaultRandInclusive,
  validateItemMakeCatalog,
  resolveSourceItemTemplate,
  sourceMakeItemData,
  sourceItemRuntimeCapacity,
  createSourceItemAllocator,
  sourceItemRuntimeAlloc,
  sourceItemRuntimeFree
};
