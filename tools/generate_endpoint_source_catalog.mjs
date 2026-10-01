#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'data', 'generated', 'stoneage_endpoint_source_catalog.json');
const MANUAL_TUTORIAL = 'ro0000/docs/搭建教程.txt';
const MANUAL_WWWROOT = 'ro0000/server/merged-source/wwwroot/';

const SCOPES = [
  {
    id: 'manual-webroot',
    provenance: 'manual-external-web',
    root: MANUAL_WWWROOT,
    gitPath: 'ro0000/server/merged-source/wwwroot',
    description: '手工外網端 Web root；這是唯一被指定為手工外網端的 wwwroot 路徑。'
  },
  {
    id: 'manual-build-guide',
    provenance: 'manual-external-web',
    root: MANUAL_TUTORIAL,
    gitPath: MANUAL_TUTORIAL,
    description: '手工外網端架設／操作教程。'
  },
  {
    id: 'vm-merged-source',
    provenance: 'vm-one-click',
    root: 'ro0000/server/merged-source/',
    gitPath: 'ro0000/server/merged-source',
    description: 'VM 一鍵端 Server/Web 原始快照；唯一排除手工外網 wwwroot 子樹。'
  },
  {
    id: 'vm-database',
    provenance: 'vm-one-click',
    root: 'ro0000/server/database/',
    gitPath: 'ro0000/server/database',
    description: 'VM 一鍵端資料庫匯出／參考。'
  },
  {
    id: 'vm-android-client',
    provenance: 'vm-one-click',
    root: 'ro0000/client/android/',
    gitPath: 'ro0000/client/android',
    description: 'VM 一鍵端取得的 Android Client 研究資料。'
  },
  {
    id: 'vm-build-guide',
    provenance: 'vm-one-click',
    root: 'ro0000/docs/隐盟文本教程.txt',
    gitPath: 'ro0000/docs/隐盟文本教程.txt',
    description: 'VM 一鍵端架設／維運教程。'
  }
];

function git(args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  }).trimEnd();
}

function getTreeSha(gitPath) {
  return git(['rev-parse', 'HEAD:' + gitPath]);
}

function extension(filePath) {
  const base = path.posix.basename(filePath);
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot) : '[no-extension]';
}

function parseTree() {
  const raw = git(['ls-tree', '-r', '-l', 'HEAD', '--', 'ro0000']);
  if (!raw) return [];
  return raw.split('\n').map(line => {
    const match = line.match(/^(\d+)\s+blob\s+([0-9a-f]+)\s+(\d+)\t(.+)$/);
    if (!match) throw new Error('Cannot parse git ls-tree line: ' + line);
    return {
      mode: match[1],
      blobSha: match[2],
      size: Number(match[3]),
      path: match[4]
    };
  });
}

function classify(filePath) {
  if (filePath === MANUAL_TUTORIAL) return 'manual-build-guide';
  if (filePath.startsWith(MANUAL_WWWROOT)) return 'manual-webroot';
  if (filePath.startsWith('ro0000/server/merged-source/')) return 'vm-merged-source';
  if (filePath.startsWith('ro0000/server/database/')) return 'vm-database';
  if (filePath.startsWith('ro0000/client/android/')) return 'vm-android-client';
  if (filePath === 'ro0000/docs/隐盟文本教程.txt') return 'vm-build-guide';
  return null;
}

function aggregate(files, scope) {
  const extensionCounts = {};
  const topLevelCounts = {};
  let totalBytes = 0;

  for (const file of files) {
    extensionCounts[extension(file.path)] = (extensionCounts[extension(file.path)] ?? 0) + 1;
    totalBytes += file.size;
    const relative = scope.root.endsWith('/')
      ? file.path.slice(scope.root.length)
      : path.posix.basename(file.path);
    const top = relative.split('/')[0] || path.posix.basename(file.path);
    topLevelCounts[top] = (topLevelCounts[top] ?? 0) + 1;
  }

  return {
    fileCount: files.length,
    totalBytes,
    extensions: Object.fromEntries(Object.entries(extensionCounts).sort((a, b) => b[1] - a[1])),
    topLevelFiles: Object.fromEntries(Object.entries(topLevelCounts).sort((a, b) => b[1] - a[1]))
  };
}

