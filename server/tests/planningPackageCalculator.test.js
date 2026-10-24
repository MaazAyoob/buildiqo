const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('Planning Modules Package-Based Calculation Regression Suite', async (t) => {
  const { calculatePackageEstimate, calculateEstimation } = await import('../../src/utils/calculator.js');
  const { TIER_BENCHMARKS, MATERIAL_CATEGORIES } = await import('../../src/data/materials.js');

  // 1. Plot area is not mistakenly used as SBA
  await t.test('1. Plot area is not mistakenly used as SBA', () => {
    // Large plot: 5,082 sq.ft (e.g. 70 x 72.6 ft), but built-up area is 2,400 sq.ft
    const state = {
      plotWidth: 70,
      plotLength: 72.6,
      targetBuaInput: 2400,
      tier: 'standard',
      city: 'Bengaluru',
      state: 'Karnataka',
      floors: [
        {
          id: 'gf',
          floorNumber: 0,
          builtupArea: 1200,
          rooms: [{ type: 'living', area: 500, count: 1 }]
        },
        {
          id: 'ff',
          floorNumber: 1,
          builtupArea: 1200,
          rooms: [{ type: 'master_bed', area: 500, count: 1 }]
        }
      ]
    };

    const estimation = calculateEstimation(state);
    
    // Plot area is 5,082 sq.ft
    assert.strictEqual(estimation.plotArea, 5082, 'Plot area is 5,082 sq.ft');
    // But SBA must be strictly 2,400 sq.ft
    assert.strictEqual(estimation.totalBuiltupArea, 2400, 'Total built-up area is 2,400 sq.ft, not plot area');
    // Pre-GST calculation must use SBA (2,400), NOT plot area (5,082)
    assert.strictEqual(estimation.estimatedCost, 2400 * 2250, 'Estimated cost is 2,400 * 2,250 = ₹54,00,000');
    assert.notStrictEqual(estimation.estimatedCost, 5082 * 2250, 'Estimated cost must never be computed on plot area');
  });

  // 2. SBA x package rate produces the correct pre-GST total
  await t.test('2. SBA × package rate produces the correct pre-GST total (Client example: 5,082 sq.ft × ₹2,000 = ₹1,01,64,000)', () => {
    const estimate = calculatePackageEstimate({
      totalBuiltupArea: 5082,
      customPackageRate: 2000,
      gstRate: 18
    });

    assert.strictEqual(estimate.totalBuiltupArea, 5082);
    assert.strictEqual(estimate.ratePerSqFt, 2000);
    assert.strictEqual(estimate.estimatedCost, 10164000, '5,082 sq.ft × ₹2,000/sq.ft = ₹1,01,64,000 before GST');
    assert.strictEqual(estimate.gstRate, 18);
    assert.strictEqual(estimate.gstAmount, 1829520, '18% GST on ₹1,01,64,000 is ₹18,29,520');
    assert.strictEqual(estimate.grandTotal, 11993520, 'Grand total with GST is ₹1,19,93,520');
    assert.strictEqual(estimate.formula, '5,082 sq.ft × ₹2,000/sq.ft = ₹1,01,64,000');
  });

  // 3. Multiple floors are handled correctly
  await t.test('3. Multiple floors are handled correctly', () => {
    const floors = [
      { id: 'gf', name: 'Ground Floor', builtupArea: 1500 },
      { id: 'ff', name: 'First Floor', builtupArea: 1500 }
    ];

    const estimate = calculatePackageEstimate({
      totalBuiltupArea: 3000,
      packageKey: 'standard',
      gstRate: 18,
      floors,
      numFloors: 2
    });

    assert.strictEqual(estimate.totalBuiltupArea, 3000);
    assert.strictEqual(estimate.ratePerSqFt, 2250);
    assert.strictEqual(estimate.estimatedCost, 6750000, '3,000 sq.ft × ₹2,250 = ₹67,50,000');
    assert.strictEqual(estimate.floors.length, 2);
    assert.strictEqual(estimate.floors[0].floorCost, 3375000, 'Ground floor: 1,500 × 2,250 = ₹33,75,000');
    assert.strictEqual(estimate.floors[1].floorCost, 3375000, 'First floor: 1,500 × 2,250 = ₹33,75,000');
    assert.strictEqual(estimate.floors[0].floorCost + estimate.floors[1].floorCost, estimate.estimatedCost);
  });

  // 4. Changing the construction tier changes the rate when configured rates differ
  await t.test('4. Changing the construction tier changes the rate when configured rates differ', () => {
    const sba = 2000;

    const stdEstimate = calculatePackageEstimate({ totalBuiltupArea: sba, packageKey: 'standard' });
    const prmEstimate = calculatePackageEstimate({ totalBuiltupArea: sba, packageKey: 'premium' });
    const luxEstimate = calculatePackageEstimate({ totalBuiltupArea: sba, packageKey: 'luxury' });

    assert.strictEqual(stdEstimate.ratePerSqFt, 2250, 'Standard package rate is ₹2,250/sq.ft');
    assert.strictEqual(stdEstimate.estimatedCost, 4500000, 'Standard pre-GST: ₹45,00,000');

    assert.strictEqual(prmEstimate.ratePerSqFt, 2850, 'Premium package rate is ₹2,850/sq.ft');
    assert.strictEqual(prmEstimate.estimatedCost, 5700000, 'Premium pre-GST: ₹57,00,000');

    assert.strictEqual(luxEstimate.ratePerSqFt, 3800, 'Luxury package rate is ₹3,800/sq.ft');
    assert.strictEqual(luxEstimate.estimatedCost, 7600000, 'Luxury pre-GST: ₹76,00,000');

    assert.ok(prmEstimate.ratePerSqFt > stdEstimate.ratePerSqFt);
    assert.ok(luxEstimate.ratePerSqFt > prmEstimate.ratePerSqFt);
  });

  // 5. Changing material specifications updates the rate according to actual configured pricing rules
  await t.test('5. Changing material specifications updates the rate according to actual configured pricing rules without double charging', () => {
    const sba = 2000;
    const flooringCat = MATERIAL_CATEGORIES.find(c => c.id === 'flooring');
    const stdFlooring = flooringCat.options.find(o => o.tier === 'standard'); // fl-vitrified-gvt (145)
    const luxFlooring = flooringCat.options.find(o => o.tier === 'luxury'); // fl-marble (480)

    // Base Standard package (no custom selections)
    const baseEstimate = calculatePackageEstimate({
      totalBuiltupArea: sba,
      packageKey: 'standard',
      selectedMaterials: {
        flooring: { ...stdFlooring, unitRate: 145, rateSource: 'database_approved' }
      }
    });
    assert.strictEqual(baseEstimate.ratePerSqFt, 2250, 'Base rate is 2,250 when materials match tier');
    assert.strictEqual(baseEstimate.materialDeltaPerSqFt, 0, 'No delta when materials match tier');

    // Customized flooring: upgrade to luxury Italian marble (480 vs 145 = +335/sq.ft)
    const carpetArea = Math.round(sba / 1.18);
    const flooringQty = carpetArea * 1.07;
    const expectedCostDelta = (480 - 145) * flooringQty;
    const expectedDeltaPerSqFt = Math.round(expectedCostDelta / sba);

    const upgradedEstimate = calculatePackageEstimate({
      totalBuiltupArea: sba,
      packageKey: 'standard',
      selectedMaterials: {
        flooring: { ...luxFlooring, unitRate: 480, rateSource: 'database_approved' }
      }
    });

    assert.strictEqual(upgradedEstimate.materialDeltaPerSqFt, expectedDeltaPerSqFt, 'Material delta matches quantity differential');
    assert.strictEqual(upgradedEstimate.ratePerSqFt, 2250 + expectedDeltaPerSqFt, 'Rate is base + delta');
    assert.strictEqual(upgradedEstimate.estimatedCost, sba * (2250 + expectedDeltaPerSqFt));
    assert.ok(upgradedEstimate.materialDeltas.length === 1);
    assert.strictEqual(upgradedEstimate.materialDeltas[0].categoryId, 'flooring');
  });

  // 6. Unavailable package pricing is handled honestly
  await t.test('6. Unavailable package pricing is handled honestly', () => {
    const sba = 2000;
    const estimate = calculatePackageEstimate({
      totalBuiltupArea: sba,
      packageKey: 'standard',
      pricingStatus: 'UNAVAILABLE',
      selectedMaterials: {
        steel: { id: 'st-jsw', name: 'JSW Steel', unitRate: 0, rateSource: 'UNAVAILABLE' }
      }
    });

    assert.strictEqual(estimate.isPricingUnavailable, true, 'isPricingUnavailable flag is true');
    assert.strictEqual(estimate.pricingStatus, 'UNAVAILABLE', 'pricingStatus reflects UNAVAILABLE');
  });

  // 7. GST is applied exactly once when applicable
  await t.test('7. GST is applied exactly once when applicable', () => {
    const estimate = calculatePackageEstimate({
      totalBuiltupArea: 4000,
      customPackageRate: 2500,
      gstRate: 18
    });

    const preGst = 4000 * 2500; // 10,000,000
    const gstAmt = preGst * 0.18; // 1,800,000
    const grandTotal = preGst + gstAmt; // 11,800,000

    assert.strictEqual(estimate.estimatedCost, preGst);
    assert.strictEqual(estimate.gstAmount, gstAmt);
    assert.strictEqual(estimate.grandTotal, grandTotal);
    assert.strictEqual(estimate.grandTotal - estimate.estimatedCost, estimate.gstAmount, 'GST is applied exactly once');
  });

  // 8. The sticky summary and Step Report display the same calculation result
  await t.test('8. The sticky summary and Step Report display the same calculation result', () => {
    const state = {
      city: 'Bengaluru',
      state: 'Karnataka',
      tier: 'premium',
      targetBuaInput: 3200,
      floors: [{ id: 'f1', builtupArea: 3200, rooms: [] }]
    };

    const estimation = calculateEstimation(state, { isBenchmark: true });

    // Sticky Summary reads:
    const stickyPreGst = estimation.estimatedCost;
    const stickyRate = estimation.costPerSqFt;
    const stickyGrandTotal = estimation.grandTotalCost;
    const stickyBua = estimation.totalBuiltupArea;

    // Step Report reads:
    const reportPreGst = estimation.baseGrandTotalCost;
    const reportRate = estimation.costPerSqFt;
    const reportGrandTotal = estimation.grandTotalCost;
    const reportBua = estimation.totalBuiltupArea;

    assert.strictEqual(stickyPreGst, reportPreGst, 'Pre-GST totals match');
    assert.strictEqual(stickyRate, reportRate, 'Rate per sq.ft matches');
    assert.strictEqual(stickyGrandTotal, reportGrandTotal, 'Grand totals match');
    assert.strictEqual(stickyBua, reportBua, 'BUA values match');
    assert.strictEqual(stickyPreGst, 3200 * 2850, 'Matches 3,200 sq.ft × ₹2,850/sq.ft = ₹91,20,000');
  });

  // 9. Saving and reopening an estimate preserves the same inputs and total
  await t.test('9. Saving and reopening an estimate preserves the same inputs and total', () => {
    const originalState = {
      id: 'proj_save_test_1',
      projectName: 'Test Villa',
      city: 'Bengaluru',
      state: 'Karnataka',
      tier: 'standard',
      targetBuaInput: 2500,
      customPackageRate: 2100,
      numFloors: 2
    };

    const originalEstimation = calculateEstimation(originalState, { isBenchmark: true });
    
    // Simulate saved summary payload created by saveCurrentProject
    const savedRecord = {
      id: originalState.id,
      name: originalState.projectName,
      state: originalState.state,
      city: originalState.city,
      tier: originalState.tier,
      totalCost: originalEstimation.grandTotalCost,
      totalBua: originalEstimation.totalBuiltupArea,
      ratePerSqFt: originalEstimation.costPerSqFt,
      numFloors: originalState.numFloors,
      stateSnapshot: JSON.parse(JSON.stringify(originalState))
    };

    // Simulate reopening project from saved stateSnapshot
    const reloadedState = JSON.parse(JSON.stringify(savedRecord.stateSnapshot));
    const reloadedEstimation = calculateEstimation(reloadedState, { isBenchmark: true });

    assert.strictEqual(reloadedEstimation.totalBuiltupArea, originalEstimation.totalBuiltupArea);
    assert.strictEqual(reloadedEstimation.costPerSqFt, originalEstimation.costPerSqFt);
    assert.strictEqual(reloadedEstimation.estimatedCost, originalEstimation.estimatedCost);
    assert.strictEqual(reloadedEstimation.grandTotalCost, originalEstimation.grandTotalCost);
    assert.strictEqual(savedRecord.totalCost, reloadedEstimation.grandTotalCost);
    assert.strictEqual(savedRecord.ratePerSqFt, reloadedEstimation.costPerSqFt);
  });

  // 10. Editing inputs repeatedly does not leave stale or inconsistent totals
  await t.test('10. Editing inputs repeatedly does not leave stale or inconsistent totals', () => {
    let state = {
      city: 'Bengaluru',
      state: 'Karnataka',
      tier: 'standard',
      targetBuaInput: 1000
    };

    // 1. Initial 1,000 sq.ft Standard: 1,000 * 2,250 = 2,250,000
    let est = calculateEstimation(state, { isBenchmark: true });
    assert.strictEqual(est.estimatedCost, 2250000);
    assert.strictEqual(est.costPerSqFt, 2250);

    // 2. Change BUA to 2,000 sq.ft: 2,000 * 2,250 = 4,500,000
    state = { ...state, targetBuaInput: 2000 };
    est = calculateEstimation(state, { isBenchmark: true });
    assert.strictEqual(est.estimatedCost, 4500000);
    assert.strictEqual(est.costPerSqFt, 2250);

    // 3. Change tier to Premium: 2,000 * 2,850 = 5,700,000
    state = { ...state, tier: 'premium' };
    est = calculateEstimation(state, { isBenchmark: true });
    assert.strictEqual(est.estimatedCost, 5700000);
    assert.strictEqual(est.costPerSqFt, 2850);

    // 4. Change tier to Luxury: 2,000 * 3,800 = 7,600,000
    state = { ...state, tier: 'luxury' };
    est = calculateEstimation(state, { isBenchmark: true });
    assert.strictEqual(est.estimatedCost, 7600000);
    assert.strictEqual(est.costPerSqFt, 3800);

    // 5. Override with custom negotiated rate ₹2,000: 2,000 * 2,000 = 4,000,000
    state = { ...state, customPackageRate: 2000 };
    est = calculateEstimation(state, { isBenchmark: true });
    assert.strictEqual(est.estimatedCost, 4000000);
    assert.strictEqual(est.costPerSqFt, 2000);

    // 6. Reset custom rate: reverts to Luxury (3,800)
    state = { ...state, customPackageRate: null };
    est = calculateEstimation(state, { isBenchmark: true });
    assert.strictEqual(est.estimatedCost, 7600000);
    assert.strictEqual(est.costPerSqFt, 3800);
  });

  // 11. Commercial BOQ calculations remain unaffected
  await t.test('11. Commercial BOQ calculations remain unaffected', () => {
    // Mode A in commercialBoq.test.js Req 5 call pattern
    const estimate = calculatePackageEstimate({
      totalBuiltupArea: 3000,
      customPackageRate: 2000,
      gstRate: 18,
      floors: [
        { id: 'gf', name: 'Ground Floor', area: 1500, cost: 3000000 },
        { id: 'ff', name: 'First Floor', area: 1500, cost: 3000000 }
      ],
      numFloors: 2
    });

    assert.strictEqual(estimate.totalBuiltupArea, 3000);
    assert.strictEqual(estimate.ratePerSqFt, 2000);
    assert.strictEqual(estimate.estimatedCost, 6000000, '3,000 sq.ft × ₹2,000 = ₹60,00,000');
    assert.strictEqual(estimate.gstRate, 18);
    assert.strictEqual(estimate.gstAmount, 1080000, '18% GST on ₹60,00,000 is ₹10,80,000');
    assert.strictEqual(estimate.grandTotal, 7080000, 'Grand total is ₹70,80,000');
  });

  // 12. Existing construction formulas and pricing tests continue to pass
  await t.test('12. Existing construction formulas and quantity equations remain intact', () => {
    const sba = 2000;
    const state = {
      city: 'Bengaluru',
      state: 'Karnataka',
      tier: 'standard',
      targetBuaInput: sba,
      floors: [{ id: 'f0', builtupArea: sba, rooms: [] }]
    };

    const est = calculateEstimation(state, { isBenchmark: true });

    // IS 456 Structural Material Quantities Equations
    const expectedSteelTonne = Number(((sba * 3.85 * 1.05) / 1000).toFixed(2));
    const expectedCementBags = Math.round(sba * 0.42);
    const expectedSandCuFt = Math.round(sba * 1.9);
    const expectedAggregateCuFt = Math.round(sba * 1.35);

    assert.strictEqual(Number(est.boqItems[0].items.find(i => i.id === 'item-steel').qty.toFixed(2)), expectedSteelTonne);
    assert.strictEqual(est.boqItems[0].items.find(i => i.id === 'item-cement').qty, expectedCementBags);
    assert.strictEqual(est.boqItems[0].items.find(i => i.id === 'item-sand').qty, expectedSandCuFt + expectedAggregateCuFt);
    assert.ok(est.materialSummary.length >= 10);
  });

  // 13. Phase 1 Client Financial Reference Cases (1,800 sq.ft across Standard, Premium, Luxury)
  await t.test('13. Phase 1 Client Financial Reference Cases (1,800 sq.ft across tiers)', () => {
    const sba = 1800;

    // Standard: 1,800 sq.ft @ ₹2,250 = Base ₹40,50,000 | GST ₹7,29,000 | Total ₹47,79,000
    const std = calculatePackageEstimate({ totalBuiltupArea: sba, packageKey: 'standard', gstRate: 18 });
    assert.strictEqual(std.ratePerSqFt, 2250, 'Standard package rate is ₹2,250/sq.ft');
    assert.strictEqual(std.estimatedCost, 4050000, 'Standard base cost = 1,800 × ₹2,250 = ₹40,50,000');
    assert.strictEqual(std.gstAmount, 729000, 'Standard 18% GST = ₹7,29,000');
    assert.strictEqual(std.grandTotal, 4779000, 'Standard grand total = ₹47,79,000');

    // Premium: 1,800 sq.ft @ ₹2,850 = Base ₹51,30,000 | GST ₹9,23,400 | Total ₹60,53,400
    const prm = calculatePackageEstimate({ totalBuiltupArea: sba, packageKey: 'premium', gstRate: 18 });
    assert.strictEqual(prm.ratePerSqFt, 2850, 'Premium package rate is ₹2,850/sq.ft');
    assert.strictEqual(prm.estimatedCost, 5130000, 'Premium base cost = 1,800 × ₹2,850 = ₹51,30,000');
    assert.strictEqual(prm.gstAmount, 923400, 'Premium 18% GST = ₹9,23,400');
    assert.strictEqual(prm.grandTotal, 6053400, 'Premium grand total = ₹60,53,400');

    // Luxury: 1,800 sq.ft @ ₹3,800 = Base ₹68,40,000 | GST ₹12,31,200 | Total ₹80,71,200
    const lux = calculatePackageEstimate({ totalBuiltupArea: sba, packageKey: 'luxury', gstRate: 18 });
    assert.strictEqual(lux.ratePerSqFt, 3800, 'Luxury package rate is ₹3,800/sq.ft');
    assert.strictEqual(lux.estimatedCost, 6840000, 'Luxury base cost = 1,800 × ₹3,800 = ₹68,40,000');
    assert.strictEqual(lux.gstAmount, 1231200, 'Luxury 18% GST = ₹12,31,200');
    assert.strictEqual(lux.grandTotal, 8071200, 'Luxury grand total = ₹80,71,200');
  });

  // 14. Client Area Definition Example (55 × 55 ft plot = 3,025 sq.ft plot, 3,025 sq.ft SBA, 2,117.5 sq.ft carpet area)
  await t.test('14. Client Area Definition Example (55 × 55 ft plot: SBA = 3,025 sq.ft, Carpet = 2,117.5 sq.ft, with manual override option)', () => {
    // 14a: Automatic plot-derived SBA: 55 × 55 ft yields SBA = 3,025 sq.ft, Carpet = 2,117.5 sq.ft
    const stateAuto = {
      plotWidth: 55,
      plotLength: 55,
      tier: 'standard',
      city: 'Bengaluru',
      state: 'Karnataka'
    };

    const estAuto = calculateEstimation(stateAuto, { isBenchmark: true });
    assert.strictEqual(estAuto.plotArea, 3025, 'Gross plot area = 55 × 55 = 3,025 sq.ft');
    assert.strictEqual(estAuto.totalBuiltupArea, 3025, 'Total built-up area (SBA) = 3,025 sq.ft (matching 55 × 55 ft)');
    assert.strictEqual(estAuto.plotCarpetArea, 2117.5, 'Carpet area at 70% of SBA = 2,117.5 sq.ft');
    assert.strictEqual(estAuto.carpetAreaPercentage, 70, 'Default carpet area percentage benchmark is 70%');
    assert.strictEqual(estAuto.estimatedCost, 3025 * 2250, 'Standard package base cost = 3,025 × ₹2,250 = ₹68,06,250');

    // 14b: Manual SBA Override to 1,800 sq.ft
    const stateOverride = {
      plotWidth: 55,
      plotLength: 55,
      useTargetBua: true,
      targetBuaInput: 1800,
      tier: 'standard',
      city: 'Bengaluru',
      state: 'Karnataka'
    };

    const estOverride = calculateEstimation(stateOverride, { isBenchmark: true });
    assert.strictEqual(estOverride.plotArea, 3025, 'Gross plot area remains 3,025 sq.ft');
    assert.strictEqual(estOverride.totalBuiltupArea, 1800, 'Total built-up area is overridden to 1,800 sq.ft');
    assert.strictEqual(estOverride.estimatedCost, 1800 * 2250, 'Cost calculated using manual SBA: 1,800 × 2,250 = ₹40,50,000');
  });

  // 15. Dedicated Planner Report PDF Exporter generates valid A4 document buffer
  await t.test('15. Dedicated Planner Report PDF Exporter generates valid A4 document buffer', async () => {
    const { generatePlannerPDF } = require('../services/plannerReportExporter');

    const sampleState = {
      projectName: 'Green Villa Estate',
      customerName: 'Maaz Ayoob',
      plotWidth: 55,
      plotLength: 55,
      tier: 'standard',
      numFloors: 2,
      floors: [
        { id: 'f1', name: 'Ground Floor', builtupArea: 900, carpetArea: 630, roomCount: 4 },
        { id: 'f2', name: 'First Floor', builtupArea: 900, carpetArea: 630, roomCount: 4 }
      ]
    };

    const sampleEstimation = {
      plotArea: 3025,
      plotCarpetArea: 2117.5,
      totalBuiltupArea: 1800,
      gstRate: 18,
      packageEstimate: {
        ratePerSqFt: 2250,
        estimatedCost: 4050000,
        gstAmount: 729000,
        grandTotal: 4779000
      }
    };

    const pdfBuffer = await generatePlannerPDF(sampleState, sampleEstimation);
    assert.ok(Buffer.isBuffer(pdfBuffer), 'Returns a valid Node.js Buffer');
    assert.ok(pdfBuffer.length > 5000, `PDF buffer contains substantial content (${pdfBuffer.length} bytes)`);
    assert.strictEqual(pdfBuffer.subarray(0, 4).toString(), '%PDF', 'PDF buffer starts with %PDF magic header');
    try {
      fs.writeFileSync(path.join(__dirname, '../../scratch/sample_planner_report.pdf'), pdfBuffer);
    } catch (e) {}
  });

  // 16. Commercial BOQ PDF Exporter generates valid PDF buffers for Mode A and Mode B
  await t.test('16. Commercial BOQ PDF Exporter generates valid buffers for Mode A and Mode B (landscape)', async () => {
    const { exportToPDF } = require('../services/commercialBoqExporter');

    // Mode A: Package Estimate
    const modeABoq = {
      mode: 'PACKAGE',
      title: 'Commercial Business Hub',
      customerName: 'Enterprise Client',
      pricingState: 'Karnataka',
      packageEstimate: {
        totalBuiltupArea: 1800,
        ratePerSqFt: 2250,
        estimatedCost: 4050000,
        gstRate: 18,
        gstAmount: 729000,
        grandTotal: 4779000,
        numFloors: 2,
        floors: [
          { name: 'Ground Floor', builtupArea: 900, carpetArea: 630, roomCount: 3 },
          { name: 'First Floor', builtupArea: 900, carpetArea: 630, roomCount: 3 }
        ]
      }
    };
    const modeAPdf = await exportToPDF(modeABoq);
    assert.ok(Buffer.isBuffer(modeAPdf));
    assert.strictEqual(modeAPdf.subarray(0, 4).toString(), '%PDF');

    // Mode B: Detailed Multi-section BOQ (Landscape layout)
    const modeBBoq = {
      mode: 'DETAILED',
      title: 'TWC Kasthuri Nagar Detailed Schedule',
      customerName: 'Bangalore Commercial Client',
      pricingState: 'Karnataka',
      totals: {
        subtotal: 1000000,
        gstRate: 18,
        gstAmount: 180000,
        grandTotal: 1180000
      },
      sheets: [
        {
          name: 'Civil Works',
          sections: [
            {
              name: 'Substructure & RCC',
              subtotal: 600000,
              rows: [
                {
                  itemNo: '1.1',
                  description: 'Earthwork excavation in foundation trenches including dressing and disposal',
                  specification: 'Up to 2.5m depth in hard gravelly soil as per IS 1200',
                  unit: 'Cum',
                  quantity: 120,
                  currentRate: 350,
                  amount: 42000
                },
                {
                  itemNo: '1.2',
                  description: 'Providing and laying reinforced cement concrete M25 grade in footings and columns',
                  specification: 'Machine batch mixed and vibrated as per IS 456',
                  unit: 'Cum',
                  quantity: 50,
                  currentRate: 7200,
                  amount: 360000
                }
              ]
            }
          ]
        }
      ]
    };
    const modeBPdf = await exportToPDF(modeBBoq);
    assert.ok(Buffer.isBuffer(modeBPdf));
    assert.strictEqual(modeBPdf.subarray(0, 4).toString(), '%PDF');
    assert.ok(modeBPdf.length > 1000, `Mode B PDF buffer length: ${modeBPdf.length} bytes`);
    try {
      fs.writeFileSync(path.join(__dirname, '../../scratch/sample_commercial_boq.pdf'), modeBPdf);
    } catch (e) {}
  });

  // 17. Bangalore Client Feedback: Floor Count, Built-Up Area & Live Pricing Regression Suite (Cases A - N)
  await t.test('17. Bangalore Client Feedback: Floor Count, Built-Up Area & Live Pricing Suite (Cases A - N)', async (st) => {
    const { generatePlannerPDF } = require('../services/plannerReportExporter');
    const { exportToExcel } = require('../services/commercialBoqExporter');

    // Case A: 55 × 55 ft plot, G+0 (1 floor)
    await st.test('Case A: 55 × 55 ft plot, G+0 (1 floor)', () => {
      const state = {
        plotWidth: 55,
        plotLength: 55,
        numFloors: 1,
        tier: 'standard',
        city: 'Bengaluru',
        state: 'Karnataka'
      };
      const est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.plotArea, 3025, 'Gross plot area = 55 × 55 = 3,025 sq.ft');
      assert.strictEqual(est.groundFloorBua, 3025, 'Ground floor footprint = 3,025 sq.ft');
      assert.strictEqual(est.totalBuiltupArea, 3025, 'Total SBA for G+0 = 1 × 3,025 = 3,025 sq.ft');
      assert.strictEqual(est.plotCarpetArea, 2117.5, 'Carpet area (70% benchmark) = 2,117.5 sq.ft');
      assert.strictEqual(est.costPerSqFt, 2250, 'Standard package rate = ₹2,250/sq.ft');
      assert.strictEqual(est.estimatedCost, 6806250, 'Pre-GST cost = 3,025 × ₹2,250 = ₹68,06,250');
      assert.strictEqual(est.gst, 1225125, '18% GST = ₹12,25,125');
      assert.strictEqual(est.grandTotalCost, 8031375, 'Grand total = ₹80,31,375');
      assert.strictEqual(est.floors.length, 1);
      assert.strictEqual(est.floors[0].builtupArea, 3025);
    });

    // Case B: Same plot, G+1 (2 floors)
    await st.test('Case B: 55 × 55 ft plot, G+1 (2 floors)', () => {
      const state = {
        plotWidth: 55,
        plotLength: 55,
        numFloors: 2,
        tier: 'standard',
        city: 'Bengaluru',
        state: 'Karnataka'
      };
      const est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.plotArea, 3025, 'Gross plot area = 3,025 sq.ft');
      assert.strictEqual(est.groundFloorBua, 3025, 'Ground floor footprint = 3,025 sq.ft');
      assert.strictEqual(est.totalBuiltupArea, 6050, 'Total SBA for G+1 = 2 × 3,025 = 6,050 sq.ft');
      assert.strictEqual(est.plotCarpetArea, 4235.0, 'Carpet area (70% benchmark) = 6,050 × 0.7 = 4,235.0 sq.ft');
      assert.strictEqual(est.costPerSqFt, 2250, 'Standard package rate = ₹2,250/sq.ft');
      assert.strictEqual(est.estimatedCost, 13612500, 'Pre-GST cost = 6,050 × ₹2,250 = ₹1,36,12,500');
      assert.strictEqual(est.gst, 2450250, '18% GST = ₹24,50,250');
      assert.strictEqual(est.grandTotalCost, 16062750, 'Grand total = ₹1,60,62,750');
      assert.strictEqual(est.floors.length, 2);
      assert.strictEqual(est.floors[0].builtupArea, 3025);
      assert.strictEqual(est.floors[1].builtupArea, 3025);
      assert.strictEqual(est.floors[0].floorCost + est.floors[1].floorCost, est.estimatedCost);
    });

    // Case C: Same plot, G+2 (3 floors)
    await st.test('Case C: 55 × 55 ft plot, G+2 (3 floors)', () => {
      const state = {
        plotWidth: 55,
        plotLength: 55,
        numFloors: 3,
        tier: 'standard',
        city: 'Bengaluru',
        state: 'Karnataka'
      };
      const est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.plotArea, 3025);
      assert.strictEqual(est.totalBuiltupArea, 9075, 'Total SBA for G+2 = 3 × 3,025 = 9,075 sq.ft');
      assert.strictEqual(est.plotCarpetArea, 6352.5, 'Carpet area = 9,075 × 0.7 = 6,352.5 sq.ft');
      assert.strictEqual(est.estimatedCost, 20418750, 'Pre-GST cost = 9,075 × ₹2,250 = ₹2,04,18,750');
      assert.strictEqual(est.gst, 3675375, '18% GST = ₹36,75,375');
      assert.strictEqual(est.grandTotalCost, 24094125, 'Grand total = ₹2,40,94,125');
      assert.strictEqual(est.floors.length, 3);
    });

    // Case D: Same plot, G+3 (4 floors)
    await st.test('Case D: 55 × 55 ft plot, G+3 (4 floors)', () => {
      const state = {
        plotWidth: 55,
        plotLength: 55,
        numFloors: 4,
        tier: 'standard',
        city: 'Bengaluru',
        state: 'Karnataka'
      };
      const est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.plotArea, 3025);
      assert.strictEqual(est.totalBuiltupArea, 12100, 'Total SBA for G+3 = 4 × 3,025 = 12,100 sq.ft');
      assert.strictEqual(est.plotCarpetArea, 8470.0, 'Carpet area = 12,100 × 0.7 = 8,470.0 sq.ft');
      assert.strictEqual(est.estimatedCost, 27225000, 'Pre-GST cost = 12,100 × ₹2,250 = ₹2,72,25,000');
      assert.strictEqual(est.gst, 4900500, '18% GST = ₹49,00,500');
      assert.strictEqual(est.grandTotalCost, 32125500, 'Grand total = ₹3,21,25,500');
      assert.strictEqual(est.floors.length, 4);
    });

    // Case E: Same plot, G+4 (5 floors)
    await st.test('Case E: 55 × 55 ft plot, G+4 (5 floors)', () => {
      const state = {
        plotWidth: 55,
        plotLength: 55,
        numFloors: 5,
        tier: 'standard',
        city: 'Bengaluru',
        state: 'Karnataka'
      };
      const est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.plotArea, 3025);
      assert.strictEqual(est.totalBuiltupArea, 15125, 'Total SBA for G+4 = 5 × 3,025 = 15,125 sq.ft');
      assert.strictEqual(est.plotCarpetArea, 10587.5, 'Carpet area = 15,125 × 0.7 = 10,587.5 sq.ft');
      assert.strictEqual(est.estimatedCost, 34031250, 'Pre-GST cost = 15,125 × ₹2,250 = ₹3,40,31,250');
      assert.strictEqual(est.gst, 6125625, '18% GST = ₹61,25,625');
      assert.strictEqual(est.grandTotalCost, 40156875, 'Grand total = ₹4,01,56,875');
      assert.strictEqual(est.floors.length, 5);
      assert.ok(est.totalBuiltupArea > 12100, 'G+4 area is strictly greater than G+3');
    });

    // Case F: Change plot dimensions after selecting multiple floors
    await st.test('Case F: Change plot dimensions after selecting multiple floors', () => {
      let state = {
        plotWidth: 55,
        plotLength: 55,
        numFloors: 3,
        tier: 'standard',
        city: 'Bengaluru',
        state: 'Karnataka'
      };
      let est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.totalBuiltupArea, 9075);

      // Now user changes plot dimensions to 40 × 60 ft (2,400 sq.ft)
      state = { ...state, plotWidth: 40, plotLength: 60 };
      est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.plotArea, 2400, 'Plot area updated to 40 × 60 = 2,400 sq.ft');
      assert.strictEqual(est.totalBuiltupArea, 7200, 'Total SBA updated to 3 × 2,400 = 7,200 sq.ft');
      assert.strictEqual(est.estimatedCost, 7200 * 2250, 'Cost updated to 7,200 × ₹2,250 = ₹1,62,00,000');
    });

    // Case G: Change the package tier after changing floor count
    await st.test('Case G: Change the package tier after changing floor count', () => {
      let state = {
        plotWidth: 55,
        plotLength: 55,
        numFloors: 2, // G+1 -> 6,050 sq.ft
        tier: 'standard',
        city: 'Bengaluru',
        state: 'Karnataka'
      };
      let est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.costPerSqFt, 2250);
      assert.strictEqual(est.estimatedCost, 6050 * 2250); // 13,612,500

      // Change to Premium: ₹2,850/sq.ft
      state = { ...state, tier: 'premium' };
      est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.totalBuiltupArea, 6050);
      assert.strictEqual(est.costPerSqFt, 2850);
      assert.strictEqual(est.estimatedCost, 6050 * 2850, '6,050 × ₹2,850 = ₹1,72,42,500');

      // Change to Luxury: ₹3,800/sq.ft
      state = { ...state, tier: 'luxury' };
      est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.totalBuiltupArea, 6050);
      assert.strictEqual(est.costPerSqFt, 3800);
      assert.strictEqual(est.estimatedCost, 6050 * 3800, '6,050 × ₹3,800 = ₹2,29,90,000');
    });

    // Case H: Enable manual SBA override and enter 1,800 sq. ft.
    await st.test('Case H: Enable manual SBA override and enter 1,800 sq. ft.', () => {
      const state = {
        plotWidth: 55,
        plotLength: 55,
        numFloors: 2,
        useTargetBua: true,
        targetBuaInput: 1800,
        tier: 'standard',
        city: 'Bengaluru',
        state: 'Karnataka'
      };
      const est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.plotArea, 3025, 'Plot area remains 3,025 sq.ft');
      assert.strictEqual(est.totalBuiltupArea, 1800, 'Manual override sets total SBA to 1,800 sq.ft');
      assert.strictEqual(est.estimatedCost, 1800 * 2250, '1,800 × ₹2,250 = ₹40,50,000');
      assert.strictEqual(est.gst, 729000);
      assert.strictEqual(est.grandTotalCost, 4779000);
    });

    // Case I: Change floor count while manual override is active
    await st.test('Case I: Change floor count while manual override is active (no double multiplication)', () => {
      const state = {
        plotWidth: 55,
        plotLength: 55,
        numFloors: 4, // Changed from 2 to 4 floors while manual override active
        useTargetBua: true,
        targetBuaInput: 1800,
        tier: 'standard',
        city: 'Bengaluru',
        state: 'Karnataka'
      };
      const est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.totalBuiltupArea, 1800, 'Total SBA remains strictly 1,800 sq.ft without multiplying by floor count');
      assert.strictEqual(est.estimatedCost, 1800 * 2250, 'Pre-GST cost remains ₹40,50,000');
      assert.strictEqual(est.floors.length, 4, '4 floors generated');
      assert.strictEqual(est.floors[0].builtupArea, 450, 'Each floor allocated 1,800 / 4 = 450 sq.ft');
    });

    // Case J: Disable manual override and confirm correct automatic recalculation
    await st.test('Case J: Disable manual override and confirm correct automatic recalculation', () => {
      const state = {
        plotWidth: 55,
        plotLength: 55,
        numFloors: 4,
        useTargetBua: false, // Override disabled
        targetBuaInput: 1800,
        tier: 'standard',
        city: 'Bengaluru',
        state: 'Karnataka'
      };
      const est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.totalBuiltupArea, 12100, 'Recalculates automatically to 3,025 × 4 = 12,100 sq.ft');
      assert.strictEqual(est.estimatedCost, 12100 * 2250, 'Pre-GST cost recalculates to 12,100 × ₹2,250 = ₹2,72,25,000');
    });

    // Case K: Verify GST, total investment and cost per square foot
    await st.test('Case K: Verify GST, total investment and cost per square foot', () => {
      const state = {
        plotWidth: 55,
        plotLength: 55,
        numFloors: 3,
        tier: 'standard',
        gstRatePct: 18
      };
      const est = calculateEstimation(state, { isBenchmark: true });
      const sba = 9075;
      const expectedBase = sba * 2250; // 20,418,750
      const expectedGst = Math.round(expectedBase * 0.18); // 3,675,375
      const expectedGrand = expectedBase + expectedGst; // 24,094,125

      assert.strictEqual(est.totalBuiltupArea, sba);
      assert.strictEqual(est.estimatedCost, expectedBase);
      assert.strictEqual(est.gst, expectedGst);
      assert.strictEqual(est.grandTotalCost, expectedGrand);
      assert.strictEqual(est.grandTotalCost - est.estimatedCost, est.gst, 'GST is reconciled with zero double-counting');
      assert.strictEqual(est.costPerSqFt, 2250, 'Denominator for cost per sq.ft is SBA');
    });

    // Case L: Verify material quantities and BOQ use the same final area
    await st.test('Case L: Verify material quantities and BOQ use the same final area', () => {
      const stateG0 = { plotWidth: 55, plotLength: 55, numFloors: 1, tier: 'standard' };
      const stateG1 = { plotWidth: 55, plotLength: 55, numFloors: 2, tier: 'standard' };

      const estG0 = calculateEstimation(stateG0, { isBenchmark: true });
      const estG1 = calculateEstimation(stateG1, { isBenchmark: true });

      // Steel tonnes: (sba * 3.85 * 1.05) / 1000
      const steelG0 = (3025 * 3.85 * 1.05) / 1000;
      const steelG1 = (6050 * 3.85 * 1.05) / 1000;
      assert.strictEqual(Number(estG0.boqItems[0].items.find(i => i.id === 'item-steel').qty.toFixed(2)), Number(steelG0.toFixed(2)));
      assert.strictEqual(Number(estG1.boqItems[0].items.find(i => i.id === 'item-steel').qty.toFixed(2)), Number(steelG1.toFixed(2)));

      // Cement bags: round(sba * 0.42)
      assert.strictEqual(estG0.boqItems[0].items.find(i => i.id === 'item-cement').qty, Math.round(3025 * 0.42));
      assert.strictEqual(estG1.boqItems[0].items.find(i => i.id === 'item-cement').qty, Math.round(6050 * 0.42));

      // Cement for G+1 must be exactly double G+0
      assert.strictEqual(estG1.boqItems[0].items.find(i => i.id === 'item-cement').qty, Math.round(6050 * 0.42));
    });

    // Case M: Save and reload an estimate and verify its results
    await st.test('Case M: Save and reload an estimate and verify its results', () => {
      const originalState = {
        id: 'proj_bangalore_live_test',
        projectName: 'Bangalore Multi-Storey Residence',
        city: 'Bengaluru',
        state: 'Karnataka',
        tier: 'standard',
        plotWidth: 55,
        plotLength: 55,
        numFloors: 3 // G+2 (9,075 sq.ft SBA)
      };

      const originalEstimation = calculateEstimation(originalState, { isBenchmark: true });

      // Simulated saved snapshot (matching saveCurrentProject)
      const savedSummary = {
        id: originalState.id,
        name: originalState.projectName,
        state: originalState.state,
        city: originalState.city,
        tier: originalState.tier,
        numFloors: originalState.numFloors,
        totalCost: originalEstimation.grandTotalCost,
        totalBua: originalEstimation.totalBuiltupArea,
        ratePerSqFt: originalEstimation.costPerSqFt,
        stateSnapshot: JSON.parse(JSON.stringify(originalState))
      };

      // Reload
      const reloadedState = JSON.parse(JSON.stringify(savedSummary.stateSnapshot));
      const reloadedEstimation = calculateEstimation(reloadedState, { isBenchmark: true });

      assert.strictEqual(reloadedEstimation.totalBuiltupArea, originalEstimation.totalBuiltupArea, 'Reloaded SBA matches');
      assert.strictEqual(reloadedEstimation.numFloors, originalEstimation.numFloors, 'Reloaded floor count matches');
      assert.strictEqual(reloadedEstimation.estimatedCost, originalEstimation.estimatedCost, 'Reloaded base cost matches');
      assert.strictEqual(reloadedEstimation.grandTotalCost, originalEstimation.grandTotalCost, 'Reloaded grand total matches');
      assert.strictEqual(reloadedEstimation.costPerSqFt, originalEstimation.costPerSqFt, 'Reloaded rate per sq.ft matches');
    });

    // Case N: Verify PDF and Excel outputs use the same area, floor count and price as the UI
    await st.test('Case N: Verify PDF and Excel outputs use the same area, floor count and price as the UI', async () => {
      const state = {
        projectName: 'Bangalore Client Residence',
        customerName: 'Bangalore Client',
        city: 'Bengaluru',
        state: 'Karnataka',
        tier: 'standard',
        plotWidth: 55,
        plotLength: 55,
        numFloors: 2 // G+1
      };

      const est = calculateEstimation(state, { isBenchmark: true });
      assert.strictEqual(est.totalBuiltupArea, 6050);
      assert.strictEqual(est.estimatedCost, 13612500);

      // Verify Planner PDF Exporter
      const pdfBuffer = await generatePlannerPDF(state, est);
      assert.ok(Buffer.isBuffer(pdfBuffer));
      assert.strictEqual(pdfBuffer.subarray(0, 4).toString(), '%PDF');

      // Verify Commercial BOQ Excel Exporter for Mode A
      const modeABoq = {
        mode: 'PACKAGE',
        title: state.projectName,
        pricingState: 'Karnataka',
        packageEstimate: {
          totalBuiltupArea: est.totalBuiltupArea,
          ratePerSqFt: est.costPerSqFt,
          estimatedCost: est.estimatedCost,
          gstRate: 18,
          gstAmount: est.gst,
          grandTotal: est.grandTotalCost,
          numFloors: est.numFloors,
          packageName: 'Standard Package',
          floors: est.floors
        }
      };

      const excelBuffer = await exportToExcel(modeABoq);
      assert.ok(Buffer.isBuffer(excelBuffer));
      assert.ok(excelBuffer.length > 2000, 'Excel workbook generated with content');
    });

    // Case O: Verify ground coverage ratio calculation and Bangalore coverageCheck warning behavior
    await st.test('Case O: Verify ground coverage ratio calculation and Bangalore coverageCheck advisory behavior', () => {
      // 1. Automatic equal floor plate model: 100% ground coverage triggers advisory warning for Bangalore (55% limit)
      const stateBangaloreAuto = {
        city: 'Bengaluru',
        state: 'Karnataka',
        plotWidth: 55,
        plotLength: 55,
        numFloors: 2 // G+1 -> 3,025 sq.ft per floor
      };
      const estAuto = calculateEstimation(stateBangaloreAuto, { isBenchmark: true });
      assert.strictEqual(estAuto.plotArea, 3025);
      assert.strictEqual(estAuto.groundFloorBua, 3025);
      assert.strictEqual(estAuto.groundCoverageRatio, 1.0, 'Automatic model ground coverage ratio is 100%');
      assert.strictEqual(estAuto.coverageCheck.limit, 0.55, 'Bengaluru statutory coverage limit is 55%');
      assert.strictEqual(estAuto.coverageCheck.isOverLimit, true, '100% coverage triggers isOverLimit = true');
      assert.ok(estAuto.coverageCheck.message.includes('above the 55% planning benchmark'), 'Warning advises consulting architect on setbacks');

      // 2. Setback-compliant footprint via manual override (e.g., 1,500 sq.ft per floor <= 55% of 3,025 = 1,663.75 sq.ft)
      const stateBangaloreCompliant = {
        city: 'Bengaluru',
        state: 'Karnataka',
        plotWidth: 55,
        plotLength: 55,
        numFloors: 2, // G+1
        useTargetBua: true,
        targetBuaInput: 3000 // 1,500 sq.ft per floor
      };
      const estCompliant = calculateEstimation(stateBangaloreCompliant, { isBenchmark: true });
      assert.strictEqual(estCompliant.groundFloorBua, 1500);
      assert.strictEqual(Math.round(estCompliant.groundCoverageRatio * 1000) / 1000, Math.round((1500 / 3025) * 1000) / 1000);
      assert.ok(estCompliant.groundCoverageRatio < 0.55, 'Coverage ratio is under 55%');
      assert.strictEqual(estCompliant.coverageCheck.isOverLimit, false, 'Compliant footprint does not trigger over-limit warning');
      assert.ok(estCompliant.coverageCheck.message.includes('within the 55% planning benchmark'), 'Confirms coverage is within benchmark');

      // 3. Non-Bangalore city (e.g. Hyderabad or Mumbai) uses 60% planning benchmark
      const stateOtherCity = {
        city: 'Hyderabad',
        state: 'Telangana',
        plotWidth: 55,
        plotLength: 55,
        numFloors: 1
      };
      const estOther = calculateEstimation(stateOtherCity, { isBenchmark: true });
      assert.strictEqual(estOther.coverageCheck.limit, 0.60, 'Non-Bangalore cities have 60% coverage benchmark');
    });

    // Case P: Manual total SBA override of 3,000 sq. ft with G+1 (2 floors) on 55 × 55 ft plot
    await st.test('Case P: Manual total SBA override of 3,000 sq. ft with G+1 results in 1,500 sq. ft per floor with compliant coverage', () => {
      const state = {
        city: 'Bengaluru',
        state: 'Karnataka',
        plotWidth: 55,
        plotLength: 55,
        numFloors: 2, // G+1 (2 floors total)
        useTargetBua: true,
        targetBuaInput: 3000,
        tier: 'standard'
      };

      const est = calculateEstimation(state, { isBenchmark: true });

      // 1. Gross plot area
      assert.strictEqual(est.plotArea, 3025, 'Gross plot area = 55 × 55 = 3,025 sq.ft');

      // 2. Total built-up area (SBA)
      assert.strictEqual(est.totalBuiltupArea, 3000, 'Total SBA = 3,000 sq.ft (manual override total, not multiplied)');

      // 3. Per-floor built-up area
      assert.strictEqual(est.floors.length, 2, '2 floor schedules generated');
      assert.strictEqual(est.floors[0].builtupArea, 1500, 'Ground floor BUA = 3,000 / 2 = 1,500 sq.ft');
      assert.strictEqual(est.floors[1].builtupArea, 1500, 'First floor BUA = 3,000 / 2 = 1,500 sq.ft');

      // 4. Ground-floor built-up footprint & coverage ratio
      assert.strictEqual(est.groundFloorBua, 1500, 'Ground-floor footprint is strictly 1,500 sq.ft, never total SBA');
      const expectedRatio = 1500 / 3025;
      assert.strictEqual(Math.round(est.groundCoverageRatio * 1000) / 1000, Math.round(expectedRatio * 1000) / 1000);
      assert.ok(est.groundCoverageRatio < 0.55, 'Ground coverage ratio is ~49.6%, below the 55% Bangalore benchmark');
      assert.strictEqual(est.coverageCheck.isOverLimit, false, 'Coverage is within legal benchmark');

      // 5. Carpet area benchmark (70% of SBA)
      assert.strictEqual(est.plotCarpetArea, 2100, 'Total carpet area = 3,000 × 70% = 2,100 sq.ft');
      assert.strictEqual(est.floors[0].carpetArea, 1050, 'Ground floor carpet = 1,500 × 70% = 1,050 sq.ft');
      assert.strictEqual(est.floors[1].carpetArea, 1050, 'First floor carpet = 1,500 × 70% = 1,050 sq.ft');

      // 6. Pricing & GST
      assert.strictEqual(est.costPerSqFt, 2250);
      assert.strictEqual(est.estimatedCost, 3000 * 2250, 'Pre-GST cost = 3,000 × ₹2,250 = ₹67,50,000');
      assert.strictEqual(est.gst, Math.round(6750000 * 0.18), '18% GST = ₹12,15,000');
      assert.strictEqual(est.grandTotalCost, 6750000 + 1215000, 'Grand total = ₹79,65,000');
    });

    // Case Q: Seamless switching between automatic mode, custom room configurations, and manual override
    await st.test('Case Q: Seamless switching between automatic mode, custom room configurations, and manual override', () => {
      // Step A: Initial automatic equal floor plate mode (55 × 55, G+1)
      const baseState = {
        city: 'Bengaluru',
        state: 'Karnataka',
        plotWidth: 55,
        plotLength: 55,
        numFloors: 2,
        tier: 'standard'
      };
      const estAuto = calculateEstimation(baseState, { isBenchmark: true });
      assert.strictEqual(estAuto.totalBuiltupArea, 6050, 'Step A: Automatic SBA is 6,050 sq.ft');
      assert.strictEqual(estAuto.groundFloorBua, 3025, 'Step A: Ground footprint is 3,025 sq.ft');

      // Step B: User configures custom rooms on floors (unequal plates: Ground = 1,200 sq.ft, 1st = 800 sq.ft)
      const customRoomsState = {
        ...baseState,
        hasCustomRooms: true,
        floors: [
          {
            id: 'floor-0',
            name: 'Ground Floor',
            floorNumber: 0,
            builtupArea: 1200,
            rooms: [{ id: 'r1', type: 'living', width: 25, length: 40, count: 1 }]
          },
          {
            id: 'floor-1',
            name: '1st Floor',
            floorNumber: 1,
            builtupArea: 800,
            rooms: [{ id: 'r2', type: 'master_bed', width: 20, length: 30, count: 1 }]
          }
        ]
      };
      const estCustom = calculateEstimation(customRoomsState, { isBenchmark: true });
      assert.strictEqual(estCustom.totalBuiltupArea, 2000, 'Step B: Custom rooms total SBA = 1,200 + 800 = 2,000 sq.ft');
      assert.strictEqual(estCustom.groundFloorBua, 1200, 'Step B: Ground floor footprint = 1,200 sq.ft');
      assert.strictEqual(estCustom.floors[0].builtupArea, 1200);
      assert.strictEqual(estCustom.floors[1].builtupArea, 800);
      assert.strictEqual(estCustom.estimatedCost, 2000 * 2250, 'Cost uses 2,000 sq.ft = ₹45,00,000');

      // Step C: User activates Manual SBA Override = 3,000 sq.ft while custom rooms exist in state
      const manualOverrideState = {
        ...customRoomsState,
        useTargetBua: true,
        targetBuaInput: 3000
      };
      const estManual = calculateEstimation(manualOverrideState, { isBenchmark: true });
      assert.strictEqual(estManual.totalBuiltupArea, 3000, 'Step C: Manual override takes precedence = 3,000 sq.ft');
      assert.strictEqual(estManual.floors[0].builtupArea, 1500, 'Step C: Equal distribution gives 1,500 sq.ft to floor 0');
      assert.strictEqual(estManual.floors[1].builtupArea, 1500, 'Step C: Equal distribution gives 1,500 sq.ft to floor 1');
      assert.strictEqual(estManual.groundFloorBua, 1500, 'Step C: Ground footprint is 1,500 sq.ft');

      // Step D: User deactivates Manual SBA Override -> reverts seamlessly to custom room totals
      const revertedCustomState = {
        ...manualOverrideState,
        useTargetBua: false
      };
      const estRevertedCustom = calculateEstimation(revertedCustomState, { isBenchmark: true });
      assert.strictEqual(estRevertedCustom.totalBuiltupArea, 2000, 'Step D: Cleanly reverts to custom rooms total = 2,000 sq.ft');
      assert.strictEqual(estRevertedCustom.groundFloorBua, 1200, 'Step D: Ground footprint reverts to 1,200 sq.ft');
      assert.strictEqual(estRevertedCustom.floors[0].builtupArea, 1200);
      assert.strictEqual(estRevertedCustom.floors[1].builtupArea, 800);

      // Step E: User resets custom rooms -> reverts seamlessly to automatic equal floor plates
      const revertedAutoState = {
        ...revertedCustomState,
        hasCustomRooms: false
      };
      const estRevertedAuto = calculateEstimation(revertedAutoState, { isBenchmark: true });
      assert.strictEqual(estRevertedAuto.totalBuiltupArea, 6050, 'Step E: Reverts cleanly to automatic 6,050 sq.ft');
      assert.strictEqual(estRevertedAuto.groundFloorBua, 3025, 'Step E: Ground footprint reverts to 3,025 sq.ft');
    });
  });
});

