const ExcelJS = require('exceljs');
const crypto = require('crypto');

// Known header synonym patterns
const HEADER_PATTERNS = {
  itemNo: /^(sr\.?\s*no\.?|s\.?\s*no\.?|item\s*no\.?|sl\.?\s*no\.?|si\s*no\.?|item#|srno|serial\s*no\.?|line\s*no\.?|line\s*#|slno)$/i,
  description: /^(description|particulars|scope\s*of\s*work|item\s*description|work\s*description|item\s*name|item\s*details|items?|scope|description\s*of\s*work)$/i,
  specification: /^(specs?\/?\s*makes?|specification|specs?|make|brand\s*\/?\s*spec|approved\s*makes?|material\s*specs?|specification\s*\/\s*make)$/i,
  unit: /^(unit|uom|u\.o\.m\.?|unit\s*of\s*measure(ment)?)$/i,
  quantity: /^(qty|quantity|qty\.?|estimated\s*qty|total\s*qty|quantities|boq\s*qty|estimated\s*quantity)$/i,
  designQuantity: /^(design\s*qty|design\s*quantity|approved\s*qty)$/i,
  siteQuantity: /^(site\s*qty|site\s*quantity|actual\s*qty|installed\s*qty)$/i,
  rate: /^(rate|unit\s*rate|unit\s*price|rate\s*\(inr\)|rate\s*\(rs\.?\)|rate\s*\(₹\)|current\s*rate|commercial\s*rate|contract\s*rate|basic\s*rate|price|item\s*rate|rate\s*\/\s*unit|rate\/unit)$/i,
  originalRate: /^(original\s*rate|tender\s*rate|quoted\s*rate|base\s*rate)$/i,
  amount: /^(amount|total\s*amount|total|cost|amount\s*\(inr\)|amount\s*\(rs\.?\)|amount\s*\(₹\)|line\s*total|item\s*total|net\s*amount|total\s*cost)$/i,
  category: /^(trade|discipline|category|work\s*package|head|section)$/i,
  rateSource: /^(rate\s*source|source)$/i,
  comments: /^(comments?|remarks?|notes?)$/i
};

// Recognizes section titles like "A] DEMOLITION WORK", "B] CONCRETING WORK", "1.0 EARTHWORK", "PART A - CIVIL"
const SECTION_REGEX = /^([A-Z]\]|[0-9]+(?:\.[0-9]+)*\s*[-–—.]?|[A-Z]\s*[-–—.]|\bSECTION\b|\bPART\b)\s*(.*)$/i;

// Subtotal / Total patterns to avoid capturing as items
const TOTAL_ROW_REGEX = /^(sub\s*total|subtotal|total|grand\s*total|carry\s*forward|brought\s*forward|abstract\s*total|section\s*subtotal|trade\s*subtotal|sheet\s*total|total\s*for\s*section)/i;

/**
 * Safely parses numeric string, handling Indian comma formatting (e.g. 1,00,000.00),
 * currency symbols (₹, Rs.), trailing /-, and parenthesized negatives (500).
 */
function parseIndianNumber(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  
  let s = String(val).trim();
  if (!s) return null;

  let isNegative = false;
  if (/^\(.*\)$/.test(s)) {
    isNegative = true;
    s = s.slice(1, -1).trim();
  } else if (s.startsWith('-')) {
    isNegative = true;
    s = s.slice(1).trim();
  }

  // Strip currency prefixes and suffixes (₹, Rs., INR, /-, /=, per-unit suffixes)
  s = s.replace(/^[₹$€£]\s*/, '')
       .replace(/^rs\.?\s*/i, '')
       .replace(/^inr\s*/i, '')
       .replace(/\s*\/-$/, '')
       .replace(/\s*\/=$/, '')
       .replace(/\s*\/.*$/, '') // e.g. "/ sq.ft"
       .replace(/,/g, '') // remove Indian or western commas
       .trim();

  if (s !== '' && !isNaN(Number(s))) {
    const num = Number(s);
    return isNegative ? -num : num;
  }
  return null;
}

/**
 * Normalizes cell value from ExcelJS (handles formulas, dates, rich text, merged cells)
 */
