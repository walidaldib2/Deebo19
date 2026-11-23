# DEEB — Protected Report Printing Baseline

This document is a standing project constraint. Read it before making any change that could affect reports, export, pagination, or Android printing.

## Protected behavior

Do not change the existing PDF printing, print preview, or report-image export implementation unless the owner explicitly authorizes that specific change.

Protected areas include:
- `printHtml` and `readableReportHtml`
- PDF generation and print handlers
- Report image export handler (including `saveReportImage`)
- Print CSS and pagination rules, including `@media print`
- The HTML/WebView-to-PDF-to-PNG image export path
- Android/native print and image-export bridge/plugin integration

## Required report layout

- Preserve the approved reference-image design and visual identity.
- Colors: light beige, burgundy, green, and gold.
- Preserve the bike details, table structure, column order, font sizes, and spacing.
- Put the date at the top of the page, outside the table. Never add it as a table column.
- The standalone narrative report heading is **التقرير اليومي** (not "التقرير اليومي الكتابي").
- Do not shrink fonts, squeeze text, or compress spacing to force content onto one page.
- Continue overflowing content onto additional pages.
- A one-page report has no page number. Reports with two or more pages have page numbers at the bottom of each page.
- Apply these rules consistently to every report type.

## Change-control checklist

Before any related change:
1. Identify whether the proposed change touches a protected area or can indirectly affect it.
2. If it does, stop and request explicit authorization before editing.
3. Keep unrelated fixes isolated from print/export code.
4. Compare protected functions, handlers, CSS, and native bridge files against the known-good baseline.
5. Run available build and automated checks.
6. Report exactly what was compared and tested. A successful build is not proof of correct printing on a physical device.
7. Never claim device-level print verification unless it was actually tested on the user's device.

## Recorded reference

- Development branch: `feature/main-menu-reorganization`
- Recorded code state containing the latest reports database fix: `f5c48ddda80220a124d84d9f2b906cf0700e64c2`
- The reports database fix was isolated to `db.js`; PDF and image-printing code was not intentionally changed in that fix.
- The earlier restoration reference discussed for the UI files: `03273849d119acdb764d4e18470eb28ec6b887d8`

This document records the protection policy and reference points; it does not claim that every printer/device combination has been physically tested.
