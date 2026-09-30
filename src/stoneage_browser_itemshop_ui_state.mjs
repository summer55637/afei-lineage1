const ITEMSHOP_UI_STATE_FORMAT='stoneage-itemshop-ui-state-v1';
const ITEMSHOP_UI_EVENTS=Object.freeze({OPEN:'open',SELECT_OFFER:'select_offer',SET_QUANTITY:'set_quantity',RESULT:'result',CLOSE:'close'});
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const intOr=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;

function itemShopUiInitialState(){
  return {format:ITEMSHOP_UI_STATE_FORMAT,open:false,shop:null,selectedItemId:null,quantity:1,status:'closed',lastAction:ITEMSHOP_UI_EVENTS.CLOSE,message:null,lastResult:null};
}

function summarizeItemShopResult(result){
  if(!isObject(result))return null;
  const keys=['applied','idempotent','type','itemId','slot','existingIndex','quantity','requestedQuantity','unitPrice','total','reason'];
  const out={};
  for(const key of keys)if(result[key]!==undefined)out[key]=clone(result[key]);
  return Object.keys(out).length?out:null;
}

function openItemShopUiState(current,shop){
  if(!isObject(shop)||!Array.isArray(shop.offers))return {ok:false,reason:'itemshop-ui-shop-required',state:clone(current??itemShopUiInitialState())};
  const firstResolved=shop.offers.find(offer=>offer?.resolved===true&&intOr(offer.itemId,-1)>=0)??null;
  return {ok:true,state:{...(current??itemShopUiInitialState()),format:ITEMSHOP_UI_STATE_FORMAT,open:true,shop:clone(shop),selectedItemId:firstResolved?intOr(firstResolved.itemId,-1):null,quantity:1,status:'ready',lastAction:ITEMSHOP_UI_EVENTS.OPEN,message:null,lastResult:null}};
}

function selectItemShopUiOffer(current,itemId){
  const state=clone(current??itemShopUiInitialState());
  if(!state.open||!isObject(state.shop))return {ok:false,reason:'itemshop-ui-not-open',state};
  const id=intOr(itemId,-1);
  const offer=state.shop.offers.find(candidate=>intOr(candidate?.itemId,-1)===id);
  if(!offer)return {ok:false,reason:'itemshop-ui-offer-missing',state};
  if(offer.resolved!==true)return {ok:false,reason:'itemshop-ui-offer-unresolved',state};
  state.selectedItemId=id;
  state.quantity=1;
  state.status='ready';
  state.lastAction=ITEMSHOP_UI_EVENTS.SELECT_OFFER;
  state.message=null;
  state.lastResult=null;
  return {ok:true,state,offer:clone(offer)};
}

function setItemShopUiQuantity(current,quantity){
  const state=clone(current??itemShopUiInitialState());
  if(!state.open)return {ok:false,reason:'itemshop-ui-not-open',state};
  const value=intOr(quantity,0);
  if(value<=0)return {ok:false,reason:'itemshop-ui-quantity-positive-required',state};
  state.quantity=value;
  state.status='ready';
  state.lastAction=ITEMSHOP_UI_EVENTS.SET_QUANTITY;
  state.message=null;
  state.lastResult=null;
  return {ok:true,state,quantity:value};
}

function applyItemShopUiResult(current,{action='result',ok=false,reason=null,result=null}={}){
  const state=clone(current??itemShopUiInitialState());
  state.lastAction=String(action);
  state.status=ok===true?'success':'error';
  state.message=ok===true?null:(reason?String(reason):'itemshop-action-failed');
  state.lastResult=summarizeItemShopResult(result);
  return state;
}

function closeItemShopUiState(current){
  const next=itemShopUiInitialState();
  const previous=clone(current??next);
  next.lastAction=ITEMSHOP_UI_EVENTS.CLOSE;
  next.lastResult=previous.lastResult??null;
  return {ok:true,state:next};
}

function getItemShopUiSelectedOffer(state){
  const id=intOr(state?.selectedItemId,-1);
  const offer=state?.shop?.offers?.find(candidate=>intOr(candidate?.itemId,-1)===id);
  return offer?clone(offer):null;
}

export { ITEMSHOP_UI_STATE_FORMAT, ITEMSHOP_UI_EVENTS, itemShopUiInitialState, openItemShopUiState, selectItemShopUiOffer, setItemShopUiQuantity, applyItemShopUiResult, closeItemShopUiState, getItemShopUiSelectedOffer };
