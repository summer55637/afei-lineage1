#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'stoneage-mapgen-'));
try{
  const sourceRoot=path.join(tmp,'StoneAge');
  const sourcePath='gmsv/data/map/test/9999';
  const sourceFile=path.join(sourceRoot,sourcePath);
  fs.mkdirSync(path.dirname(sourceFile),{recursive:true});

  const name=Buffer.alloc(32);
  Buffer.from('Generator Test','ascii').copy(name);
  const bytes=Buffer.alloc(44+8);
  Buffer.from('LS2MAP','ascii').copy(bytes,0);
  bytes.writeUInt16BE(9999,6);
  name.copy(bytes,8);
  bytes.writeUInt16BE(1,40);
  bytes.writeUInt16BE(1,42);
  bytes.writeUInt16BE(0,44);
  bytes.writeUInt16BE(0,46);
  bytes.writeUInt16BE(8000,48);
  fs.writeFileSync(sourceFile,bytes);

  const out=path.join(tmp,'runtime.json');
  const index=path.join(tmp,'index.json');
  execFileSync(process.execPath,[
    'tools/generate_verified_map_runtime.mjs',
    '--floor','9999',
    '--source-root',sourceRoot,
    '--source-path',sourcePath,
    '--out',out,
    '--index',index
  ],{stdio:'pipe'});

  const runtime=JSON.parse(fs.readFileSync(out,'utf8'));
  const runtimeIndex=JSON.parse(fs.readFileSync(index,'utf8'));
  const blob=crypto.createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`,'utf8'))
    .update(bytes).digest('hex');

  assert.equal(runtime.floorId,9999);
  assert.equal(runtime.width,1);
  assert.equal(runtime.height,1);
  assert.equal(runtime.tileCount,1);
  assert.deepEqual(runtime.tiles,[0,8000]);
  assert.deepEqual(runtime.objects,[0,0]);
  assert.equal(runtime.source.blobSha,blob);
  assert.deepEqual(runtime.battlemapResolver.candidatesByImageId['0'],[1,2,201]);
  assert.deepEqual(runtime.battlemapResolver.candidatesByImageId['8000'],[199,0,0]);
  assert.equal(runtimeIndex.maps['9999'].sourceBlobSha,blob);

  console.log(JSON.stringify({pass:true,focus:'verified-map-runtime-generator',floorId:9999,sourceBlobSha:blob,candidatesForTile0:runtime.battlemapResolver.candidatesByImageId['0']}));
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
}
