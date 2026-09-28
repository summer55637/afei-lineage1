import fs from 'node:fs';
const src=fs.readFileSync('game.js','utf8');
for(const needle of ["if(st?.type==='encloseAura')","if(st?.type==='thunderShock')","if(st?.type==='fireEnclose')","sourceProfessionFireEncloseStatusTick","sourceProfessionSpecialSkillProficiencyByFunction"]){
  const p=src.indexOf(needle);
  console.log('\n===== '+needle+' @ '+p+' =====');
  if(p>=0)console.log(src.slice(Math.max(0,p-5000),Math.min(src.length,p+11000)));
}
