// Bill text parsing checks: node tests/parse.test.js
// Pull parseBillText out of the page and run it on sample bill text.
const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function parseBillText(text)');
let depth = 0, end = start;
for (let i = html.indexOf('{', start); i < html.length; i++) { if (html[i] === '{') depth++; else if (html[i] === '}' && --depth === 0) { end = i + 1; break; } }
const parseBillText = new Function(html.slice(start, end) + '\nreturn parseBillText;')();
let fails = 0;
const check = (cond, msg) => { console.log((cond ? 'ok:   ' : 'FAIL: ') + msg); if (!cond) fails++; };
const big = 'Issue Date: 05/08/2026 BILL AMOUNT $1,234.56 CHARGES TOTAL $1,301.20 CREDITS $66.64 Supply Charge 31 days $1,045.10 '
  + 'Peak Energy 01 Jul - 31 Jul 1,234.5 kWh Off Peak Energy 01 Jul - 31 Jul 210.0 kWh Off-Peak Energy 01 Jul - 31 Jul 5.0 kWh Flat Energy 01 Jul - 31 Jul 99.5 kWh '
  + 'Solar Exports 1,234.5kWh Billing Days: 31';
const r = parseBillText(big);
check(r.totalBill === 1234.56, `BILL AMOUNT $1,234.56 reads as 1234.56 (got ${r.totalBill})`);
check(r.totalCharges === 1301.2 && r.totalCredits === 66.64 && r.supplyChargeCost === 1045.1, `charges, credits and supply with commas (got ${r.totalCharges}, ${r.totalCredits}, ${r.supplyChargeCost})`);
check(r.peakKwh === 1234.5, `single-space "Peak Energy" with 1,234.5 kWh (got ${r.peakKwh})`);
check(r.offpeakKwh === 215, `"Off Peak" and "Off-Peak" are off-peak, not peak (got ${r.offpeakKwh})`);
check(r.shoulderKwh === 99.5 && r.solarExportKwh === 1234.5, `flat and solar exports (got ${r.shoulderKwh}, ${r.solarExportKwh})`);
// The layout the page was written for: two spaces before Peak, no commas.
const old = parseBillText('Issue Date: 05/08/2026 BILL AMOUNT $123.45 CHARGES TOTAL $150.00 CREDITS $26.55 Supply Charge 31 days $45.10 x  Peak Energy 01 Jul - 31 Jul 120.5 kWh Off Peak Energy 01 Jul - 31 Jul 210.0 kWh Billing Days: 31');
check(old.totalBill === 123.45 && old.peakKwh === 120.5 && old.offpeakKwh === 210, `the original layout still reads the same (${old.totalBill}, ${old.peakKwh}, ${old.offpeakKwh})`);
const neg = parseBillText('BILL AMOUNT -$12.30 CHARGES TOTAL $1.00 CREDITS $13.30 Supply Charge $1.00 Billing Days: 3');
check(neg.totalBill === -12.3, `a credit bill (-$12.30) stays negative (got ${neg.totalBill})`);
console.log(fails ? fails + ' failed' : 'all passed');
process.exit(fails ? 1 : 0);
