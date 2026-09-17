/**
 * Material & Work Classification Service for Commercial BOQs
 * Enforces strict separation between Commercial BOQ Line Items and Raw Materials
 */

const MATERIAL_CATALOG_RULES = [
  // CEMENT
  {
    category: 'cement',
    materialCode: 'CM-ULTRATECH-STD',
    materialName: 'UltraTech PPC / ACC Gold',
    catalogUnit: 'Bag',
    brands: ['ultratech', 'acc', 'dalmia', 'penna', 'birla', 'ambuja', 'shree'],
    keywords: ['opc 53', 'opc 43', 'ppc cement', 'portland pozzolana', 'portland cement', 'structural cement', 'cement supply', 'cement'],
    itemTypeHints: {
      direct: ['supply of cement', 'cement bag', 'procurement of cement', 'supply of opc', 'supply of ppc', 'cement supply'],
      compound: ['rcc', 'concrete', 'lintel', 'column', 'beam', 'slab', 'plaster', 'mortar', 'masonry', 'screed']
    }
  },
  // STEEL REINFORCEMENT
  {
    category: 'steel',
    materialCode: 'ST-JSW',
    materialName: 'JSW Neosteel Fe 550D',
    catalogUnit: 'Tonne',
    brands: ['jsw', 'tata tiscon', 'tata', 'jindal', 'kamdhenu', 'sail', 'indus'],
    keywords: ['fe 500d', 'fe 550d', 'fe 550', 'tmt rebar', 'tmt steel', 'reinforcement steel', 'reinforcement bar', 'steel supply'],
    itemTypeHints: {
      direct: ['supply of steel', 'supply of tmt', 'procurement of steel', 'tmt bars supply', 'steel rebar supply'],
      compound: ['rcc', 'fabrication', 'lintel', 'slab', 'column', 'footing']
    }
  },
  // SAND / AGGREGATE
  {
    category: 'sand',
    materialCode: 'SD-STD',
    materialName: 'Standard M-Sand (Concreting) + P-Sand (Plastering)',
    catalogUnit: 'Cu.Ft',
    brands: ['vsi', 'robo', 'double washed'],
    keywords: ['m-sand', 'msand', 'p-sand', 'psand', 'river sand', 'manufactured sand', 'fine aggregate'],
    itemTypeHints: {
      direct: ['supply of sand', 'supply of m-sand', 'procurement of sand'],
      compound: ['mortar', 'plaster', 'concreting', 'masonry', 'flooring']
    }
  },
  // MASONRY BLOCKS
  {
    category: 'masonry',
    materialCode: 'MS-SOLID',
    materialName: 'Solid Concrete Blocks (6" Ext / 4" Int)',
    catalogUnit: 'Sq.Ft',
    brands: ['porotherm', 'wienerberger', 'siporex', 'aerocon'],
    keywords: ['solid blocks', 'concrete blocks', 'aac blocks', 'red bricks', 'wire-cut bricks', 'porotherm blocks'],
    itemTypeHints: {
      direct: ['supply of blocks', 'supply of bricks', 'procurement of blocks'],
      compound: ['masonry work', 'brickwork', 'blockwork', 'brick masonry', 'block masonry']
    }
  },
  // FLOORING / TILES
  {
    category: 'flooring',
    materialCode: 'FL-VITRIFIED-STD',
    materialName: 'Vitrified Tiles (2x2 ft) - Kajaria / Johnson',
    catalogUnit: 'Sq.Ft',
    brands: ['kajaria', 'johnson', 'somany', 'simpolo', 'nitco', 'orientbell'],
    keywords: ['vitrified tiles', 'ceramic tiles', 'gvt tiles', 'granite slab', 'marble slab', 'flooring tiles'],
    itemTypeHints: {
      direct: ['supply of tiles', 'supply of vitrified tiles', 'supply of granite', 'tile supply'],
      compound: ['tile fixing', 'flooring work', 'laying tiles', 'dado work', 'skirting']
    }
  },
  // ELECTRICAL - CABLES & SWITCHES
  {
    category: 'electrical',
    materialCode: 'EL-POLYCAB',
    materialName: 'Polycab FRLS Wires + Legrand Mylinc Switches',
    catalogUnit: 'Sq.Ft',
    brands: ['polycab', 'finolex', 'havells', 'anchor', 'legrand', 'schneider', 'goldmedal'],
    keywords: ['frls wire', 'frls cable', 'copper wire', 'modular switch', 'pvc conduit', 'distribution board'],
    itemTypeHints: {
      direct: ['supply of wire', 'supply of cable', 'supply of switches', 'supply of conduit'],
      compound: ['wiring point', 'point wiring', 'conduit fixing', 'circuit wiring', 'light point']
    }
  },
  // PLUMBING - PIPES & FITTINGS
  {
    category: 'plumbing',
    materialCode: 'BT-JAQUAR',
    materialName: 'Vitrified Dado to 7ft + Jaquar Continental & Diverters',
    catalogUnit: 'Nos',
    brands: ['astral', 'supreme', 'ashirvad', 'prince', 'jaquar', 'cera', 'parryware', 'kohler'],
    keywords: ['cpvc pipe', 'upvc pipe', 'pvc pipe', 'diverter', 'faucet', 'bib tap', 'angle valve', 'ewc', 'wash basin'],
    itemTypeHints: {
      direct: ['supply of pipes', 'supply of cpvc', 'supply of fittings', 'supply of valves'],
      compound: ['plumbing installation', 'fixing of pipes', 'sanitary installation', 'internal plumbing']
    }
  }
];

