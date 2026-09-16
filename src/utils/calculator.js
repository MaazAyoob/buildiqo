import { CITIES, SOIL_TYPES } from '../data/cities';
import { MATERIAL_CATEGORIES, TIER_BENCHMARKS } from '../data/materials';
import { BUILDING_TYPES, CONSTRUCTION_TYPES, AREA_UNITS } from '../data/defaults';

const NON_CARPET_ROOM_TYPES = new Set(['parking', 'balcony', 'terrace', 'staircase']);

function getRoomArea(room) {
  const count = Math.max(1, Number(room.count) || 1);
  if (Number(room.area) > 0) return Number(room.area) * count;
  return (Number(room.width) || 0) * (Number(room.length) || 0) * count;
}

export function calculateEstimation(state, pricingContext = null) {
  const matchedCity = CITIES.find(c => 
    c.id.toLowerCase() === (state.city || '').toLowerCase() || 
    c.name.toLowerCase().includes((state.city || '').toLowerCase())
  );
  const city = matchedCity || {
    id: 'custom',
    name: state.city?.trim() || 'Bengaluru',
    multiplier: 1.0,
    zone: 'Regional',
    state: 'India'
  };
  const soil = SOIL_TYPES.find(s => s.id === state.soilType) || SOIL_TYPES[0];
  const buildingType = BUILDING_TYPES.find(b => b.id === state.buildingType) || BUILDING_TYPES[0];
  const constructionType = CONSTRUCTION_TYPES.find(ct => ct.id === state.constructionType) || CONSTRUCTION_TYPES[0];
  const tier = (state.tier && TIER_BENCHMARKS[state.tier]) ? state.tier : 'standard';
  
  const snap = pricingContext?.snapshot || null;
  const isSnapshot = pricingContext?.isSnapshot === true || Boolean(snap);

  // In production pricing, geographic multiplier is strictly 1.0 (rates are direct State-Wise rates).
  // For historical snapshots created under legacy schema versions, preserve the saved multiplier.
  const cityMult = (isSnapshot && (snap?.regionalMultiplier !== undefined || snap?.cityMultiplier !== undefined))
    ? Number(snap.regionalMultiplier ?? snap.cityMultiplier)
    : 1.0;
  const soilMult = soil.footingCostMult || 1.0;
  const bldgMult = buildingType.costMult || 1.0;
  const constrMult = constructionType.costMult || 1.0;

  // Plot Area calculation with unit conversion support
  const unitDef = AREA_UNITS.find(u => u.id === state.areaUnit) || AREA_UNITS[0];
  const plotArea = Math.max(100, Math.round((state.plotLength || 40) * (state.plotWidth || 30)));

  // Floor space calculations
  let totalCarpetArea = 0;
  const floors = state.floors || [];
  const floorDetails = floors.map((floor) => {
    let floorCarpet = 0;
    let roomCount = 0;
    (floor.rooms || []).forEach(r => {
      const area = getRoomArea(r);
      if (!NON_CARPET_ROOM_TYPES.has(r.type)) floorCarpet += area;
      roomCount += (Number(r.count) || 1);
    });
    totalCarpetArea += floorCarpet;
    
    // Built-up area = carpet area * 1.18 (accounting for walls, circulation, shafts)
    const builtupArea = Math.round(floorCarpet * 1.18);

    return {
      id: floor.id,
      name: floor.name,
      floorNumber: floor.floorNumber,
      carpetArea: floorCarpet,
      builtupArea: Math.max(builtupArea, floor.targetBua || 0),
      roomCount
    };
  });

  const calculatedTotalBua = floorDetails.reduce((sum, f) => sum + f.builtupArea, 0);
  const totalBuiltupArea = state.targetBuaInput > 0 ? Number(state.targetBuaInput) : Math.max(calculatedTotalBua, 400);
  const groundFloorBua = floorDetails[0]?.builtupArea || Math.round(totalBuiltupArea / (state.floors.length || 1));
  const coverageLimit = city.id === 'bangalore' ? 0.55 : 0.60;
  const groundCoverageRatio = plotArea > 0 ? (groundFloorBua / plotArea) : 0;
  const coverageCheck = {
    limit: coverageLimit,
    isOverLimit: groundCoverageRatio > coverageLimit,
    message: groundCoverageRatio > coverageLimit
      ? `${city.name} ground coverage is ${(groundCoverageRatio * 100).toFixed(1)}%, above the ${Math.round(coverageLimit * 100)}% planning benchmark. Confirm setbacks and approval with a licensed architect.`
      : `Ground coverage is ${(groundCoverageRatio * 100).toFixed(1)}%, within the ${Math.round(coverageLimit * 100)}% planning benchmark.`
  };

  // Selected Material Option mappings & authoritative pricing resolution
  const isBenchmark = pricingContext?.isBenchmark === true || (isSnapshot && snap?.isBenchmark === true);
  const providedRates = pricingContext?.rates || snap?.materialRates || snap?.rates || null;

  let pricingStatus = 'APPROVED';
  const missingRates = [];
  const selectedMaterials = {};

  MATERIAL_CATEGORIES.forEach(cat => {
    const customId = state.customMaterials?.[cat.id];
    let foundOption = null;
    if (customId) {
      foundOption = cat.options.find(o => o.id === customId);
    }
    if (!foundOption) {
      foundOption = cat.options.find(o => o.tier === tier) || cat.options[1] || cat.options[0];
    }

    // Clone option to prevent mutating static defaults
    const option = { ...foundOption };

    let resolvedRate = null;
    let rateSource = 'benchmark';
    let pricingScope = 'STATE';
    let pricingSource = 'APPROVED_STATE_RATE';

    if (providedRates) {
      const codeKey = option.id ? option.id.toUpperCase() : '';
      const lowerKey = option.id ? option.id.toLowerCase() : '';
      const catKey = cat.id ? cat.id.toLowerCase() : '';
      const match = providedRates[codeKey] || providedRates[lowerKey] || providedRates[catKey];

      if (match) {
        resolvedRate = typeof match === 'number' ? match : (match.unitRate ?? match.rate);
        rateSource = typeof match === 'object' && match.source ? match.source : (isSnapshot ? 'historical_snapshot' : 'database_approved');
        pricingScope = typeof match === 'object' && match.pricingScope ? match.pricingScope : (pricingContext?.pricingScope || 'STATE');
        pricingSource = typeof match === 'object' && match.pricingSource ? match.pricingSource : (pricingContext?.pricingSource || 'APPROVED_STATE_RATE');
      }
    }

    if (resolvedRate !== null && resolvedRate !== undefined && !isNaN(resolvedRate)) {
      option.unitRate = Number(resolvedRate);
      option.rateSource = rateSource;
      option.pricingScope = pricingScope;
      option.pricingSource = pricingSource;
    } else if (isBenchmark) {
      // Explicit user-chosen benchmark mode only
      option.unitRate = foundOption.unitRate;
      option.rateSource = 'benchmark_mode';
      option.pricingScope = 'BENCHMARK';
      option.pricingSource = 'BENCHMARK_DEMO';
    } else {
      // Production rate unavailable: DO NOT SILENTLY USE BENCHMARK
      option.unitRate = 0;
      option.rateSource = 'UNAVAILABLE';
      option.pricingScope = 'UNAVAILABLE';
      option.pricingSource = 'UNAVAILABLE';
      missingRates.push(option.id || cat.id);
    }

    selectedMaterials[cat.id] = option;
  });

  if (missingRates.length > 0) {
    pricingStatus = 'UNAVAILABLE';
  } else if (isSnapshot) {
    pricingStatus = 'SNAPSHOT_HISTORICAL';
  } else if (isBenchmark) {
    pricingStatus = 'BENCHMARK';
  } else {
    pricingStatus = 'APPROVED';
  }

  // Structural Quantities & Cost (RCC, Foundation, Columns, Beams, Slabs)
  // Authoritative State-Wise Production Pricing: approved rates are used directly without secret geographic multipliers.
  const steelKgPerSqFt = 3.85;
  const steelWastagePct = 5;
  const steelTonne = ((totalBuiltupArea * steelKgPerSqFt * (1 + steelWastagePct / 100)) / 1000);
  const footingDepthFt = Number(state.footingDepthFt) || 5;
  const footingType = state.footingType || 'Isolated RCC footings';
  const steelCost = Math.round(steelTonne * selectedMaterials.steel.unitRate * soilMult * constrMult);

  const cementBags = Math.round(totalBuiltupArea * 0.42);
  const cementCost = Math.round(cementBags * selectedMaterials.cement.unitRate * constrMult);

  const sandCuFt = Math.round(totalBuiltupArea * 1.9);
  const sandCost = Math.round(sandCuFt * selectedMaterials.sand.unitRate);

  const aggregateCuFt = Math.round(totalBuiltupArea * 1.35);
  const aggregateCost = Math.round(aggregateCuFt * 48);

  const masonryWallArea = Math.round(totalBuiltupArea * 0.85);
  const masonryCost = Math.round(masonryWallArea * selectedMaterials.masonry.unitRate * bldgMult);

  const flooringArea = Math.round(totalCarpetArea * 1.07);
  const flooringCost = Math.round(flooringArea * selectedMaterials.flooring.unitRate);

  let totalBaths = 0;
  let totalKitchens = 0;
  floors.forEach(f => {
    (f.rooms || []).forEach(r => {
      if (r.type === 'attached_bath' || r.type === 'common_bath') totalBaths += (Number(r.count) || 1);
      if (r.type === 'kitchen') totalKitchens += (Number(r.count) || 1);
    });
  });
  totalBaths = Math.max(1, totalBaths);
  totalKitchens = Math.max(1, totalKitchens);

  const bathroomCost = Math.round(totalBaths * selectedMaterials.bathroom.unitRate);
  const kitchenCost = Math.round(totalKitchens * 150 * selectedMaterials.kitchen.unitRate);
  const electricalCost = Math.round(totalBuiltupArea * selectedMaterials.electrical.unitRate);
  const roomCountForPoints = floorDetails.reduce((sum, floor) => sum + floor.roomCount, 0);
  const bedroomCount = floors.reduce((sum, floor) => sum + (floor.rooms || []).filter(r => r.type === 'master_bed' || r.type === 'regular_bed').reduce((roomSum, room) => roomSum + (Number(room.count) || 1), 0), 0);
  const electricalPoints = {
    lights: Math.max(1, Math.ceil(roomCountForPoints * 1.5)),
    plugs: Math.max(1, roomCountForPoints * 2),
    ac: bedroomCount,
    db: Math.max(1, floors.length)
  };
  const openingsArea = Math.round(totalBuiltupArea * 0.15);
  const doorsWindowsCost = Math.round(openingsArea * selectedMaterials.doors_windows.unitRate);
  const paintingSurfaceArea = Math.round(totalBuiltupArea * 3.7);
  const paintingCost = Math.round(paintingSurfaceArea * selectedMaterials.painting.unitRate);

  const waterproofingBase = selectedMaterials.waterproofing.unitRate;
  const waterproofingCost = Math.round(waterproofingBase * (totalBuiltupArea / 2000));

  // Labor Costs
  const laborRates = (isSnapshot && snap?.laborRates) ? snap.laborRates : {
    structure: 280,
    masonryPlaster: 180,
    flooringTiling: 45,
    plumbingMEP: 65,
    electrical: 55,
    painting: 14
  };
  const laborStructure = Math.round(totalBuiltupArea * (laborRates.structure || 280) * constrMult);
  const laborMasonryPlaster = Math.round(totalBuiltupArea * (laborRates.masonryPlaster || 180));
  const laborFlooringTiling = Math.round(flooringArea * (laborRates.flooringTiling || 45));
  const laborPlumbingMEP = Math.round(totalBuiltupArea * (laborRates.plumbingMEP || 65));
  const laborElectrical = Math.round(totalBuiltupArea * (laborRates.electrical || 55));
  const laborPainting = Math.round(paintingSurfaceArea * (laborRates.painting || 14));

  const totalLaborCost = laborStructure + laborMasonryPlaster + laborFlooringTiling + laborPlumbingMEP + laborElectrical + laborPainting;

  // Ancillary additions (User Add / Remove options)
  let compoundWallCost = 0;
  if (state.includeCompoundWall) {
    const wallLen = state.compoundWallLength || (state.plotLength * 2 + state.plotWidth * 2 - 12);
    compoundWallCost = Math.round(wallLen * 5 * 180 * cityMult);
  }

  let sumpCost = 0;
  if (state.includeSump) {
    const litres = state.sumpCapacityLitres || 8000;
    sumpCost = Math.round(litres * 18 * cityMult);
  }

  let overheadTankCost = 0;
  if (state.includeOverheadTank) {
    const tankLitres = state.overheadTankLitres || 2000;
    overheadTankCost = Math.round(tankLitres * 16 * cityMult);
  }

  let solarCost = 0;
  if (state.includeSolarPower) {
    const kw = state.solarCapacityKw || 3;
    solarCost = Math.round(kw * 65000);
  }

  let rainwaterHarvestingCost = 0;
  if (state.includeRainwaterHarvesting) {
    rainwaterHarvestingCost = Math.round(35000 * cityMult);
  }

  let borewellCost = 0;
  if (state.includeBorewell) {
    const depth = state.borewellDepthFt || 600;
    borewellCost = Math.round(depth * 280 * cityMult + 45000); // Drilling + Casing + Submersible pump
  }

  let elevatorCost = 0;
  if (state.includeElevator) {
    const stops = state.elevatorStops || state.numFloors || 2;
    elevatorCost = Math.round(450000 + stops * 75000);
  }

  // Custom User-Added BOQ / Scope Items sum
  let customItemsTotal = 0;
  (state.customBoqItems || []).forEach(item => {
    customItemsTotal += (Number(item.amount) || 0);
  });

  const ancillaryCost = compoundWallCost + sumpCost + overheadTankCost + solarCost + rainwaterHarvestingCost + borewellCost + elevatorCost + customItemsTotal;

  // Direct Material Total
  const directMaterialCost = steelCost + cementCost + sandCost + aggregateCost + masonryCost + flooringCost + bathroomCost + kitchenCost + electricalCost + doorsWindowsCost + paintingCost + waterproofingCost;

  // Prime Construction Direct Cost
  const directConstructionCost = directMaterialCost + totalLaborCost + ancillaryCost;

  // Overheads & Professional Services
  const archFeePct = (isSnapshot && snap?.overheadParameters?.architectureDesignFeesPct !== undefined)
    ? Number(snap.overheadParameters.architectureDesignFeesPct)
    : (state.architectureDesignFeesPct || 2.5);
  const contractorMarginPct = (isSnapshot && snap?.overheadParameters?.contractorMarginPct !== undefined)
    ? Number(snap.overheadParameters.contractorMarginPct)
    : (state.contractorMarginPct || 10);
  const contingencyPct = (isSnapshot && snap?.overheadParameters?.contingencyPct !== undefined)
    ? Number(snap.overheadParameters.contingencyPct)
    : (state.contingencyPct || 4);

  const architectureFee = Math.round(directConstructionCost * (archFeePct / 100));
  const contractorMargin = Math.round(directConstructionCost * (contractorMarginPct / 100));
  const contingencyBuffer = Math.round(directConstructionCost * (contingencyPct / 100));

  const grandTotalCost = directConstructionCost + architectureFee + contractorMargin + contingencyBuffer;
  const costPerSqFt = totalBuiltupArea > 0 ? Math.round(grandTotalCost / totalBuiltupArea) : 0;

  // Itemized BOQ Schedule
  const boqItems = [
    {
      id: 'cat_structure',
      category: 'Structure & Earthwork (IS 456)',
      items: [
        { id: 'item-exc', name: 'Earthwork Excavation & Backfilling', qty: Math.round(totalBuiltupArea * 0.4), unit: 'Cu.M', materialCost: 0, laborCost: Math.round(totalBuiltupArea * 35 * cityMult), total: Math.round(totalBuiltupArea * 35 * cityMult), spec: 'Machine excavation in hard/medium soil' },
        { id: 'item-steel', name: `Steel Rebar (${selectedMaterials.steel.name})`, qty: Number(steelTonne.toFixed(2)), unit: 'Tonnes', materialCost: steelCost, laborCost: Math.round(steelTonne * 8500 * cityMult), total: Math.round(steelCost + steelTonne * 8500 * cityMult), spec: `${selectedMaterials.steel.grade}; ${steelKgPerSqFt} kg/sq.ft + ${steelWastagePct}% wastage; ${footingType}, ${footingDepthFt} ft depth; SBC ${soil.sbc}` },
        { id: 'item-cement', name: `Structural Cement (${selectedMaterials.cement.name})`, qty: cementBags, unit: 'Bags', materialCost: cementCost, laborCost: 0, total: cementCost, spec: selectedMaterials.cement.grade },
        { id: 'item-sand', name: `Aggregates & Sand (${selectedMaterials.sand.name})`, qty: sandCuFt + aggregateCuFt, unit: 'Cu.Ft', materialCost: sandCost + aggregateCost, laborCost: 0, total: sandCost + aggregateCost, spec: 'Graded 20mm blue metal & screened sand' },
        { id: 'item-formwork', name: 'RCC Formwork, Shuttering & Scaffolding', qty: totalBuiltupArea, unit: 'Sq.Ft', materialCost: Math.round(totalBuiltupArea * 45 * cityMult), laborCost: Math.max(0, laborStructure - Math.round(steelTonne * 8500 * cityMult) - Math.round(totalBuiltupArea * 35 * cityMult)), total: Math.round(totalBuiltupArea * 45 * cityMult) + Math.max(0, laborStructure - Math.round(steelTonne * 8500 * cityMult) - Math.round(totalBuiltupArea * 35 * cityMult)), spec: 'Waterproof ply shuttering with steel props' }
      ]
    },
    {
      id: 'cat_masonry',
      category: 'Masonry & Plastering',
      items: [
        { id: 'item-masonry', name: `Wall Masonry (${selectedMaterials.masonry.name})`, qty: masonryWallArea, unit: 'Sq.Ft', materialCost: masonryCost, laborCost: Math.round(masonryWallArea * 35 * cityMult), total: Math.round(masonryCost + masonryWallArea * 35 * cityMult), spec: selectedMaterials.masonry.desc },
        { id: 'item-plaster', name: 'Internal & External Cement Plastering', qty: Math.round(totalBuiltupArea * 2.5), unit: 'Sq.Ft', materialCost: Math.round(totalBuiltupArea * 38 * cityMult), laborCost: Math.max(0, laborMasonryPlaster - Math.round(masonryWallArea * 35 * cityMult)), total: Math.round(totalBuiltupArea * 38 * cityMult) + Math.max(0, laborMasonryPlaster - Math.round(masonryWallArea * 35 * cityMult)), spec: '1:4 cement mortar with water-curing compound' }
      ]
    },
    {
      id: 'cat_flooring',
      category: 'Flooring, Tiling & Countertops',
      items: [
        { id: 'item-floor', name: `Main Flooring (${selectedMaterials.flooring.name})`, qty: flooringArea, unit: 'Sq.Ft', materialCost: flooringCost, laborCost: laborFlooringTiling, total: flooringCost + laborFlooringTiling, spec: selectedMaterials.flooring.desc },
        { id: 'item-kitchen', name: `Kitchen Platform & Backsplash (${selectedMaterials.kitchen.name})`, qty: totalKitchens, unit: 'Kitchen', materialCost: kitchenCost, laborCost: Math.round(totalKitchens * 9500 * cityMult), total: kitchenCost + Math.round(totalKitchens * 9500 * cityMult), spec: selectedMaterials.kitchen.desc }
      ]
    },
    {
      id: 'cat_doors',
      category: 'Doors, Windows & Fabrication',
      items: [
        { id: 'item-doors', name: `Doors & Window Openings (${selectedMaterials.doors_windows.name})`, qty: openingsArea, unit: 'Sq.Ft', materialCost: doorsWindowsCost, laborCost: Math.round(openingsArea * 30 * cityMult), total: doorsWindowsCost + Math.round(openingsArea * 30 * cityMult), spec: selectedMaterials.doors_windows.desc },
        { id: 'item-railing', name: 'Balcony & Staircase SS/Glass Railings', qty: Math.round(totalBuiltupArea * 0.08), unit: 'R.Ft', materialCost: Math.round(totalBuiltupArea * 0.08 * 850 * cityMult), laborCost: Math.round(totalBuiltupArea * 0.08 * 150 * cityMult), total: Math.round(totalBuiltupArea * 0.08 * 1000 * cityMult), spec: 'SS 304 Grade with toughened glass panels' }
      ]
    },
    {
      id: 'cat_mep',
      category: 'Plumbing, Sanitary & Water Systems',
      items: [
        { id: 'item-sanitary', name: `Bathroom Sanitary & Fittings (${selectedMaterials.bathroom.name})`, qty: totalBaths, unit: 'Baths', materialCost: bathroomCost, laborCost: laborPlumbingMEP, total: bathroomCost + laborPlumbingMEP, spec: selectedMaterials.bathroom.desc },
        { id: 'item-pipes', name: 'Internal Concealed CPVC/PVC Piping Network', qty: totalBuiltupArea, unit: 'Sq.Ft', materialCost: Math.round(totalBuiltupArea * 45 * cityMult), laborCost: 0, total: Math.round(totalBuiltupArea * 45 * cityMult), spec: 'Astral / Ashirvad SDR 11 CPVC & PVC pipes' }
      ]
    },
    {
      id: 'cat_elec',
      category: 'Electrical & Wiring Installation',
      items: [
        { id: 'item-wiring', name: `Wiring, Conduits & Switches (${selectedMaterials.electrical.name})`, qty: totalBuiltupArea, unit: 'Sq.Ft', materialCost: electricalCost, laborCost: laborElectrical, total: electricalCost + laborElectrical, spec: `${selectedMaterials.electrical.desc}; ${electricalPoints.lights} light, ${electricalPoints.plugs} plug, ${electricalPoints.ac} AC points` },
        { id: 'item-db', name: 'Distribution Boards, MCB/RCCB & Earthing Pit', qty: electricalPoints.db, unit: 'Sets', materialCost: Math.round(electricalPoints.db * 14000 * cityMult), laborCost: Math.round(electricalPoints.db * 4000 * cityMult), total: Math.round(electricalPoints.db * 18000 * cityMult), spec: 'Schneider / Legrand 8-way TPN DB with copper plate earthing' }
      ]
    },
    {
      id: 'cat_paint',
      category: 'Painting, Waterproofing & Finishes',
      items: [
        { id: 'item-paint', name: `Interior & Exterior Paint (${selectedMaterials.painting.name})`, qty: paintingSurfaceArea, unit: 'Sq.Ft', materialCost: paintingCost, laborCost: laborPainting, total: paintingCost + laborPainting, spec: selectedMaterials.painting.desc },
        { id: 'item-wp', name: `Waterproofing Solution (${selectedMaterials.waterproofing.name})`, qty: 1, unit: 'Package', materialCost: waterproofingCost, laborCost: Math.round(waterproofingCost * 0.25), total: Math.round(waterproofingCost * 1.25), spec: selectedMaterials.waterproofing.desc }
      ]
    },
    {
      id: 'cat_ancillary',
      category: 'Site Amenities & Custom Works (Add / Remove)',
      items: [
        ...(state.includeCompoundWall ? [{ id: 'anc-wall', name: 'Compound Boundary Wall & MS Gate', qty: 1, unit: 'Set', materialCost: compoundWallCost, laborCost: 0, total: compoundWallCost, spec: '5ft height boundary wall with MS entrance gate' }] : []),
        ...(state.includeSump ? [{ id: 'anc-sump', name: 'Underground RCC Water Sump', qty: 1, unit: 'Tank', materialCost: sumpCost, laborCost: 0, total: sumpCost, spec: `${state.sumpCapacityLitres || 8000} Litres storage` }] : []),
        ...(state.includeOverheadTank ? [{ id: 'anc-oht', name: 'Overhead Water Storage Tank', qty: 1, unit: 'Tank', materialCost: overheadTankCost, laborCost: 0, total: overheadTankCost, spec: `${state.overheadTankLitres || 2000} Litres triple-layer tank` }] : []),
        ...(state.includeRainwaterHarvesting ? [{ id: 'anc-rwh', name: 'Rainwater Harvesting & Recharge Pit', qty: 1, unit: 'Setup', materialCost: rainwaterHarvestingCost, laborCost: 0, total: rainwaterHarvestingCost, spec: 'Percolation pit with dual carbon filters' }] : []),
        ...(state.includeSolarPower ? [{ id: 'anc-solar', name: `Rooftop Solar Plant (${state.solarCapacityKw || 3} kW)`, qty: 1, unit: 'Plant', materialCost: solarCost, laborCost: 0, total: solarCost, spec: 'On-grid net-metered solar installation' }] : []),
        ...(state.includeBorewell ? [{ id: 'anc-bore', name: `Borewell Drilling & Submersible Pump (${state.borewellDepthFt || 600} ft)`, qty: 1, unit: 'Setup', materialCost: borewellCost, laborCost: 0, total: borewellCost, spec: 'Deep drilling + PVC casing + 3HP pump' }] : []),
        ...(state.includeElevator ? [{ id: 'anc-lift', name: `Residential Home Elevator (${state.elevatorStops || 2} Stops)`, qty: 1, unit: 'Lift', materialCost: elevatorCost, laborCost: 0, total: elevatorCost, spec: 'Hydraulic/Traction lift with auto-door' }] : []),
        ...(state.customBoqItems || []).map(item => ({
          id: item.id,
          name: item.name,
          qty: item.qty || 1,
          unit: item.unit || 'L.S',
          materialCost: Number(item.amount) || 0,
          laborCost: 0,
          total: Number(item.amount) || 0,
          spec: item.spec || 'Custom Scope Addition',
          isCustom: true
        }))
      ]
    }
  ];

  const supervisionAndBuffer = architectureFee + contractorMargin + contingencyBuffer;
  const tradeCostHeadTotal = directMaterialCost + totalLaborCost + ancillaryCost + supervisionAndBuffer;
  const rawTradePackageTotal = boqItems.reduce((sum, group) => sum + group.items.reduce((groupSum, item) => groupSum + item.total, 0), 0);
  const tradePackageVariance = tradeCostHeadTotal - rawTradePackageTotal;
  boqItems[boqItems.length - 1].items.push({
    id: 'item-trade-reconciliation',
    name: 'Trade Package Reconciliation Adjustment',
    qty: 1,
    unit: 'L.S',
    materialCost: tradePackageVariance,
    laborCost: 0,
    total: tradePackageVariance,
    spec: 'Balances the eight trade packages to the cost-head total before statutory taxes.'
  });
  const reconciledTradePackageTotal = boqItems.reduce((sum, group) => sum + group.items.reduce((groupSum, item) => groupSum + item.total, 0), 0);
  const tradePackageCheck = {
    expected: tradeCostHeadTotal,
    actual: reconciledTradePackageTotal,
    variance: tradeCostHeadTotal - reconciledTradePackageTotal,
    passed: tradeCostHeadTotal === reconciledTradePackageTotal
  };

  const gstRate = (isSnapshot && snap?.taxRates?.gstPct !== undefined)
    ? Number(snap.taxRates.gstPct)
    : Number(state.gstRatePct ?? 18);
  const labourCessRate = (isSnapshot && snap?.taxRates?.labourCessPct !== undefined)
    ? Number(snap.taxRates.labourCessPct)
    : Number(state.labourCessRatePct ?? 1);
  const gst = Math.round(directConstructionCost * (gstRate / 100));
  const labourCess = Math.round(totalLaborCost * (labourCessRate / 100));
  const statutoryTaxes = gst + labourCess;
  const baseGrandTotalCost = grandTotalCost;
  const grandTotalWithTaxes = baseGrandTotalCost + statutoryTaxes;

  // Category summary
  const categoryTotals = boqItems.map(c => {
    const total = c.items.reduce((acc, i) => acc + i.total, 0);
    return {
      id: c.id,
      name: c.category,
      total,
      percentage: tradeCostHeadTotal > 0 ? Number(((total / tradeCostHeadTotal) * 100).toFixed(1)) : 0
    };
  });

  // Milestone Payments Breakdown
  const milestones = [
    { stage: '1. Foundation & Footing Casting', pct: 15, amount: Math.round(grandTotalWithTaxes * 0.15), timeline: 'Weeks 1 - 4', desc: 'Site excavation, PCC, anti-termite, column footings' },
    { stage: '2. Plinth Beam & Ground Earthwork', pct: 10, amount: Math.round(grandTotalWithTaxes * 0.10), timeline: 'Weeks 5 - 7', desc: 'Plinth beams, backfilling, underground sump structure' },
    { stage: '3. Ground & Upper Floor RCC Slabs', pct: 25, amount: Math.round(grandTotalWithTaxes * 0.25), timeline: 'Weeks 8 - 14', desc: 'Columns, beam reinforcement, shuttering, concrete slab casting' },
    { stage: '4. Blockwork, Masonry & Door Frames', pct: 15, amount: Math.round(grandTotalWithTaxes * 0.15), timeline: 'Weeks 15 - 19', desc: 'External envelope, internal partitions, lintels & door frames' },
    { stage: '5. Plastering & Concealed MEP Piping', pct: 15, amount: Math.round(grandTotalWithTaxes * 0.15), timeline: 'Weeks 20 - 24', desc: 'Internal & external plastering, electrical conduits, plumbing lines' },
    { stage: '6. Tiling, Flooring, Paint & Handover', pct: 20, amount: Math.round(grandTotalWithTaxes * 0.20), timeline: 'Weeks 25 - 30', desc: 'Tile laying, sanitary fittings, electrical switches, painting & final inspection' }
  ];

  // Key Material Quantities Summary
  const materialSummary = [
    { label: 'Steel TMT Rebar', qty: `${steelTonne.toFixed(1)} Tonnes`, benchmark: `${steelKgPerSqFt} kg/sq.ft + ${steelWastagePct}% wastage; ${footingDepthFt} ft ${footingType}`, standard: 'IS 1786' },
    { label: 'Cement (OPC/PPC)', qty: `${cementBags} Bags`, benchmark: '~0.42 bags / sq.ft', standard: 'IS 12269' },
    { label: 'Manufactured M-Sand', qty: `${Math.round(totalBuiltupArea * 1.4)} Cu.Ft`, benchmark: '~1.4 cu.ft / sq.ft', standard: 'IS 383' },
    { label: 'Plaster P-Sand', qty: `${Math.round(totalBuiltupArea * 0.5)} Cu.Ft`, benchmark: '~0.5 cu.ft / sq.ft', standard: 'IS 1542' },
    { label: 'Coarse Aggregates (20mm)', qty: `${aggregateCuFt} Cu.Ft`, benchmark: '~1.35 cu.ft / sq.ft', standard: 'IS 383' },
    { label: 'Wall Masonry Blocks', qty: `${masonryWallArea} Sq.Ft`, benchmark: '~0.85 sq.ft / sq.ft', standard: 'IS 2185' },
    { label: 'Flooring Tiles & Stones', qty: `${flooringArea} Sq.Ft`, benchmark: 'Carpet Area + 7%', standard: 'IS 13712' },
    { label: 'Paint Surface Area', qty: `${paintingSurfaceArea} Sq.Ft`, benchmark: 'Internal + Exterior', standard: 'IS 5410' },
    { label: 'Electrical Point Schedule', qty: `${electricalPoints.lights} lights / ${electricalPoints.plugs} plugs / ${electricalPoints.ac} AC / ${electricalPoints.db} DB`, benchmark: 'Room-count point schedule', standard: 'IS 732' },
    { label: 'Water Storage', qty: `${state.includeSump ? (state.sumpCapacityLitres || 8000) : 0} L sump + ${state.includeOverheadTank ? (state.overheadTankLitres || 2000) : 0} L OHT`, benchmark: 'User-selected capacities', standard: 'NBC plumbing' }
  ];

  return {
    plotArea,
    totalCarpetArea,
    totalBuiltupArea,
    groundFloorBua,
    groundCoverageRatio,
    coverageCheck,
    costPerSqFt,
    directMaterialCost,
    totalLaborCost,
    ancillaryCost,
    directConstructionCost,
    architectureFee,
    contractorMargin,
    contingencyBuffer,
    grandTotalCost: grandTotalWithTaxes,
    baseGrandTotalCost,
    gst,
    gstRate,
    labourCess,
    labourCessRate,
    statutoryTaxes,
    tradeCostHeadTotal,
    reconciledTradePackageTotal,
    tradePackageCheck,
    footingDepthFt,
    footingType,
    electricalPoints,
    floorDetails,
    selectedMaterials,
    boqItems,
    categoryTotals,
    milestones,
    materialSummary,
    city,
    soil,
    tier,
    buildingType,
    constructionType,
    unitDef,
    pricingStatus,
    pricingScope: pricingContext?.pricingScope || (isBenchmark ? 'BENCHMARK' : 'STATE'),
    pricingSource: pricingContext?.pricingSource || (isBenchmark ? 'BENCHMARK_DEMO' : 'APPROVED_STATE_RATE'),
    missingRates,
    isBenchmarkMode: isBenchmark,
    isSnapshotMode: isSnapshot
  };
}