const allFiles = parseTree();
const corpusFiles = allFiles.filter(file => classify(file.path) !== null);

const scopeResults = SCOPES.map(scope => {
  const files = corpusFiles.filter(file => classify(file.path) === scope.id);
  const stats = aggregate(files, scope);

  const result = {
    id: scope.id,
    provenance: scope.provenance,
    root: scope.root,
    gitPath: scope.gitPath,
    treeSha: getTreeSha(scope.gitPath),
    description: scope.description,
    stats
  };

  if (scope.id === 'manual-build-guide' || scope.id === 'vm-build-guide') {
    result.blobSha = files.length === 1 ? files[0].blobSha : null;
  }

  if (scope.id === 'vm-merged-source') {
    result.exclusions = [{
      exactPathPrefix: MANUAL_WWWROOT,
      provenance: 'manual-external-web',
      treeSha: getTreeSha('ro0000/server/merged-source/wwwroot'),
      reason: 'Only this exact wwwroot subtree is manual external web data.'
    }];
  }

  return result;
});

const manual = scopeResults.filter(scope => scope.provenance === 'manual-external-web');
const vm = scopeResults.filter(scope => scope.provenance === 'vm-one-click');
const sumStats = scopes => scopes.reduce((sum, scope) => ({
  fileCount: sum.fileCount + scope.stats.fileCount,
  totalBytes: sum.totalBytes + scope.stats.totalBytes
}), { fileCount: 0, totalBytes: 0 });

const manualStats = sumStats(manual);
const vmStats = sumStats(vm);

const catalog = {
  format: 'stoneage-endpoint-source-catalog-v1',
  purpose: 'Provenance and completeness index for the most complete practical deployment corpus. This catalog is distinct from the pinned fixed-C world source catalog.',
  provenanceClaim: '依專案已確認來源，VM 一鍵端與手工外網端均為可直接架設石器時代手游之實際部署資料複製件；此 provenance 本身不等同於逐檔 runtime boot proof。',
  exactManualExternalRules: [
    MANUAL_TUTORIAL,
    MANUAL_WWWROOT
  ],
  vmOneClickRule: '在本 catalog 的原始 endpoint corpus 範圍內，除上述兩個手工外網端路徑外，其餘全部標記為 VM 一鍵端。',
  explicitClassificationExample: {
    path: 'ro0000/server/merged-source/www/wwwroot/',
    provenance: 'vm-one-click',
    reason: '名稱雖含 wwwroot，但不是 ro0000/server/merged-source/wwwroot/ 這個指定手工外網端路徑。'
  },
  fixedSourceRole: {
    repository: 'gavinlinasd/StoneAge',
    ref: '1f90cb6cb57c1df70f39cde77a5a8ccd98b66c56',
    role: 'engine semantics / behavior / lifecycle validation baseline'
  },
  sourceCorpus: {
    scopeCount: scopeResults.length,
    fileCount: manualStats.fileCount + vmStats.fileCount,
    totalBytes: manualStats.totalBytes + vmStats.totalBytes,
    byProvenance: {
      manualExternalWeb: manualStats,
      vmOneClick: vmStats
    },
    metadataExcluded: [
      'ro0000/README.md',
      'ro0000/SOURCE_PROVENANCE.md'
    ]
  },
  scopes: scopeResults,
  reconstructionOrder: [
    'Endpoint Provenance',
    'Exact Identity',
    'Endpoint Completeness',
    'Fixed-C Semantic Check',
    'Evidence / Regression',
    'Canonical Runtime'
  ]
};

const serialized = JSON.stringify(catalog, null, 2) + '\n';

if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT)) throw new Error('Missing generated catalog: ' + OUT);
  const current = fs.readFileSync(OUT, 'utf8');
  if (current !== serialized) {
    throw new Error('Endpoint source catalog is stale. Run tools/generate_endpoint_source_catalog.mjs and commit the generated JSON.');
  }
  process.stdout.write('endpoint-source-catalog-check-ok\n');
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, serialized);
  process.stdout.write('generated ' + path.relative(ROOT, OUT) + '\n');
  process.stdout.write(JSON.stringify(catalog.sourceCorpus, null, 2) + '\n');
}
