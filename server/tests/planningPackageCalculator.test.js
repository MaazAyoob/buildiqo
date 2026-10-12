const test = require('node:test');
const assert = require('node:assert');

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
});