function extractCellValue(cell) {
  if (!cell) return { text: '', num: null, formula: '' };
  
  let raw = cell.value;
  let formula = '';
  
  // If merged cell without value, fall back to master
  if ((raw === null || raw === undefined || raw === '') && cell.master && cell.master !== cell) {
    raw = cell.master.value;
  }

  if (raw === null || raw === undefined) {
    return { text: '', num: null, formula: '' };
  }

  // Handle formula objects { formula: 'SUM(E2:E10)', result: 150 }
  if (typeof raw === 'object') {
    if (raw.formula) {
      formula = String(raw.formula).trim();
      raw = raw.result !== undefined && raw.result !== null ? raw.result : '';
    } else if (raw.richText && Array.isArray(raw.richText)) {
      raw = raw.richText.map(rt => rt.text || '').join('');
    } else if (raw.text) {
      raw = raw.text;
    } else if (raw instanceof Date) {
      raw = raw.toISOString().split('T')[0];
    }
  }

  const str = String(raw).trim();
  const num = parseIndianNumber(str);

  return { text: str, num, formula };
}

/**
 * Normalizes standard construction units
 */
function normalizeUnit(unitStr) {
  if (!unitStr) return '';
  const u = String(unitStr).trim();
  const lower = u.toLowerCase().replace(/[\.\s_-]/g, '');

  if (['bag', 'bags'].includes(lower)) return 'Bag';
  if (['tonne', 'tonnes', 'ton', 'tons', 'mt'].includes(lower)) return 'Tonne';
  if (['rft', 'rfoot', 'runningfeet', 'runningft'].includes(lower)) return 'R.ft';
  if (['rmt', 'rmeter', 'runningmeter', 'rm'].includes(lower)) return 'Rmt';
  if (['sqft', 'sft', 'sqfoot', 'squarefeet'].includes(lower)) return 'Sq.Ft';
  if (['sqm', 'sqmtr', 'squaremeter'].includes(lower)) return 'Sq.m';
  if (['cum', 'cuft', 'cft'].includes(lower)) return 'Cu.Ft';
  if (['nos', 'no', 'number', 'numbers', 'each'].includes(lower)) return 'Nos';
  if (['kg', 'kgs', 'kilogram'].includes(lower)) return 'Kg';
  if (['ls', 'lumsum', 'lumpsum'].includes(lower)) return 'L.S.';
  if (['pt', 'point', 'pts'].includes(lower)) return 'Point';
  if (['set', 'sets'].includes(lower)) return 'Set';

  return u; // Return original if unknown
}

/**
 * Detects headers in a worksheet
 */
function detectHeaders(worksheet) {
  let headerRowIndex = -1;
  let headerMap = null;
  let maxMatchedCols = 0;

  // Scan first 30 rows for header row candidate
  for (let r = 1; r <= Math.min(30, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    const candidateMap = {};
    let matches = 0;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const { text } = extractCellValue(cell);
      if (!text) return;

      for (const [key, pattern] of Object.entries(HEADER_PATTERNS)) {
        if (!candidateMap[key] && pattern.test(text)) {
          candidateMap[key] = colNumber;
          matches++;
          break;
        }
      }
    });

    // A valid header must at least have Description and (Rate or Amount or Qty or Unit)
    if (candidateMap.description && (candidateMap.rate || candidateMap.originalRate || candidateMap.amount || candidateMap.quantity || candidateMap.unit)) {
      if (matches > maxMatchedCols) {
        maxMatchedCols = matches;
        headerRowIndex = r;
        headerMap = candidateMap;
      }
    }
  }

  return { headerRowIndex, headerMap };
}

/**
 * Inspects all sheets in workbook buffer without fully parsing items
 */
async function inspectWorkbookSheets(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheets = [];
  workbook.eachSheet((ws, id) => {
    const { headerRowIndex, headerMap } = detectHeaders(ws);
    sheets.push({
      id,
      name: ws.name.trim(),
      rowCount: ws.rowCount,
      hasHeader: headerRowIndex !== -1,
      headerRowIndex,
      isSummary: /summary|abstract/i.test(ws.name.trim()),
      columnsFound: headerMap ? Object.keys(headerMap) : []
    });
  });
  return sheets;
}

