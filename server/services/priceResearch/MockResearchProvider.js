const PriceResearchProvider = require('./PriceResearchProvider');

class MockResearchProvider extends PriceResearchProvider {
  constructor(customResponses = {}) {
    super('mock');
    this.customResponses = customResponses;
  }

  isConfigured() {
    return true; // Mock is always ready for test harnesses
  }

  async researchMaterialPrice({ material, state, city, locationScope = 'city', sourcePreferences = [] }) {
    // If a custom override exists for this materialCode, use it
    if (this.customResponses[material.materialCode]) {
      const resp = this.customResponses[material.materialCode];
      if (resp.error) throw new Error(resp.error);
      return resp;
    }

    const locLabel = locationScope === 'city' && city && city !== 'All' ? `${city}, ${state}` : state;
    const code = material.materialCode;

    // Realistic deterministic rates for tests
    let basePrice = 100;
    let sourceUnit = material.unit;
    let sourceName = 'IndiaMart Construction Directory';
    let sourceType = 'marketplace';
    let sourceUrl = `https://www.indiamart.com/proddetail/${encodeURIComponent(code.toLowerCase())}.html`;

    if (code.includes('STEEL') || code.includes('TMT')) {
      // Return in metric tonnes to test deterministic normalization (tonne -> kg)
      basePrice = 71000;
      sourceUnit = 'tonne';
      sourceName = 'SAIL / Tata Tiscon Authorized Regional Depot';
      sourceType = 'manufacturer';
      sourceUrl = 'https://www.tatatiscon.co.in/price-list-uttar-pradesh';
    } else if (code.includes('CEMENT')) {
      basePrice = 385;
      sourceUnit = 'bag';
      sourceName = 'UltraTech Building Solutions Depot';
      sourceType = 'authorized_dealer';
      sourceUrl = 'https://www.ultratechcement.com/dealer-locator/varanasi';
    } else if (code.includes('SAND') || code.includes('AGGREGATE')) {
      basePrice = 52;
      sourceUnit = material.unit;
      sourceName = 'Regional Mining & Quarry Board Published Schedule';
      sourceType = 'government';
      sourceUrl = 'https://upmines.gov.in/district-rates-varanasi';
    } else if (code.includes('BRICK') || code.includes('BLOCK')) {
      basePrice = 9.5;
      sourceUnit = material.unit;
      sourceName = 'Varanasi Brick Kiln Association';
      sourceType = 'market_publication';
      sourceUrl = 'https://upbka.org/regional-kiln-rates';
    }

    return {
      found: true,
      sourcePrice: basePrice,
      sourceUnit,
      sourceName,
      sourceUrl,
      sourceTitle: `${material.name} Procurement Price Schedule - ${locLabel}`,
      sourcePublishedDate: '2026-09-10',
      sourceType,
      currency: 'INR',
      taxIncluded: false,
      taxRateIfKnown: 18,
      taxStatus: 'exclusive',
      freightIncluded: false,
      freightStatus: 'excluded',
      deliveryIncluded: true,
      deliveryStatus: 'included',
      minimumOrderQuantity: '10 MT',
      brand: material.brand || 'Standard',
      grade: material.grade || 'Standard',
      specification: `${material.grade || ''} ${material.name}`.trim(),
      evidence: [
        {
          sourceName,
          sourceUrl,
          sourceTitle: `${material.name} Procurement Price Schedule - ${locLabel}`,
          sourcePublishedDate: '2026-09-10',
          reportedPrice: basePrice,
          reportedUnit: sourceUnit,
          sourceType,
          taxStatus: 'exclusive',
          freightStatus: 'excluded'
        },
        {
          sourceName: 'National Building Material Price Index',
          sourceUrl: 'https://nbmpi.gov.in/current-rates',
          sourceTitle: 'National Construction Index 2026',
          sourcePublishedDate: '2026-09-08',
          reportedPrice: basePrice * 1.02,
          reportedUnit: sourceUnit,
          sourceType: 'government',
          taxStatus: 'exclusive',
          freightStatus: 'excluded'
        }
      ],
      provider: this.name,
      providerModel: 'mock-deterministic-v1'
    };
  }
}

module.exports = MockResearchProvider;
