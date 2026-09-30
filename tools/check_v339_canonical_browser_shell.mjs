#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function walk(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()&&!['.git','node_modules'].includes(entry.name))out.push(...walk(full));
    else if(entry.isFile())out.push(full);
  }
  return out;
}
const root=process.cwd();
const htmlFiles=walk(root).filter(file=>/\.html?$/i.test(file)).map(file=>path.relative(root,file).replaceAll(path.sep,'/')).sort();
assert.deepEqual(htmlFiles,['index.html']);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal(html.includes('stoneage_canonical_browser_shell.mjs'),true);
assert.equal(/game-live\.html|play\.html|game\.html/i.test(html),false);
const shell=fs.readFileSync(path.join(root,'src/stoneage_canonical_browser_shell.mjs'),'utf8');
assert.equal(shell.includes("SHELL_FORMAT='stoneage-canonical-browser-shell-v1'"),true);
assert.equal(shell.includes('ACTION_NPC_TALK'),true);
console.log(JSON.stringify({pass:true,format:'stoneage-canonical-browser-shell-check-v1',htmlFiles,uniqueHtmlEntry:true,noLegacyHtmlReferences:true,controllerModuleReferenced:true}));
