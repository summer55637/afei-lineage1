#!/usr/bin/env node
import fs from 'node:fs';

const ROOT = process.cwd();
const RO = 'ro0000';
const METADATA_ONLY = new Set([
  'ro0000/README.md',
  'ro0000/SOURCE_PROVENANCE.md'
]);
const REPORTS = [
  'data/generated/stoneage_ro0000_dependency_triage.json',
  'data/generated/stoneage_ro0000_hecheng_loader_audit.json',
  'data/generated/stoneage_ro0000_isolated_residue_audit.json',
  'data/generated/stoneage_ro0000_residue_inventory.json',
  'data/generated/stoneage_ro0000_residue_structure_audit.json'
];

function git(args) {
  return require('node:child_process').execFileSync(
    'git',
    ['-c', 'core.quotePath=false', ...args],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  ).trimEnd();
}

const parent = git(['rev-parse', 'HEAD^']);
const changed = git([
  'diff-tree', '--no-commit-id', '--name-only', '-r',
  parent, 'HEAD', '--', RO
]).split(/\r?\n/).filter(Boolean);

if (changed.length === 0) {
  console.log('No ro0000 change in latest commit; snapshot audit binding unchanged.');
  process.exit(0);
}

if (changed.some(file => !METADATA_ONLY.has(file))) {
  console.log(JSON.stringify({
    action: 'preserve',
    reason: 'latest ro0000 commit changed raw snapshot content; require substantive audit refresh',
    changed
  }, null, 2));
  process.exit(0);
}

const treeSha = git(['rev-parse', 'HEAD:' + RO]);
const checkedDate = new Date().toISOString().slice(0, 10);

for (const reportPath of REPORTS) {
  if (!fs.existsSync(reportPath)) {
    throw new Error('Missing RO0000 snapshot audit: ' + reportPath);
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  if (typeof report.ro0000TreeSha !== 'string') {
    throw new Error('Missing ro0000TreeSha in ' + reportPath);
  }
  report.ro0000TreeSha = treeSha;
  report.checkedDate = checkedDate;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}

console.log(JSON.stringify({
  action: 'rebind-metadata-only',
  changed,
  ro0000TreeSha: treeSha,
  checkedDate,
  reports: REPORTS
}, null, 2));