/**
 * Checks if BOQ row unit is compatible with the material catalog unit
 */
function isUnitCompatible(boqUnit, catalogUnit) {
  if (!boqUnit || !catalogUnit) return false;
  const b = boqUnit.toLowerCase().replace(/[\.\s_-]/g, '');
  const c = catalogUnit.toLowerCase().replace(/[\.\s_-]/g, '');

  if (b === c) return true;
  if ((b === 'bag' || b === 'bags') && c === 'bag') return true;
  if ((b === 'tonne' || b === 'tonnes' || b === 'ton' || b === 'mt') && c === 'tonne') return true;
  if ((b === 'sqft' || b === 'sft') && c === 'sqft') return true;
  if ((b === 'cuft' || b === 'cft') && c === 'cuft') return true;
  if ((b === 'nos' || b === 'each') && (c === 'nos' || c === 'each')) return true;
  
  return false;
}

/**
 * Classifies a single BOQ item row
 */
function classifyRow(row) {
  const textToScan = `${row.description || ''} ${row.specification || ''} ${row.make || ''}`.toLowerCase();

  let bestMatch = null;
  let highestScore = 0;
  let detectedItemType = 'UNKNOWN';

  for (const rule of MATERIAL_CATALOG_RULES) {
    let score = 0;

    // Check brand matches (high weight)
    const matchedBrand = rule.brands.find(b => textToScan.includes(b));
    if (matchedBrand) score += 0.40;

    // Check keywords (medium weight)
    const matchedKeyword = rule.keywords.find(k => textToScan.includes(k));
    if (matchedKeyword) score += 0.45;

    // Check category relevance
    if (textToScan.includes(rule.category)) score += 0.15;

    if (score > highestScore) {
      highestScore = score;
      bestMatch = rule;

      // Determine itemType: DIRECT_MATERIAL vs COMPOUND_WORK
      const isDirectHint = rule.itemTypeHints.direct.some(d => textToScan.includes(d));
      const isCompoundHint = rule.itemTypeHints.compound.some(c => textToScan.includes(c));

      if (isDirectHint && !isCompoundHint) {
        detectedItemType = 'DIRECT_MATERIAL';
      } else if (isCompoundHint) {
        detectedItemType = 'COMPOUND_WORK';
      } else {
        // Fallback heuristic based on unit and action words
        if (['providing and constructing', 'fixing', 'laying', 'plastering', 'painting', 'demolition'].some(w => textToScan.includes(w))) {
          detectedItemType = 'COMPOUND_WORK';
        } else if (['supply', 'procurement', 'material only'].some(w => textToScan.includes(w))) {
          detectedItemType = 'DIRECT_MATERIAL';
        } else {
          detectedItemType = 'COMPOUND_WORK'; // Default to safe compound assumption
        }
      }
    }
  }

  // Determine classification status
  let classificationStatus = 'UNMATCHED';
  if (highestScore >= 0.75) {
    classificationStatus = 'MATCHED';
  } else if (highestScore >= 0.40) {
    classificationStatus = 'NEEDS_REVIEW';
  }

  // Determine compatibility status
  let compatibilityStatus = 'INCOMPATIBLE';
  if (bestMatch && classificationStatus === 'MATCHED') {
    const unitMatch = isUnitCompatible(row.unit, bestMatch.catalogUnit);
    if (detectedItemType === 'DIRECT_MATERIAL' && unitMatch) {
      compatibilityStatus = 'COMPATIBLE';
    } else {
      // Compound work items (e.g. RCC lintel in R.ft) or mismatched units are strictly REFERENCE_ONLY
      compatibilityStatus = 'REFERENCE_ONLY';
    }
  } else if (bestMatch && classificationStatus === 'NEEDS_REVIEW') {
    compatibilityStatus = 'REFERENCE_ONLY';
  }

  return {
    materialCode: bestMatch ? bestMatch.materialCode : null,
    materialName: bestMatch ? bestMatch.materialName : '',
    materialCategory: bestMatch ? bestMatch.category : '',
    materialMatchConfidence: Math.min(1.0, Math.round(highestScore * 100) / 100),
    classificationStatus,
    itemType: detectedItemType,
    compatibilityStatus
  };
}

/**
 * Classifies all rows in all sheets of a parsed BOQ
 */
function classifyBOQ(parsedBoq) {
  let matchedCount = 0;
  let needsReviewCount = 0;

  for (const sheet of parsedBoq.sheets) {
    if (sheet.isSummarySheet) continue;

    for (const section of sheet.sections) {
      for (const row of section.rows) {
        const result = classifyRow(row);
        row.materialCode = result.materialCode;
        row.materialName = result.materialName;
        row.materialCategory = result.materialCategory;
        row.materialMatchConfidence = result.materialMatchConfidence;
        row.classificationStatus = result.classificationStatus;
        row.itemType = result.itemType;
        row.compatibilityStatus = result.compatibilityStatus;

        if (result.classificationStatus === 'MATCHED') matchedCount++;
        else if (result.classificationStatus === 'NEEDS_REVIEW') needsReviewCount++;
      }
    }
  }

  if (parsedBoq.stats) {
    parsedBoq.stats.matchedRows = matchedCount;
    parsedBoq.stats.needsReviewRows = needsReviewCount;
  }

  return parsedBoq;
}

module.exports = {
  classifyRow,
  classifyBOQ,
  isUnitCompatible,
  MATERIAL_CATALOG_RULES
};
