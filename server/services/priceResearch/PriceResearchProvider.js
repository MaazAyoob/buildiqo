/**
 * Abstract Base Class for Price Research Providers
 * All providers (Google Gemini, OpenAI, Mock) must implement researchMaterialPrice.
 */

class PriceResearchProvider {
  constructor(name = 'base') {
    this.name = name;
  }

  /**
   * Performs web / AI price research for a single material at a specified location.
   * @param {Object} params
   * @param {Object} params.material - Material document (code, name, category, unit, tier, grade, brand, desc)
   * @param {string} params.state - Indian State name
   * @param {string} params.city - Indian City name (or 'All')
   * @param {string} params.locationScope - 'city', 'state', or 'national'
   * @param {Array<string>} params.sourcePreferences - Array of preferred source classes
   * @param {number} params.timeoutMs - Maximum timeout in ms
   * @returns {Promise<Object>} Structured candidate research result
   */
  async researchMaterialPrice(params) {
    throw new Error(`Method researchMaterialPrice() must be implemented by provider [${this.name}].`);
  }

  /**
   * Check if provider has required credentials configured.
   * @returns {boolean}
   */
  isConfigured() {
    return false;
  }
}

module.exports = PriceResearchProvider;
