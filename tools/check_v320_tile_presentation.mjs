import assert from 'node:assert/strict';
import {loadClientTilePresentation,clientTilePresentationSummary,renderSourceTileObjectPreview,renderSourceTileObjectPreviewAsync,renderBattleSabexPreviewAsync,targetBattleCellPosition} from '../src/stoneage_tile_presentation.mjs';
import {SABEX_MIN_BYTES} from '../src/stoneage_sabex_decoder.mjs';

const u32=(b,p,v)=>{b[p]=v&255;b[p+1]=(v>>>8)&255;b[p+2]=(v>>>16)&255;b[p+3]=(v>>>24)&255};
const adrn=new Uint8Array(80);let p=0;
u32(adrn,p,7);p+=4;u32(adrn,p,0);p+=4;u32(adrn,p,22);p+=4;u32(adrn,p,0);p+=4;u32(adrn,p,0);p+=4;u32(adrn,p,2);p+=4;u32(adrn,p,2);p+=4;
p+=2;for(let i=0;i<22;i++)p+=2;p+=2;u32(adrn,p,4500);
const real=new Uint8Array(22);real[0]=82;real[1]=68;real[2]=0;u32(real,4,2);u32(real,8,2);u32(real,12,20);real.set([0,16,16,0],16);
const sap=new Uint8Array(672);sap.set([30,20,10],0);
const manifest={format:'stoneage-client-asset-pack-v1',status:'ready',source:{kind:'operator-supplied',authorizationNote:'test'},files:{adrn:{url:'adrn.bin'},real:{url:'real.bin'}}};
const payloads={
 'https://example.test/manifest.json':{ok:true,status:200,json:async()=>manifest},
 'https://example.test/adrn.bin':{ok:true,status:200,arrayBuffer:async()=>adrn.buffer},
 'https://example.test/real.bin':{ok:true,status:200,arrayBuffer:async()=>real.buffer},
 'https://example.test/Palet_1.sap':{ok:true,status:200,arrayBuffer:async()=>sap.buffer}
};
const fetchFn=async url=>payloads[url]||{ok:false,status:404};
const presentation=await loadClientTilePresentation({assetManifestUrl:'https://example.test/manifest.json',paletteUrl:'https://example.test/Palet_1.sap',fetchFn});
assert.equal(presentation.status,'ready');
assert.equal(clientTilePresentationSummary(presentation).status,'ready');
assert.deepEqual(presentation.palette.rgba.slice(16*4,16*4+4),Uint8Array.from([10,20,30,255]));

const canvas={width:80,height:80};
const ctx={canvas,imageSmoothingEnabled:true,fillStyle:'',font:'',strokeStyle:'',clearRect(){},fillRect(){},drawImage(){},strokeRect(){},fillText(){}};
globalThis.ImageData=class ImageData{constructor(data,width,height){this.data=data;this.width=width;this.height=height}};
globalThis.document={createElement(){return {width:0,height:0,getContext(){return {putImageData(){}}}}}};
const rendered=renderSourceTileObjectPreview(ctx,presentation,{tileId:4500,objectId:0,scale:2,showLabels:false});
assert.equal(rendered.status,'ready');
assert.equal(rendered.tileId,4500);
const asyncRendered=await renderSourceTileObjectPreviewAsync(ctx,presentation,{tileId:4500,objectId:0,scale:2,showLabels:false});
assert.equal(asyncRendered.status,'ready');
assert.equal(asyncRendered.tileId,4500);
assert.deepEqual(asyncRendered.pixelFormats,{tile:'indexed',object:'none'});

assert.deepEqual(targetBattleCellPosition(16,16),{x:0,y:0,targetX:574,targetY:350});
assert.deepEqual(targetBattleCellPosition(16,17),{x:32,y:-23,targetX:606,targetY:327});
assert.deepEqual(targetBattleCellPosition(17,16),{x:32,y:23,targetX:606,targetY:373});
assert.throws(()=>targetBattleCellPosition(33,0),/0..32/);

const battleSabex=new Uint8Array(SABEX_MIN_BYTES);
battleSabex.set([0x53,0x41,0x42,0x58],0);
const setBattleCell=(index,value)=>{
  const offset=4+index*2;
  battleSabex[offset]=(value>>>8)&0xff;
  battleSabex[offset+1]=value&0xff;
};
setBattleCell(0,4500);
setBattleCell(544,4500);
setBattleCell(1088,4500);
const drawCalls=[];
ctx.drawImage=(...args)=>drawCalls.push(args);
const battlePreview=await renderBattleSabexPreviewAsync(ctx,presentation,battleSabex,{requireSabHeader:true});
assert.equal(battlePreview.status,'ready');
assert.equal(battlePreview.drawnCells,3);
assert.equal(battlePreview.drawableCellCount,3);
assert.equal(battlePreview.skippedInvisibleCount,1086);
assert.equal(battlePreview.unresolvedCellCount,0);
assert.equal(battlePreview.geometry.horizontalStep,32);
assert.equal(battlePreview.geometry.verticalStep,23);
assert.equal(battlePreview.geometry.submissionOrder,'row-major');
assert.equal(drawCalls.length,3);

setBattleCell(1088,4501);
const partialPreview=await renderBattleSabexPreviewAsync(ctx,presentation,battleSabex,{requireSabHeader:true});
assert.equal(partialPreview.status,'partial');
assert.equal(partialPreview.drawnCells,2);
assert.equal(partialPreview.unresolvedCellCount,1);
assert.deepEqual(partialPreview.unresolvedImageIds,[4501]);


assert.equal(renderSourceTileObjectPreview(ctx,{status:'unavailable'},{tileId:4500}).status,'unavailable');
console.log(JSON.stringify({pass:true,version:'V3.20',focus:'source tile/object and full 33x33 SABEX -> ADRN -> Real -> RD/gG async -> SAP/RGBA preview',defaultDrawOrder:'tile then object',originalBinaryShipped:false}));