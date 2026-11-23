const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
const start = source.indexOf("const printHtml=d=>{");
const end = source.indexOf("const readableReportHtml=", start);
if (start < 0 || end <= start) throw new Error("Could not locate the production printHtml function.");

const productionFunction = source.slice(start, end).trim();
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const fakeSelector = selector => selector === "#reportType" ? { value: "written_reports" } : { value: "" };
const dayOf = record => record.payload?.report_date || String(record.created_at || "").slice(0, 10);
const sandbox = { module: { exports: {} }, $: fakeSelector, dayOf, esc: escapeHtml };
vm.createContext(sandbox);
vm.runInContext(
  productionFunction + "\nmodule.exports = printHtml;",
  sandbox,
  { filename: "app.js#printHtml" }
);
const printHtml = sandbox.module.exports;
if (typeof printHtml !== "function") throw new Error("Production printHtml was not loaded.");

const longText = ("تفاصيل التقرير اليومي — متابعة الأعمال والإجراءات المطلوبة. ").repeat(250);
const one = printHtml([{
  id: "daily-1",
  entity_type: "written_reports",
  created_at: "2026-11-23T02:00:00.000Z",
  payload: {
    report_date: "2026-11-23",
    shift: "ليلي",
    prepared_by: "مشرف الاختبار",
    report_text: "تمت المتابعة بنجاح. <script>alert(1)</script>"
  }
}]);
if ((one.match(/<section class="written-page">/g) || []).length !== 1) {
  throw new Error("A single daily report must produce exactly one report section.");
}
for (const marker of ["التقرير اليومي", "مشرف الاختبار", "تمت المتابعة بنجاح.", "&lt;script&gt;", "break-after:page"]) {
  if (!one.includes(marker)) throw new Error("Single-report HTML is missing expected content or layout marker: " + marker);
}
if (one.includes("<script>alert(1)</script>")) throw new Error("Report text must be HTML-escaped.");

const many = printHtml([
  { id: "daily-2", entity_type: "written_reports", created_at: "2026-11-22T22:00:00.000Z",
    payload: { report_date: "2026-11-22", shift: "مسائي", prepared_by: "مشرف 2", report_text: longText } },
  { id: "daily-3", entity_type: "written_reports", created_at: "2026-11-23T02:00:00.000Z",
    payload: { report_date: "2026-11-23", shift: "ليلي", prepared_by: "مشرف 3", report_text: "نهاية التقرير الثاني." } }
]);
if ((many.match(/<section class="written-page">/g) || []).length !== 2) {
  throw new Error("Two saved daily reports must produce exactly two report sections.");
}
if (!many.includes(longText) || !many.includes("نهاية التقرير الثاني.") || many.indexOf("مشرف 2") > many.indexOf("مشرف 3")) {
  throw new Error("Long report text must remain complete and reports must stay in date order.");
}
if (!many.includes("min-height:185mm") || !many.includes("font-size:20px") || many.includes("transform:scale(")) {
  throw new Error("Daily report must retain readable typography and must not shrink content to fit.");
}

console.log("Written daily report HTML regression checks passed (single report, multiple reports, long text, escaping, typography).");
