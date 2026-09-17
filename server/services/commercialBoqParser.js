const ExcelJS = require('exceljs');
const crypto = require('crypto');

// Known header synonym patterns
const HEADER_PATTERNS = {
  itemNo: /^(sr\.?\s*no\.?|s\.?\s*no\.?|item\s*no\.?|sl\.?\s*no\.?|si\s*no\.?|item#|srno)$/i,
  description: /^(description|particulars|scope\s*of\s*work|item\s*description|work\s*description)$/i,
  specification: /^(specs?\/?\s*makes?|specification|specs?|make|brand\s*\/?\s*spec|approved\s*makes?|material\s*specs?)$/i,
  unit: /^(unit|uom)$/i,
  quantity: /^(qty|quantity|qty\.?)$/i,
  designQuantity: /^(design\s*qty|design\s*quantity|approved\s*qty)$/i,
  siteQuantity: /^(site\s*qty|site\s*quantity|actual\s*qty|installed\s*qty)$/i,
  rate: /^(rate|unit\s*rate|unit\s*price|rate\s*\(inr\)|rate\s*\(rs\.?\))$/i,
  amount: /^(amount|total\s*amount|total|cost|amount\s*\(inr\)|amount\s*\(rs\.?\))$/i,
  comments: /^(comments?|remarks?|notes?)$/i
};

// Recognizes section titles like "A] DEMOLITION WORK", "B] CONCRETING WORK", "1.0 EARTHWORK", "PART A - CIVIL"
const SECTION_REGEX = /^([A-Z]\]|[0-9]+(?:\.[0-9]+)*\s*[-–—.]?|[A-Z]\s*[-–—.]|\bSECTION\b|\bPART\b)\s*(.*)$/i;

// Subtotal / Total patterns to avoid capturing as items
const TOTAL_ROW_REGEX = /^(sub\s*total|subtotal|total|grand\s*total|carry\s*forward|brought\s*forward|abstract\s*total)/i;

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
      raw = raw.result !== undefined ? raw.result : '';
    } else if (raw.richText && Array.isArray(raw.richText)) {
      raw = raw.richText.map(rt => rt.text || '').join('');
    } else if (raw.text) {
      raw = raw.text;
    } else if (raw instanceof Date) {
      raw = raw.toISOString().split('T')[0];
    }
  }

  const str = String(raw).trim();
  
  // Clean string for numeric parsing (strip ₹, Rs., commas, spaces)
  const cleanedNumStr = str.replace(/[₹$,\s]/g, '').replace(/^rs\.?/i, '');
  let num = null;
  if (cleanedNumStr !== '' && !isNaN(Number(cleanedNumStr))) {
    num = Number(cleanedNumStr);
  }

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

  // Scan first 15 rows for header row candidate
  for (let r = 1; r <= Math.min(15, worksheet.rowCount); r++) {
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
    if (candidateMap.description && (candidateMap.rate || candidateMap.amount || candidateMap.quantity || candidateMap.unit)) {
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
 * Main parser function: parses workbook buffer into structured BOQ
 */
async function parseCommercialBOQ(buffer, fileName = 'BOQ.xlsx') {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const parsedSheets = [];
  const importWarnings = [];
  let totalSectionsDetected = 0;
  let totalRowsDetected = 0;
  let totalOriginalAmount = 0;

  workbook.eachSheet((worksheet, sheetId) => {
    const sheetName = worksheet.name.trim();
    const isSummarySheet = /summary|abstract/i.test(sheetName);

    // If it's pure summary sheet with no items, mark it
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

      const descText = cellData.description ? cellData.description.text : '';
      const itemNoText = cellData.itemNo ? cellData.itemNo.text : '';
      const unitText = cellData.unit ? cellData.unit.text : '';
      const qtyNum = cellData.quantity ? cellData.quantity.num : null;
      const rateNum = cellData.rate ? cellData.rate.num : null;
      const amountNum = cellData.amount ? cellData.amount.num : null;
      const designQtyNum = cellData.designQuantity ? cellData.designQuantity.num : null;
      const siteQtyNum = cellData.siteQuantity ? cellData.siteQuantity.num : null;

      // Check if this row is a Subtotal or Total row -> Skip from item rows
      if (TOTAL_ROW_REGEX.test(descText) || TOTAL_ROW_REGEX.test(firstTextCell) || TOTAL_ROW_REGEX.test(itemNoText)) {
        continue;
      }

      // Check if this row is a Section Heading
      // E.g.: descText matches SECTION_REGEX and has no unit/qty/rate, OR first cell matches SECTION_REGEX
      const sectionMatch = descText.match(SECTION_REGEX) || firstTextCell.match(SECTION_REGEX);
      const isHeaderLikeRow = (!unitText && qtyNum === null && rateNum === null);

      if (sectionMatch && isHeaderLikeRow) {
        // Save current section if it has rows
        if (currentSection.rows.length > 0) {
          sections.push(currentSection);
          totalSectionsDetected++;
        }

        const secCode = sectionMatch[1] ? sectionMatch[1].trim() : '';
        const secName = (sectionMatch[2] || descText || firstTextCell).trim();

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

      // Check if this row is an Item Row
      // Must have some description or itemNo, and cannot be a repeated header
      if (HEADER_PATTERNS.description.test(descText) && HEADER_PATTERNS.unit.test(unitText)) {
        continue; // Repeated header row in multi-page printouts
      }

      if (!descText && !itemNoText && qtyNum === null && rateNum === null) {
        continue; // Empty/spacer row
      }

      // Construct item row
      const rowId = `item_${sheetId}_${r}_${crypto.randomBytes(3).toString('hex')}`;
      const normalizedUnit = normalizeUnit(unitText);
      const originalRate = rateNum !== null ? Math.max(0, rateNum) : 0;
      
      // Determine applicable quantity
      let quantity = qtyNum !== null ? qtyNum : 0;
      let quantityBasis = 'quantity';

      if (hasDesignSiteQty) {
        // In electrical sheets with both site & design quantity, default basis is Site Qty
        if (siteQtyNum !== null) {
          quantity = siteQtyNum;
          quantityBasis = 'siteQuantity';
        } else if (designQtyNum !== null) {
          quantity = designQtyNum;
          quantityBasis = 'designQuantity';
        }
      }

      // Determine amount: calculate if missing or preserve original amount
      let calculatedAmount = Math.round(quantity * originalRate * 100) / 100;
      let originalAmount = amountNum !== null ? amountNum : calculatedAmount;

      // Warnings for incomplete data
      if (!descText) {
        importWarnings.push(`Sheet "${sheetName}" Row ${r}: Missing description.`);
      }
      if (!normalizedUnit && quantity > 0) {
        importWarnings.push(`Sheet "${sheetName}" Row ${r}: Missing unit for item "${descText.slice(0, 30)}...".`);
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
        originalRate,
        currentRate: originalRate,
        amount: calculatedAmount,
        originalAmount,
        rateSource: originalRate > 0 ? 'ORIGINAL' : 'UNAVAILABLE',
        comments: cellData.comments ? cellData.comments.text : '',
        originalFormula: cellData.amount ? cellData.amount.formula : '',

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
      totalOriginalAmount,
      totalCurrentAmount: totalOriginalAmount
    }
  };
}

module.exports = {
  parseCommercialBOQ,
  extractCellValue,
  normalizeUnit,
  detectHeaders
};
