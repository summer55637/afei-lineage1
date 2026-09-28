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
for(const n of ['sourceProfessionEncloseAuraSpec','sourceProfessionEncloseAnimation','sourceProfessionEncloseAuraExecute','sourceProfessionApplyEncloseAuraProc','sourceProfessionBattleDexRollV272','sourceProfessionBattleFunctionSupportedV271','sourceProfessionBattleSkillExecuteV271','sourceProfessionBattleSkillExecuteV272']){
  console.log('\n===== '+n+' =====\n'+extract(n));
}
