const PriceResearchProvider = require('./PriceResearchProvider');

class GoogleSearchResearchProvider extends PriceResearchProvider {
  constructor() {
    super('google');
    this.apiKey = (process.env.GOOGLE_GEMINI_API_KEY || '').trim();
    this.model = (process.env.PRICE_RESEARCH_MODEL || '').trim();
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.length > 0 && this.model && this.model.length > 0);
  }

  getConfigurationError() {
    const missing = [];
    if (!this.apiKey) missing.push('GOOGLE_GEMINI_API_KEY');
    if (!this.model) missing.push('PRICE_RESEARCH_MODEL');
    return `Google Gemini Price Research is not configured. Missing required configuration: ${missing.join(', ')}.`;
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
Tier: ${material.tier || 'standard'}

Source Preferences: ${sourcePreferences.length > 0 ? sourcePreferences.join(', ') : 'Government publications, Manufacturers, Authorized dealers, Market publications, Construction marketplaces'}

CRITICAL INSTRUCTIONS:
1. Research current publicly available procurement / market rates in India for ${locationStr}.
2. DO NOT INVENT A PRICE. If no reliable price is found, you MUST return { "found": false, "reason": "NO_RELIABLE_PRICE_FOUND" }.
3. You must provide the ACTUAL source URL, source title, source publication date, and reported price.
4. Distinguish clearly between GST inclusive and exclusive, and freight status.
5. If the source reports in tonnes, metric tons, quintals, or bags, record the exact sourcePrice and sourceUnit.
6. Provide up to 3 independent sources if available.

Return your response strictly as valid JSON matching this schema:
{
  "found": true,
  "sourcePrice": 72000,
  "sourceUnit": "tonne",
  "sourceName": "Name of supplier or publication",
  "sourceUrl": "https://...",
  "sourceTitle": "Title of source page",
  "sourcePublishedDate": "2026-09-01",
  "sourceType": "manufacturer" | "authorized_dealer" | "market_publication" | "government" | "marketplace" | "commercial" | "other",
  "currency": "INR",
  "taxIncluded": false,
  "taxRateIfKnown": 18,
  "taxStatus": "exclusive" | "inclusive" | "unknown",
  "freightIncluded": false,
  "freightStatus": "excluded" | "included" | "unknown",
  "brand": "${material.brand || ''}",
  "grade": "${material.grade || ''}",
  "specification": "${material.grade || material.name}",
  "evidence": [
    {
      "sourceName": "...",
      "sourceUrl": "https://...",
      "sourceTitle": "...",
      "sourcePublishedDate": "...",
      "reportedPrice": 72000,
      "reportedUnit": "tonne",
      "sourceType": "manufacturer",
      "taxStatus": "exclusive",
      "freightStatus": "excluded"
    }
  ]
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Google Gemini returned empty candidate response.');
      }

      let parsed;
      try {
        parsed = JSON.parse(rawText.trim());
      } catch (err) {
        // Try extracting JSON block if wrapped in markdown
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error(`Malformed JSON returned by Google Gemini: ${rawText.slice(0, 200)}`);
        }
      }

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
        sourceName: String(parsed.sourceName || 'Web Citation').trim(),
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
          ? parsed.evidence.map(e => ({
              sourceName: String(e.sourceName || '').trim(),
              sourceUrl: String(e.sourceUrl || '').trim(),
              sourceTitle: String(e.sourceTitle || '').trim(),
              sourcePublishedDate: String(e.sourcePublishedDate || '').trim(),
              reportedPrice: Number(e.reportedPrice || parsed.sourcePrice),
              reportedUnit: String(e.reportedUnit || parsed.sourceUnit).trim(),
              sourceType: e.sourceType || parsed.sourceType || 'other',
              taxStatus: e.taxStatus || parsed.taxStatus || 'unknown',
              freightStatus: e.freightStatus || parsed.freightStatus || 'unknown'
            }))
          : [{
              sourceName: String(parsed.sourceName || 'Web Citation').trim(),
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
        throw new Error(`Google Gemini research timed out after ${timeoutMs}ms.`);
      }
      throw err;
    }
  }
}

module.exports = GoogleSearchResearchProvider;
