const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
const printStart = source.indexOf("const printHtml=d=>{");
const readableStart = source.indexOf("const readableReportHtml=", printStart);
const saveStart = source.indexOf('$("#saveReportImage").onclick=', readableStart);
if (printStart < 0 || readableStart <= printStart || saveStart <= readableStart) {
  throw new Error("Could not locate the production report HTML builders.");
}
const printSource = source.slice(printStart, readableStart).trim();
const readableSource = source.slice(readableStart, saveStart).trim();

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const sandbox = {
  module: { exports: {} },
  $: selector => selector === "#reportType" ? { value: "written_reports" } : { value: "" },
  dayOf: record => record.payload?.report_date || String(record.created_at || "").slice(0, 10),
  esc: escapeHtml
};
vm.createContext(sandbox);
vm.runInContext(
  printSource + "\n" + readableSource + "\nmodule.exports={printHtml,readableReportHtml};",
  sandbox,
  { filename: "app.js#daily-report-pdf-fixture" }
);
const { printHtml, readableReportHtml } = sandbox.module.exports;
if (typeof printHtml !== "function" || typeof readableReportHtml !== "function") {
  throw new Error("Could not load the production daily-report rendering functions.");
}

const longText = ("REPORT_BODY_PAGE_SENTINEL تمت متابعة الأعمال الأمنية بالموقع، ومراجعة انتظام سير العمل، وتوثيق الملاحظات والإجراءات التي تم اتخاذها خلال الوردية. ").repeat(65);
const records = [
  {
    id: "daily-long",
    entity_type: "written_reports",
    created_at: "2026-11-22T22:00:00.000Z",
    payload: {
      report_date: "2026-11-22",
      shift: "مسائي",
      prepared_by: "مشرف اختبار الصفحات",
      report_text: "LONG_REPORT_START_SENTINEL " + longText + " LONG_REPORT_END_SENTINEL"
    }
  },
  {
    id: "daily-short",
    entity_type: "written_reports",
    created_at: "2026-11-23T02:00:00.000Z",
    payload: {
      report_date: "2026-11-23",
      shift: "ليلي",
      prepared_by: "مشرف التقرير الثاني",
      report_text: "SECOND_REPORT_CONTENT_SENTINEL محتوى التقرير الثاني للتأكد من استمرار الصفحة التالية."
    }
  }
];
const html = readableReportHtml(printHtml(records));
if (!html.includes("علامة نهاية التقرير الطويل.") || !html.includes("محتوى التقرير الثاني")) {
  throw new Error("The production HTML omitted fixture report content.");
}
const output = process.argv[2];
if (!output) throw new Error("Pass the output HTML path as the first argument.");
fs.writeFileSync(output, html, "utf8");
console.log("Generated Chromium PDF fixture from production daily-report HTML.");