/**
 * Main parser function: parses workbook buffer into structured BOQ
 */
async function parseCommercialBOQ(buffer, fileName = 'BOQ.xlsx', options = {}) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const selectedSheets = Array.isArray(options.selectedSheets) && options.selectedSheets.length > 0 
    ? options.selectedSheets.map(s => s.trim().toLowerCase()) 
    : null;

  const parsedSheets = [];
  const importWarnings = [];
  let totalSectionsDetected = 0;
  let totalRowsDetected = 0;
  let totalOriginalAmount = 0;
  let missingRatesCount = 0;
  let missingQuantitiesCount = 0;
  let missingUnitsCount = 0;
  let duplicateItemsCount = 0;

  workbook.eachSheet((worksheet, sheetId) => {
    const sheetName = worksheet.name.trim();
    if (selectedSheets && !selectedSheets.includes(sheetName.toLowerCase())) {
      return; // Skip sheets not selected by user
    }

    const isSummarySheet = /summary|abstract/i.test(sheetName);
    const { headerRowIndex, headerMap } = detectHeaders(worksheet);

    if (headerRowIndex === -1 || !headerMap) {
      if (isSummarySheet) {
        parsedSheets.push({
          name: sheetName,
          order: sheetId,
          isSummarySheet: true,
          hasDesignSiteQty: false,
          subtotal: 0,
          sections: []
        });
        return;
      } else {
        importWarnings.push(`Sheet "${sheetName}": Standard header row could not be automatically detected.`);
        return;
      }
    }

    const hasDesignSiteQty = Boolean(headerMap.designQuantity && headerMap.siteQuantity);
    const sections = [];
    let currentSection = {
      id: `sec_${sheetId}_0`,
      code: '',
      name: 'GENERAL WORK',
      order: 0,
      subtotal: 0,
      rows: []
    };

    let sectionOrder = 1;

    // Iterate through data rows after header row
    for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      if (!row || !row.hasValues) continue;

      // Extract all mapped cell values
      const cellData = {};
      for (const [key, colNumber] of Object.entries(headerMap)) {
        cellData[key] = extractCellValue(row.getCell(colNumber));
      }

      // Check non-empty cells count across row
      let nonEmptyCellCount = 0;
      let firstTextCell = '';
      row.eachCell({ includeEmpty: false }, (cell) => {
        const val = extractCellValue(cell).text;
        if (val) {
          nonEmptyCellCount++;
          if (!firstTextCell) firstTextCell = val;
        }
      });

      if (nonEmptyCellCount === 0) continue; // Blank row

      const descText = cellData.description ? cellData.description.text.trim() : '';
      const itemNoText = cellData.itemNo ? cellData.itemNo.text.trim() : '';
      const unitText = cellData.unit ? cellData.unit.text.trim() : '';
      const qtyNum = cellData.quantity ? cellData.quantity.num : null;
      const rateNum = cellData.rate ? cellData.rate.num : null;
      const originalRateColNum = cellData.originalRate ? cellData.originalRate.num : null;
      const amountNum = cellData.amount ? cellData.amount.num : null;
      const designQtyNum = cellData.designQuantity ? cellData.designQuantity.num : null;
      const siteQtyNum = cellData.siteQuantity ? cellData.siteQuantity.num : null;

      // Check if this row is a Subtotal or Total row -> Skip from item rows
      const isTotalRow = TOTAL_ROW_REGEX.test(descText) || 
                         TOTAL_ROW_REGEX.test(firstTextCell) || 
                         TOTAL_ROW_REGEX.test(itemNoText) ||
                         /sub\s*total|grand\s*total/i.test(firstTextCell) ||
                         /sub\s*total|grand\s*total/i.test(descText);
      if (isTotalRow) {
        continue;
      }

      // A cell in the first column may be a section header placed in the first cell (e.g. "A] DEMOLITION WORK", "B] CONCRETING WORK")
      const isFirstCellSection = Boolean(
        /^(SECTION\b|PART\b|[A-Z]\]|[0-9]+(?:\.[0-9]+)*\s*[-–—]\s*[A-Z])/i.test(firstTextCell) ||
        (firstTextCell.length > 20 && !unitText && (qtyNum === null || qtyNum === 0) && (rateNum === null || rateNum === 0))
      );

      // Check if this row is an actual item row (has unit, qty, rate, or amount)
      const hasItemQuantityOrRate = Boolean(
        unitText || 
        (qtyNum !== null && !isNaN(qtyNum) && qtyNum > 0) || 
        (rateNum !== null && !isNaN(rateNum) && rateNum > 0) || 
        (amountNum !== null && !isNaN(amountNum) && amountNum > 0)
      );

      const textToTestForSection = isFirstCellSection ? firstTextCell : (descText || firstTextCell);
      const isExplicitSectionTitle = /^(SECTION\b|PART\b|[A-Z]\]|[0-9]+(?:\.[0-9]+)*\s*[-–—]\s*[A-Z])/i.test(textToTestForSection);

      // Check if this row is a Section Heading
      if ((isExplicitSectionTitle || (!hasItemQuantityOrRate && !unitText && textToTestForSection.length > 0)) && !hasItemQuantityOrRate) {
        if (currentSection.rows.length > 0) {
          sections.push(currentSection);
          totalSectionsDetected++;
        }

        const sectionMatch = textToTestForSection.match(/^([A-Z]\]|[0-9]+(?:\.[0-9]+)*\s*[-–—.]?|[A-Z]\s*[-–—.]|\bSECTION\s*\d*\b|\bPART\s*[A-Z0-9]*\b)\s*(.*)$/i);
        const secCode = sectionMatch ? (sectionMatch[1] ? sectionMatch[1].trim() : '') : '';
        const secName = (sectionMatch ? (sectionMatch[2] || textToTestForSection) : textToTestForSection).trim();

        currentSection = {
          id: `sec_${sheetId}_${sectionOrder}`,
          code: secCode,
          name: secName || `SECTION ${sectionOrder}`,
          order: sectionOrder++,
          subtotal: 0,
          rows: []
        };
        continue;
      }

      // Check if this row is a repeated header row in multi-page printouts
      if (HEADER_PATTERNS.description.test(descText) && HEADER_PATTERNS.unit.test(unitText)) {
        continue;
      }

      if (!descText && !itemNoText && qtyNum === null && rateNum === null) {
        continue; // Empty/spacer row
      }

      // Construct item row
      const rowId = `item_${sheetId}_${r}_${crypto.randomBytes(3).toString('hex')}`;
      const normalizedUnit = normalizeUnit(unitText);
      
      let effectiveRate = rateNum !== null ? Math.max(0, rateNum) : (originalRateColNum !== null ? Math.max(0, originalRateColNum) : 0);

      // Determine applicable quantity
      let quantity = qtyNum !== null ? qtyNum : 0;
      let quantityBasis = 'quantity';

      if (hasDesignSiteQty) {
        if (siteQtyNum !== null) {
          quantity = siteQtyNum;
          quantityBasis = 'siteQuantity';
        } else if (designQtyNum !== null) {
          quantity = designQtyNum;
          quantityBasis = 'designQuantity';
        }
      }

      // If rate is missing/0 but amount and quantity exist, deduce unit rate
      if (effectiveRate === 0 && quantity > 0 && amountNum !== null && amountNum > 0) {
        effectiveRate = Math.round((amountNum / quantity) * 100) / 100;
      }

      // Determine amount: calculate if missing or preserve original amount
      let calculatedAmount = Math.round(quantity * effectiveRate * 100) / 100;
      let originalAmount = amountNum !== null ? amountNum : calculatedAmount;

      // Duplicate item detection in current section
      const isDuplicate = Boolean(descText && currentSection.rows.some(r => 
        (r.itemNo && itemNoText && r.itemNo.trim() === itemNoText.trim()) ||
        (r.description && r.description.trim().toLowerCase() === descText.trim().toLowerCase())
      ));

      if (isDuplicate) duplicateItemsCount++;
      if (effectiveRate === 0) missingRatesCount++;
      if (quantity === 0) missingQuantitiesCount++;
      if (!normalizedUnit && quantity > 0) missingUnitsCount++;

      // Warnings for incomplete data
      if (!descText) {
        importWarnings.push(`Sheet "${sheetName}" Row ${r}: Missing description.`);
      }
      if (!normalizedUnit && quantity > 0) {
        importWarnings.push(`Sheet "${sheetName}" Row ${r}: Missing unit for item "${descText.slice(0, 30)}...".`);
      }
      if (effectiveRate === 0 && quantity > 0) {
        importWarnings.push(`Sheet "${sheetName}" Row ${r}: Missing rate for item "${descText.slice(0, 30)}...".`);
      }

      const itemRow = {
        id: rowId,
        originalRowNumber: r,
        itemNo: itemNoText,
        description: descText || `Item at row ${r}`,
        specification: cellData.specification ? cellData.specification.text : '',
        make: '',
        unit: normalizedUnit,

        // Quantities
        quantity,
        designQuantity: designQtyNum,
        siteQuantity: siteQtyNum,
        quantityBasis,

        // Commercial Rates
        originalRate: effectiveRate,
        currentRate: effectiveRate,
        amount: calculatedAmount,
        originalAmount,
        rateSource: effectiveRate > 0 ? (cellData.rateSource ? cellData.rateSource.text : 'ORIGINAL') : 'UNAVAILABLE',
        comments: cellData.comments ? cellData.comments.text : '',
        originalFormula: cellData.amount ? cellData.amount.formula : '',

        // Validation & QA Flags
        missingRate: effectiveRate === 0,
        missingQuantity: quantity === 0,
        missingUnit: !normalizedUnit,
        isDuplicate,
        invalidNumber: isNaN(quantity) || isNaN(effectiveRate),

        // Material Intelligence Placeholders (populated by materialClassifier)
        materialCode: null,
        materialName: '',
        materialCategory: '',
        materialMatchConfidence: 0,
        classificationStatus: 'UNMATCHED',
        itemType: 'UNKNOWN',
        compatibilityStatus: 'INCOMPATIBLE',

        latestMaterialRate: null,
        latestMaterialRateUnit: '',
        materialRateSource: null,
        materialPricingScope: null,
        materialRateRecordId: null,

        rateHistory: [],
        rawMetadata: {
          sheetName,
          rowNumber: r,
          rawItemNo: itemNoText,
          rawDescription: descText,
          rawUnit: unitText,
          rawQty: cellData.quantity ? cellData.quantity.text : '',
          rawRate: cellData.rate ? cellData.rate.text : '',
          rawAmount: cellData.amount ? cellData.amount.text : ''
        }
      };

      currentSection.rows.push(itemRow);
      currentSection.subtotal = Math.round((currentSection.subtotal + calculatedAmount) * 100) / 100;
      totalRowsDetected++;
      totalOriginalAmount = Math.round((totalOriginalAmount + calculatedAmount) * 100) / 100;
    }

    if (currentSection.rows.length > 0) {
      sections.push(currentSection);
      totalSectionsDetected++;
    }

    const sheetSubtotal = sections.reduce((sum, s) => sum + s.subtotal, 0);

    parsedSheets.push({
      name: sheetName,
      order: sheetId,
      isSummarySheet: false,
      hasDesignSiteQty,
      subtotal: Math.round(sheetSubtotal * 100) / 100,
      sections
    });
  });

  return {
    sheets: parsedSheets,
    importWarnings,
    stats: {
      totalSheets: parsedSheets.length,
      totalSections: totalSectionsDetected,
      totalRows: totalRowsDetected,
      missingRatesCount,
      missingQuantitiesCount,
      missingUnitsCount,
      duplicateItemsCount,
      totalOriginalAmount,
      totalCurrentAmount: totalOriginalAmount
    }
  };
}

module.exports = {
  parseCommercialBOQ,
  inspectWorkbookSheets,
  extractCellValue,
  normalizeUnit,
  detectHeaders,
  parseIndianNumber
};
