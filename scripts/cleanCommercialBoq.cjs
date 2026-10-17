const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../src/pages/CommercialBOQPage.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Remove Mode A body between the global file input and STEP 1: UPLOAD DROPZONE
const startMarker = '<input\n        type="file"\n        ref={fileInputRef}\n        onChange={(e) => {\n          if (e.target.files?.[0]) {\n            handleFileSelect(e.target.files[0]);\n          }\n          e.target.value = null;\n        }}\n        accept=".xlsx,.xls"\n        className="hidden"\n      />';
const startIdx = content.indexOf(startMarker);

const endMarker = '{/* STEP 1: UPLOAD DROPZONE */}';
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
  const replacement = startMarker + '\n\n      {/* ========================================================================= */}\n      {/* ======================== DETAILED COMMERCIAL BOQ ======================= */}\n      {/* ========================================================================= */}\n      <div className="space-y-6">\n\n        ';
  content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
  console.log('Successfully replaced Mode A body with Detailed BOQ container.');
} else {
  console.error('Could not find start or end markers for Mode A body:', { startIdx, endIdx });
}

// 2. Remove closing )} around line 1959
const closingPattern = '        </div>\n      )}\n\n      {/* ================= SAVED BOQS MODAL ================= */}';
const altClosingPattern = '        </div>\r\n      )}\r\n\r\n      {/* ================= SAVED BOQS MODAL ================= */}';

if (content.includes(closingPattern)) {
  content = content.replace(closingPattern, '        </div>\n\n      {/* ================= SAVED BOQS MODAL ================= */}');
  console.log('Successfully fixed closing tag.');
} else if (content.includes(altClosingPattern)) {
  content = content.replace(altClosingPattern, '        </div>\r\n\r\n      {/* ================= SAVED BOQS MODAL ================= */}');
  console.log('Successfully fixed closing tag (CRLF).');
} else {
  console.warn('Closing pattern not matched directly, checking regex...');
  content = content.replace(/<\/div>\s*\}\)\s*\{\/\* ================= SAVED BOQS MODAL ================= \*\//, '</div>\n\n      {/* ================= SAVED BOQS MODAL ================= */}');
}

// 3. Add Upload New File button in editor Action Toolbar
const addRowMarker = '<button\n                    onClick={() => handleAddRow(activeSheetIndex, 0)}';
const altAddRowMarker = '<button\r\n                    onClick={() => handleAddRow(activeSheetIndex, 0)}';

const uploadBtnCode = `<button
                    onClick={() => {
                      if (!confirm('Upload a new Excel workbook? Any unsaved edits in current BOQ will be replaced.')) return;
                      fileInputRef.current?.click();
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#475569] hover:text-[#172033] border border-[#CBD5E1] text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs"
                    title="Upload replacement Excel workbook"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload New File</span>
                  </button>

                  `;

if (content.includes(addRowMarker)) {
  content = content.replace(addRowMarker, uploadBtnCode + addRowMarker);
  console.log('Successfully added Upload New File button to editor toolbar.');
} else if (content.includes(altAddRowMarker)) {
  content = content.replace(altAddRowMarker, uploadBtnCode + altAddRowMarker);
  console.log('Successfully added Upload New File button to editor toolbar (CRLF).');
} else {
  console.error('Could not find Add Row marker in editor toolbar');
}

// 4. Add 4 Financial Summary Cards right below Action Toolbar
const toolbarEndMarker = '</div>\n              </div>\n\n              {/* Material Intelligence Panel */}';
const altToolbarEndMarker = '</div>\r\n              </div>\r\n\r\n              {/* Material Intelligence Panel */}';

const summaryCardsCode = `</div>
              </div>

              {/* 4 Financial Summary Cards Requested by Client (Page 7) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Summary Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Summary (Pre-tax)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      {financialSummary.totalItems} items
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
                    {formatINR(financialSummary.subtotal)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pre-tax BOQ subtotal across {boqData.sheets?.length || 1} sheet(s)
                  </p>
                </div>

                {/* 2. Material Cost Card */}
                <div className="bg-white rounded-2xl border border-blue-200 bg-blue-50/30 p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">2. Material Cost</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {financialSummary.hasMaterialBreakdown ? \`\${financialSummary.materialItemsCount} items\` : 'Rate Takeoff'}
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-blue-800 tracking-tight font-mono">
                    {financialSummary.hasMaterialBreakdown ? formatINR(financialSummary.materialCost) : formatINR(financialSummary.subtotal)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {financialSummary.hasMaterialBreakdown 
                      ? 'Direct material supply takeoff items'
                      : 'Commercial contract trade materials + labour'}
                  </p>
                </div>

                {/* 3. GST Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">3. GST ({financialSummary.gstRate}%)</span>
                    <select
                      value={boqData.gstRate !== undefined ? boqData.gstRate : 18}
                      onChange={(e) => {
                        const updated = { ...boqData, gstRate: Number(e.target.value) };
                        setBoqData(recalculateLocalBOQ(updated));
                      }}
                      className="text-[10px] bg-slate-100 font-bold text-slate-700 rounded px-1.5 py-0.5 border border-slate-200 cursor-pointer focus:outline-none"
                    >
                      <option value={0}>0% GST</option>
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST</option>
                      <option value={28}>28% GST</option>
                    </select>
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
                    {formatINR(financialSummary.gstAmount)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Calculated on taxable subtotal {formatINR(financialSummary.subtotal)}
                  </p>
                </div>

                {/* 4. Total Cost Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">4. Total Cost</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
                      Grand Total
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-white tracking-tight font-mono">
                    {formatINR(financialSummary.grandTotal)}
                  </div>
                  <p className="text-[11px] text-emerald-100 mt-1">
                    Final project amount including GST &amp; trade charges
                  </p>
                </div>
              </div>

              {/* Material Intelligence Panel */}`;

if (content.includes(toolbarEndMarker)) {
  content = content.replace(toolbarEndMarker, summaryCardsCode);
  console.log('Successfully added 4 Financial Summary Cards.');
} else if (content.includes(altToolbarEndMarker)) {
  content = content.replace(altToolbarEndMarker, summaryCardsCode);
  console.log('Successfully added 4 Financial Summary Cards (CRLF).');
} else {
  console.error('Could not find toolbar end marker');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('CommercialBOQPage updated successfully.');
