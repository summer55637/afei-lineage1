import fs from 'node:fs';
const src=fs.readFileSync('game.js','utf8');
const needles=[
  'globalThis.sourceProfessionBattleFunctionSupportedV271',
  'globalThis.sourceProfessionBattleDexRollV271',
  'globalThis.sourceProfessionBattleSkillExecuteV271',
  'sourceProfessionBattleFunctionSupportedV271=',
  'sourceProfessionBattleSkillExecuteV271=',
  'sourceProfessionBattleDexRollV271='
];
for(const needle of needles){
  let p=src.indexOf(needle);
  console.log('\n===== '+needle+' at '+p+' =====');
  if(p>=0)console.log(src.slice(Math.max(0,p-12000),Math.min(src.length,p+5000)));
}
