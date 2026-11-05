import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const root = 'F:/CODEX/EQ_MAINTENANCE';
const out = `${root}/outputs/20261029-qc01-hierarchy`;
const sharedEQ = {};
const context = vm.createContext({window: {EQ:sharedEQ},EQ:sharedEQ});
for (const file of ['catalog.js', 'fixtures.js']) {
  vm.runInContext(await fs.readFile(`${root}/artifacts/prototypes/p02-ui/js/${file}`, 'utf8'), context, {filename: file});
}
const EQ = context.window.EQ;
const data = EQ.buildFixtures();
const eq = data.equipment.find(e => e.code === 'QC01');
const initialParts = data.positions.filter(p => p.equipmentId === eq.id);
const model = JSON.parse(await fs.readFile(`${root}/artifacts/models/cict-j526a-sts-scene/1/manifest.json`, 'utf8'));
const adapter = await fs.readFile(`${root}/artifacts/prototypes/p02-ui/js/qc-viewer.mjs`, 'utf8');
// Run the viewer's own prepare function with its manifest already loaded.
// This preserves exact-key matching, existing IDs and absent-sub skipping.
const prepareSource = adapter.slice(adapter.indexOf('function prepare(eq) {'), adapter.indexOf('\nfunction dispose()'));
assert.ok(prepareSource.startsWith('function prepare(eq) {'));
EQ.state = {D:data};
EQ.positionsOf = id => data.positions.filter(p => p.equipmentId === id);
EQ.verified = e => e.assoc === 'verified';
EQ.route = {query:{}};
context.manifest = model;
context.targetEquipment = eq;
vm.runInContext(`const eligible = eq => ['eq-qc-demo-01', 'eq-qc-demo-02'].includes(eq.id) && EQ.verified(eq);\n${prepareSource}\nprepare(targetEquipment);`, context);
const afterFirstBind = EQ.positionsOf(eq.id).length;
vm.runInContext('prepare(targetEquipment);', context);
assert.equal(EQ.positionsOf(eq.id).length, afterFirstBind, 'Repeated preparation must not add duplicates');
const nodeByKey = new Map(model.nodes.map(n => [n.key,n]));
const appended = EQ.positionsOf(eq.id).filter(p => !initialParts.some(old => old.id === p.id));
assert.equal(afterFirstBind, new Set([...initialParts.map(p=>p.key), ...model.nodes.filter(n=>n.kind === 'position' && eq.subs.some(s=>s.code === n.classification.sub)).map(n=>n.key)]).size);
const approved = JSON.parse(await fs.readFile(`${root}/documents/prompt-pack/reference/mechanisms-approved.json`, 'utf8'));
const mainDefs = new Map(approved.mainMechanisms.map(m => [m.code, m]));
const subDefs = new Map(approved.subMechanisms.map(s => [s.code, s]));
const mains = [...eq.mains].sort((a,b) => a.code.localeCompare(b.code));
const expectedCodes = ['01','02','03','04','05','06','07','08','11','12','13','14','15','16','17'];
assert.deepEqual(Array.from(mains, m => m.code), expectedCodes);
const parts = data.positions.filter(p => p.equipmentId === eq.id && p.state !== 'deactivated');
const rows = [];
const starts = [];
for (const main of mains) {
  starts.push(rows.length + 9);
  const mainDef = mainDefs.get(main.code);
  const subs = [...eq.subs].filter(s => s.mainId === main.id).sort((a,b) => a.code.localeCompare(b.code));
  for (const sub of subs) {
    const def = subDefs.get(sub.code);
    assert.equal(def.mainCode, main.code);
    assert.equal(EQ.catalog.subs.find(s => s.code === sub.code).name, def.name);
    const matches = parts.filter(p => p.subId === sub.id);
    for (const part of matches.length ? matches : [null]) {
      const node = part && nodeByKey.get(part.key);
      const refs = part?.id.startsWith('mp-') ? [...new Set((node.provenance.sources || []).map(x => x.drawing + (x.pdfPage == null ? '' : ' p' + x.pdfPage)))].join('; ') || part.prov : part?.src ?? '';
      rows.push([main.code, mainDef.name, sub.code, def.name, part?.name ?? '', part?.id ?? '', refs, part?.prov ?? 'No part defined in prototype']);
    }
  }
}
assert.equal(rows.filter(r=>r[5]).length, parts.length);
assert.equal(new Set(rows.map(r=>r[2])).size, eq.subs.length);
assert.equal(new Set(rows.filter(r=>r[5]).map(r=>r[5])).size, parts.length);

