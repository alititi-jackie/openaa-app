// Exercise the shipped TypeScript workbook code with actual XLSX files in Node.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
require.extensions[".ts"] = (module, path) => module._compile(ts.transpileModule(
  fs.readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
).outputText, path);
const { Workbook } = require("exceljs");
const { backupFiles, parseFile } = require("../../features/ledger/files.ts");
const { matchTemplateRows } = require("../../features/ledger/model.ts");
async function main() {
  const entry = { kind:"expense", date:"2026-11-23", amount:1, category:"餐饮", method:"cash", note:"" };
  const rows = Array.from({length:30005},(_,i)=>({...entry,id:String(i)}));
  const [large] = await backupFiles(rows.slice(0,10005),false,"expense");
  assert.deepEqual((await parseFile(large)).rows.map(r=>r.id), rows.slice(0,10005).map(r=>r.id));
  const volumes = await backupFiles(rows,false,"expense");
  assert.ok(volumes.length>1);
  const recovered=[];
  for(const file of volumes) {
    const result=await parseFile(file);
    assert.ok(result.partial);
    recovered.push(...result.rows.map(r=>r.id));
  }
  assert.deepEqual(recovered,rows.map(r=>r.id));
  const [template] = await backupFiles([],true,"all");
  const book=new Workbook();
  await book.xlsx.load(await template.arrayBuffer());
  const file=async()=>new File([await book.xlsx.writeBuffer()],"test.xlsx");
  const sheet=book.getWorksheet("开支明细");
  const values=[entry.date,1,"现金","餐饮"];
  sheet.addRow(values);
  const old=(await parseFile(await file())).rows;
  sheet.addRow(values);
  const next=await parseFile(await file());
  matchTemplateRows(next.rows,old,next.blankIds);
  assert.equal(next.rows[0].id,old[0].id);
  assert.notEqual(next.rows[1].id,old[0].id);
  book.getWorksheet("汇款明细").addRow([entry.date,100,null,null,"冲正款",7.2,720]);
  await assert.rejects(parseFile(await file()),/汇款明细第 2 行/);
  console.log("Large XLSX, multi-volume restore, template matching and direction validation passed.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
