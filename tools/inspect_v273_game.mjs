import fs from 'node:fs';
const src=fs.readFileSync('game.js','utf8');
function extract(name){
  const sig='function '+name+'(';
  const i=src.indexOf(sig);
  if(i<0)return 'MISSING '+name;
  const b=src.indexOf('{',src.indexOf(')',i));
  let d=0,q=null,esc=false,line=false,block=false;
  for(let p=b;p<src.length;p++){
    const c=src[p],nx=src[p+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&nx==='/'){block=false;p++;}continue}
    if(q){if(esc)esc=false;else if(c==='\\')esc=true;else if(c===q)q=null;continue}
    if(c==='/'&&nx==='/'){line=true;p++;continue}
    if(c==='/'&&nx==='*'){block=true;p++;continue}
    if(c==='"'||c==="'"||c===String.fromCharCode(96)){q=c;continue}
    if(c==='{')d++; else if(c==='}'&&--d===0)return src.slice(i,p+1);
  }
  return 'UNTERMINATED '+name;
}
console.log('GAME_JS_BYTES='+Buffer.byteLength(src));
for(const n of ['sourceProfessionEncloseAuraSpec','sourceProfessionEncloseAuraExecute','sourceProfessionBattleFunctionSupportedV272','sourceProfessionBattleFunctionSupported']){
  console.log('\n===== '+n+' =====\n'+extract(n));
}
for(const needle of ['PROFESSION_FIRE_ENCLOSE','PROFESSION_THUNDER_ENCLOSE','BATTLE_COM_S_FIRE_ENCLOSE','BATTLE_COM_S_THUNDER_ENCLOSE']){
  let p=0,count=0;
  console.log('\n===== OCCURRENCES '+needle+' =====');
  while((p=src.indexOf(needle,p))>=0){
    console.log(src.slice(Math.max(0,p-500),Math.min(src.length,p+900)));
    p+=needle.length;
    if(++count>=12)break;
  }
}