const target = `${out}/QC01_Mechanisms_Submechanisms_Parts.xlsx`;
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(target));
const sh = wb.worksheets.getItem('QC01 Hierarchy');
console.log((await wb.inspect({kind:'table',range:'QC01 Hierarchy!A8:H12',include:'values,formulas',maxChars:1000,tableMaxRows:5,tableMaxCols:8})).ndjson);
const before = await wb.render({sheetName:sh.name,range:'A1:F15',scale:1,format:'png'});
await fs.writeFile(`${out}/support/before-recheck.png`,new Uint8Array(await before.arrayBuffer()));
const previousAudit = JSON.parse(await fs.readFile(`${out}/support/validation.json`, 'utf8'));
const oldRows = sh.getRange(`A9:H${8+previousAudit.rows}`).values;
assert.equal(oldRows.filter(r=>r[5]?.startsWith('pp-')).length,45);
for (const row of oldRows.filter(r=>r[5]?.startsWith('pp-'))) {
  const updated = rows.find(r=>r[5]===row[5]);
  assert.ok(updated, `Old part missing: ${row[5]}`);
  assert.deepEqual(updated, row, `Existing row changed: ${row[5]}`);
}
for (const table of [...sh.tables.items]) table.delete();
sh.showGridLines = false;
const last = rows.length + 8;
sh.getRange(`A2:H${last}`).format.font = {name:'Arial', size:10, color:'#17242D'};
sh.getRange(`A2:H${last}`).format.verticalAlignment = 'center';
sh.getRange(`A2:H${last}`).format.rowHeight = 23;
sh.getRange('A2').values = [['QC01 mechanism hierarchy']];
sh.getRange('A2').format.font = {name:'Arial', size:15, bold:true, color:'#173C50'};
sh.getRange('A2:H2').format.rowHeight = 30;
sh.getRange('A2:H2').format.borders = {bottom:{style:'thin',color:'#A8BBC7'}};
sh.getRange('A3').values = [[`${mains.length} mechanisms, ${eq.subs.length} sub-mechanisms, ${parts.length} parts / component positions`]];
sh.getRange('A4').values = [[`Source: approved catalogue, QC01 fixtures and crane model revision ${model.revision}, rechecked 29 Oct 2026.`]];
sh.getRange('A5').values = [['Parts and equipment associations are prototype data. Blank part cells mean no part is defined in the prototype.']];
sh.getRange('A6').values = [[`Recheck added ${appended.length} model-bound part positions. Model classifications remain proposed; existing part IDs are preserved.`]];
sh.getRange('A4:H6').format.font = {name:'Arial',size:10,color:'#526471',italic:true};
sh.getRange('A8:H8').values = [['Mech. code','Mechanism','Sub code','Sub-mechanism','Part / component','Part ID','Drawing / source reference','Location basis']];
sh.getRange(`A9:H${last}`).values = rows;
const tbl = sh.tables.add(`A8:H${last}`,true,'QC01Hierarchy');
tbl.style = 'TableStyleMedium2';
tbl.showFilterButton = true;
sh.getRange('A8:H8').format = {fill:'#244A61',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},rowHeight:29,horizontalAlignment:'center',verticalAlignment:'center'};
sh.getRange(`A9:A${last}`).setNumberFormat('00');
sh.getRange(`C9:C${last}`).setNumberFormat('000');
sh.getRange(`A9:H${last}`).format.horizontalAlignment = 'left';
const widths = {A:12,B:27,C:11,D:34,E:78,F:53,G:67,H:34};
for (const [col,width] of Object.entries(widths)) sh.getRange(`${col}1:${col}${last}`).format.columnWidth = width;
for (let i=0;i<rows.length;i++) {
  // Only the long descriptions need taller rows; retain the existing compact layout elsewhere.
  const height = Math.max(Math.ceil(rows[i][4].length/76),Math.ceil(rows[i][6].length/65)) * 15 + 8;
  if(height>23) {
    sh.getRange(`E${i+9}`).format.wrapText = true;
    sh.getRange(`G${i+9}`).format.wrapText = true;
    sh.getRange(`A${i+9}:H${i+9}`).format.rowHeight = height;
  }
}
for (const row of starts) sh.getRange(`A${row}:H${row}`).format.borders = {top:{style:'thin',color:'#98B3C3'}};
sh.freezePanes.freezeRows(8);
sh.freezePanes.freezeColumns(2);
wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'QC01 Hierarchy!A8:F15',include:'values,formulas',tableMaxRows:8,tableMaxCols:6,maxChars:2500})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},maxChars:1000})).ndjson);
const preview = await wb.render({sheetName:sh.name,range:'A1:F20',scale:1.3,format:'png'});
await fs.writeFile(`${out}/support/preview.png`,new Uint8Array(await preview.arrayBuffer()));
const tailPreview = await wb.render({sheetName:sh.name,range:`C${last-9}:H${last}`,scale:1,format:'png'});
await fs.writeFile(`${out}/support/tail-preview.png`,new Uint8Array(await tailPreview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(`${out}/QC01_Mechanisms_Submechanisms_Parts.xlsx`);
await fs.writeFile(`${out}/support/validation.json`,JSON.stringify({mechanisms:mains.length,subMechanisms:eq.subs.length,parts:parts.length,rows:rows.length,emptyPartRows:rows.filter(r=>!r[5]).length,mainCodes:expectedCodes,initialParts:initialParts.length,addedParts:appended.length,modelRevision:model.revision,modelPositionCount:model.nodes.filter(n=>n.kind==='position').length,addedKeys:appended.map(p=>p.key),outputRows:rows},null,2));
console.log(JSON.stringify({mechanisms:mains.length,subMechanisms:eq.subs.length,parts:parts.length,rows:rows.length,lastRow:last,output:`${out}/QC01_Mechanisms_Submechanisms_Parts.xlsx`}));
