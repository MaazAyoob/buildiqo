const PriceResearchProvider = require('./PriceResearchProvider');

class OpenAIResearchProvider extends PriceResearchProvider {
  constructor() {
    super('openai');
    this.apiKey = (process.env.OPENAI_API_KEY || '').trim();
    this.model = (process.env.PRICE_RESEARCH_MODEL || '').trim();
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.length > 0 && this.model && this.model.length > 0);
  }

  getConfigurationError() {
    const missing = [];
    if (!this.apiKey) missing.push('OPENAI_API_KEY');
    if (!this.model) missing.push('PRICE_RESEARCH_MODEL');
    return `OpenAI Price Research is not configured. Missing required configuration: ${missing.join(', ')}.`;
  }

  async researchMaterialPrice({ material, state, city, locationScope = 'city', sourcePreferences = [], timeoutMs = 30000 }) {
    if (!this.isConfigured()) {
      throw new Error(this.getConfigurationError());
    }

    const locationStr = locationScope === 'city' && city && city !== 'All'
      ? `${city}, ${state}, India`
      : `${state}, India`;

    const prompt = `You are an expert Indian Construction Quantity Surveyor and Procurement Researcher.
Find the CURRENT market price of the following construction material in ${locationStr}:

Material Code: ${material.materialCode}
Material Name: ${material.name}
Category: ${material.category}
Canonical Unit: ${material.unit}
Specification / Grade: ${material.grade || 'Standard'}
Brand: ${material.brand || 'Any standard approved brand'}

CRITICAL INSTRUCTIONS:
1. Research current publicly available procurement / market rates in India for ${locationStr}.
2. DO NOT INVENT A PRICE. If no reliable price is found, return { "found": false, "reason": "NO_RELIABLE_PRICE_FOUND" }.
3. You must provide the ACTUAL source URL, source title, source publication date, and reported price.
4. Return JSON only.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are a civil engineering cost data research assistant. Always output strict JSON.' },
            { role: 'user', content: prompt }
          ]
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (!rawText) {
        throw new Error('OpenAI returned empty message content.');
      }

      const parsed = JSON.parse(rawText);
      if (!parsed.found || !parsed.sourcePrice) {
        return {
          found: false,
          reason: parsed.reason || 'NO_RELIABLE_PRICE_FOUND',
          provider: this.name,
          providerModel: this.model
        };
      }

      return {
        found: true,
        sourcePrice: Number(parsed.sourcePrice),
        sourceUnit: String(parsed.sourceUnit || material.unit).trim(),
        sourceName: String(parsed.sourceName || 'OpenAI Research Citation').trim(),
        sourceUrl: String(parsed.sourceUrl || '').trim(),
        sourceTitle: String(parsed.sourceTitle || '').trim(),
        sourcePublishedDate: String(parsed.sourcePublishedDate || '').trim(),
        sourceType: parsed.sourceType || 'other',
        currency: 'INR',
        taxIncluded: Boolean(parsed.taxIncluded),
        taxRateIfKnown: parsed.taxRateIfKnown ? Number(parsed.taxRateIfKnown) : null,
        taxStatus: parsed.taxStatus || 'unknown',
        freightIncluded: Boolean(parsed.freightIncluded),
        freightStatus: parsed.freightStatus || 'unknown',
        brand: parsed.brand || material.brand || '',
        grade: parsed.grade || material.grade || '',
        specification: parsed.specification || '',
        evidence: Array.isArray(parsed.evidence) && parsed.evidence.length > 0
          ? parsed.evidence
          : [{
              sourceName: String(parsed.sourceName || 'OpenAI Citation').trim(),
              sourceUrl: String(parsed.sourceUrl || '').trim(),
              sourceTitle: String(parsed.sourceTitle || '').trim(),
              sourcePublishedDate: String(parsed.sourcePublishedDate || '').trim(),
              reportedPrice: Number(parsed.sourcePrice),
              reportedUnit: String(parsed.sourceUnit || material.unit).trim(),
              sourceType: parsed.sourceType || 'other',
              taxStatus: parsed.taxStatus || 'unknown',
              freightStatus: parsed.freightStatus || 'unknown'
            }],
        provider: this.name,
        providerModel: this.model
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`OpenAI research timed out after ${timeoutMs}ms.`);
      }
      throw err;
    }
  }
}

module.exports = OpenAIResearchProvider;
