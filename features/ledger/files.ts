import { Workbook, type Cell } from "exceljs";
import {
  categories,
  totalColor,
  kinds,
  names,
  validate,
  today,
  type Entry,
  type Kind,
} from "./model";
const header = [
  "日期",
  "美元",
  "收付方式",
  "分类",
  "汇款类型",
  "汇率",
  "人民币",
  "备注",
  "记录编号",
  "版本",
];
function paint(cell: Cell, role: Parameters<typeof totalColor>[0]) {
  if (typeof cell.value === "number")
    cell.font = {
      bold: true,
      color: { argb: "FF" + totalColor(role, cell.value).slice(1) },
    };
}
export async function workbook(
  rows: Entry[],
  template: boolean,
  scope: Kind | "summary" | "all" = "all",
  part?: number,
) {
  const book = new Workbook();
  if (part) book.addWorksheet("分卷说明").addRow(["分卷备份，请逐个合并导入。此文件的统计仅包含本卷。"]);
  if (!template && (scope === "all" || scope === "summary")) {
    const summary = book.addWorksheet("收支汇总");
    summary.addRow(["账本", "笔数", "美元合计", "人民币合计"]);
    const totals = kinds.map((k) => {
      const list = rows.filter((r) => r.kind === k);
      const sum =
        list.reduce((n, r) => n + Math.round(r.amount * 100), 0) / 100;
      const line = summary.addRow([
        names[k],
        list.length,
        sum,
        k === "remittance"
          ? list.reduce((n, r) => n + Math.round((r.cny ?? 0) * 100), 0) / 100
          : null,
      ]);
      paint(line.getCell(3), k === "remittance" ? "net" : k);
      if (k === "remittance") paint(line.getCell(4), "net");
      return sum;
    });
    for (const [title, length] of [
      ["月度汇总", 7],
      ["年度汇总", 4],
    ] as const) {
      const periods = new Map<string, Record<Kind, number>>();
      for (const entry of rows) {
        const period = entry.date.slice(0, length);
        const group = periods.get(period) ?? {
          expense: 0,
          income: 0,
          remittance: 0,
        };
        group[entry.kind] += Math.round(entry.amount * 100);
        periods.set(period, group);
      }
      const sheet = book.addWorksheet(title);
      sheet.addRow(["期间", "收入", "开支", "净汇出美元", "汇款后结余"]);
      for (const [period, sums] of [...periods].sort(([a], [b]) =>
        b.localeCompare(a),
      )) {
        const line = sheet.addRow([
          period,
          sums.income / 100,
          sums.expense / 100,
          sums.remittance / 100,
          (sums.income - sums.expense - sums.remittance) / 100,
        ]);
        paint(line.getCell(2), "income");
        paint(line.getCell(3), "expense");
        paint(line.getCell(4), "net");
        paint(line.getCell(5), "net");
      }
    }
    const balance = summary.addRow([
      "汇款后结余",
      null,
      Math.round((totals[1] - totals[0] - totals[2]) * 100) / 100,
    ]);
    paint(balance.getCell(3), "net");
  }
  for (const k of kinds.filter((k) => scope === "all" || k === scope)) {
    if (!template) {
      for (const [suffix, size] of [
        ["汇总", 0],
        ["月度汇总", 7],
        ["年度汇总", 4],
      ] as const) {
        const groups = new Map<string, number[]>();
        const report = book.addWorksheet(names[k] + suffix);
        report.addRow([
          "期间",
          "笔数",
          "美元合计",
          ...(k === "remittance"
            ? ["人民币合计", "平均汇率"]
            : ["现金", "银行卡"]),
        ]);
        for (const r of rows.filter((r) => r.kind === k)) {
          const key = size ? r.date.slice(0, size) : "全部年份";
          const v = groups.get(key) ?? [0, 0, 0, 0, 0];
          v[0]++;
          v[1] += Math.round(r.amount * 100);
          if (k === "remittance") {
            v[2] += Math.round((r.cny ?? 0) * 100);
            v[3] += Math.abs(r.cny ?? 0);
            v[4] += Math.abs(r.amount);
          } else v[r.method === "cash" ? 2 : 3] += Math.round(r.amount * 100);
          groups.set(key, v);
        }
        for (const [key, v] of [...groups].sort().reverse()) {
          const line = report.addRow([
            key,
            v[0],
            v[1] / 100,
            v[2] / 100,
            k === "remittance" ? (v[4] ? v[3] / v[4] : 0) : v[3] / 100,
          ]);
          paint(line.getCell(3), k === "remittance" ? "net" : k);
          if (k === "remittance") paint(line.getCell(4), "net");
        }
      }
    }
    const records = rows.filter(row => row.kind === k);
    for (let offset = 0; offset < Math.max(1,records.length); offset += 10000) {
    const suffix = offset ? "-" + (1 + offset / 10000) : "";
    const sheet = book.addWorksheet(names[k] + "明细" + suffix, {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    sheet.addRow(header);
    sheet.getRow(1).font = { bold: true, color: { argb: "FF1976D2" } };
    for (const r of records.slice(offset, offset + 10000))
      sheet.addRow([
        r.date,
        Math.abs(r.amount),
        r.method ? (r.method === "cash" ? "现金" : "银行卡") : null,
        r.category,
        k === "remittance"
          ? r.amount < 0 || Number(r.cny) < 0
            ? "冲正"
            : "汇出"
          : null,
        r.rate,
        r.cny == null ? null : Math.abs(r.cny),
        r.note,
        r.id,
        r.revision,
      ]);
    sheet.getColumn(1).numFmt = "yyyy-mm-dd";
    sheet.columns.forEach((col, i) => {
      col.width = i === 7 ? 32 : 16;
      col.hidden =
        i >= 8 ||
        (k === "remittance"
          ? [2, 3].includes(i)
          : [4, 5, 6].includes(i) || (k === "income" && i === 3));
    });
    const lists =
      k === "remittance"
        ? { E: ["汇出", "冲正"] }
        : k === "expense"
          ? { C: ["现金", "银行卡"], D: categories }
          : { C: ["现金", "银行卡"] };
    for (const [col, values] of Object.entries(lists)) {
      // ExcelJS supports range validation through the worksheet validation collection.
      (
        sheet as typeof sheet & {
          dataValidations: { add: (range: string, rule: object) => void };
        }
      ).dataValidations.add(col + "2:" + col + "10001", {
        type: "list",
        allowBlank: false,
        formulae: ['"' + values.join(",") + '"'],
      });
    }
  }
  }
  const data = await book.xlsx.writeBuffer();
  return new File(
    [new Uint8Array(data as ArrayBuffer)],
    "OpenAA-" +
      (template
        ? "记账模板"
        : scope === "all"
          ? "完整账本"
          : scope === "summary"
            ? "收支总览"
            : names[scope] + "记录") +
      "-" +
      today() + (part ? "-分卷" + part : "") +
      ".xlsx",
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  );
}
function num(value: unknown) {
  if (
    value == null ||
    String(value).trim() === "" ||
    !Number.isFinite(Number(value))
  )
    throw Error("金额或汇率缺失或无效");
  return Number(value);
}
function unpack(
  kind: Kind,
  raw: Record<string, unknown>,
  fallback: string,
): Entry {
  const fx = kind === "remittance",
    amount = num(raw.amount ?? raw.usd),
    rate = fx ? num(raw.rate) : null;
  const sign = fx && (raw.type === "subtract" || amount < 0) ? -1 : 1;
  const payment = raw.method ?? raw.payment;
  return validate({
    id: String(raw.id || fallback),
    revision: raw.revision ? String(raw.revision) : undefined,
    kind,
    date: String(raw.date ?? ""),
    amount: fx ? sign * Math.abs(amount) : amount,
    method: fx
      ? null
      : payment === "cash" || payment === "现金"
        ? "cash"
        : payment === "card" || payment === "银行卡"
          ? "card"
          : null,
    category: kind === "expense" ? String(raw.category ?? "") : null,
    cny: fx ? sign * Math.abs(num(raw.cny ?? amount * Number(rate))) : null,
    rate,
    note: String(raw.note ?? ""),
  });
}
function checkArchive(bytes: ArrayBuffer) {
    if (bytes.byteLength > 16 * 1024 * 1024) throw Error("文件超过 16 MB");
    const view = new DataView(bytes);
    let end = bytes.byteLength - 22;
    while (
      end >= Math.max(0, bytes.byteLength - 65557) &&
      view.getUint32(end, true) !== 0x06054b50
    )
      end--;
    if (end < Math.max(0, bytes.byteLength - 65557))
      throw Error("无效的 Excel 文件");
    let cursor = view.getUint32(end + 16, true),
      total = 0;
    const count = view.getUint16(end + 10, true);
    if (count > 512) throw Error("Excel 文件项目过多");
    for (let i = 0; i < count; i++) {
      if (cursor + 46 > end || view.getUint32(cursor, true) !== 0x02014b50)
        throw Error("Excel 文件结构无效");
      total += view.getUint32(cursor + 24, true);
      if (total > 64 * 1024 * 1024) throw Error("Excel 解压后过大，请拆分导入");
      cursor +=
        46 +
        view.getUint16(cursor + 28, true) +
        view.getUint16(cursor + 30, true) +
        view.getUint16(cursor + 32, true);
    }
}

// Bound each downloadable volume by the same limits used when restoring it.
export async function backupFiles(rows: Entry[], template: boolean, scope: Kind | "summary" | "all") {
  const files: File[] = [];
  async function emit(batch: Entry[], split: boolean) {
    if (batch.length <= 30000 || scope === "summary") {
      const file = await workbook(batch, template, scope, split ? files.length + 1 : undefined);
      if (scope === "summary" || template) { files.push(file); return; }
      try {
        checkArchive(await file.arrayBuffer());
        files.push(file);
        return;
      } catch (error) {
        if (batch.length < 2) throw error;
      }
    }
    const middle = Math.ceil(batch.length / 2);
    await emit(batch.slice(0, middle), true);
    await emit(batch.slice(middle), true);
  }
  await emit(rows, false);
  return files;
}
export async function parseFile(file: File) {
  if (file.size > 16 * 1024 * 1024) throw Error("文件超过 16 MB");
  const bytes = await file.arrayBuffer();
  let partial = false;
  const blankIds = new Set<string>();
  const rows: Entry[] = [];
  const included: Kind[] = [];
  const add = (k: Kind, r: Record<string, unknown>, i: number) => {
    try {
      const entry = unpack(k, r, crypto.randomUUID());
      if (!r.id) blankIds.add(entry.id);
      rows.push(entry);
    } catch (e) {
      throw Error(names[k] + "明细第 " + i + " 行：" + (e as Error).message);
    }
  };
  if (/\.xlsx$/i.test(file.name)) {
    checkArchive(bytes);
    const book = new Workbook();
    await book.xlsx.load(bytes);
    partial = !!book.getWorksheet("分卷说明");
    let found = false;
    for (const k of kinds) {
      const detailName = new RegExp("^" + names[k] + "明细(?:-[1-9][0-9]*)?$");
      for (const sheet of book.worksheets.filter(sheet => detailName.test(sheet.name))) {
      found = true;
      included.push(k);
      const columns = new Map<string, number>();
      sheet.getRow(1).eachCell((c, i) => columns.set(c.text.trim(), i));
      if (!columns.has("日期") || !columns.has("美元"))
        throw Error(sheet.name + "缺少日期或美元列");

      sheet.eachRow((row, i) => {
        if (i === 1) return;
        const value = (name: string) => {
          const col = columns.get(name);
          if (!col) return null;
          const v = row.getCell(col).value;
          if (v instanceof Date) return v.toISOString().slice(0, 10);
          if (v && typeof v === "object")
            throw Error(sheet.name + "第 " + i + " 行请填写数值或文字");
          return v;
        };
        if (value("日期") === "合计") return;
        if (
          ["日期", "美元", "备注", "人民币", "分类", "收付方式"].every(
            (key) => !String(value(key) ?? "").trim(),
          )
        )
          return;
        const direction = String(value("汇款类型") ?? "").trim();
        if (k === "remittance" && direction !== "汇出" && direction !== "冲正") {
          throw Error(sheet.name + "第 " + i + " 行：汇款类型请选择「汇出」或「冲正」");
        }
        if (k === "remittance" && (num(value("美元")) < 0 || Number(value("人民币")) < 0)) {
          throw Error(sheet.name + "第 " + i + " 行：金额请填正数，并用汇款类型指定方向");
        }
        add(
          k,
          {
            date: value("日期"),
            amount: value("美元"),
            method: value("收付方式"),
            category: value("分类"),
            type: direction === "冲正" ? "subtract" : "add",
            rate: value("汇率"),
            cny: value("人民币"),
            note: value("备注"),
            id: value("记录编号"),
            revision: value("版本"),
          },
          i,
        );
      });
    }
    }
    if (!found)
      throw Error(
        "文件没有账本明细表。收支总览仅供查看，请导入含明细的账号版 Excel",
      );
  } else throw Error("请选择账号版 Excel（.xlsx）文件");
  const ids = new Set(rows.map((r) => r.kind + ":" + r.id));
  if (ids.size !== rows.length) throw Error("文件内含重复记录编号，请核对");
  return { rows, included, blankIds, partial };
}
