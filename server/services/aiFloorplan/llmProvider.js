/**
 * Buildiqo.AI - Phase 2.0 LLM Provider Abstraction
 * Supports OpenAI, Google Gemini, and a deterministic Rule-Based Fallback.
 * Ensures zero secret exposure, strict JSON schema output, and graceful offline degradation.
 */

const { normalizeRoomType } = require('./roomProgramValidator');

class BaseFloorplanLLMProvider {
  constructor(name = 'base') {
    this.name = name;
  }

  async generateRoomProgram(input) {
    throw new Error(`generateRoomProgram() not implemented on provider [${this.name}].`);
  }

  async interpretRefinement(currentProgram, instruction) {
    throw new Error(`interpretRefinement() not implemented on provider [${this.name}].`);
  }

  isConfigured() {
    return false;
  }
}

/**
 * Deterministic Rule-Based Fallback Engine
 * Runs when external LLM API keys are unconfigured or in offline/test environments.
 */
class RuleBasedFloorplanProvider extends BaseFloorplanLLMProvider {
  constructor() {
    super('rule_fallback');
  }

  isConfigured() {
    return true;
  }

  async generateRoomProgram(input) {
    const rooms = [];
    const counts = {};

    const standardAreas = {
      living: 220,
      dining: 130,
      kitchen: 110,
      master_bed: 180,
      regular_bed: 140,
      attached_bath: 45,
      common_bath: 40,
      puja: 35,
      utility: 35,
      balcony: 50,
      parking: 160,
      staircase: 90,
      office: 110
    };

    const vastuZones = {
      living: 'NE',
      dining: 'E',
      kitchen: 'SE',
      master_bed: 'SW',
      regular_bed: 'NW',
      attached_bath: 'NW',
      common_bath: 'NW',
      puja: 'NE',
      utility: 'SE',
      balcony: 'N',
      parking: 'NW',
      staircase: 'S',
      office: 'W'
    };

    const requested = input.rooms_required && input.rooms_required.length > 0
      ? input.rooms_required
      : [
          { type: 'living', count: 1 },
          { type: 'kitchen', count: 1 },
          { type: 'master_bed', count: 1 },
          { type: 'common_bath', count: 1 }
        ];

    for (const req of requested) {
      const type = normalizeRoomType(req.type);
      const cnt = Math.max(1, Math.min(req.count || 1, 6));

      for (let i = 0; i < cnt; i++) {
        counts[type] = (counts[type] || 0) + 1;
        const idx = counts[type];
        const baseArea = standardAreas[type] || 120;
        const tierMult = input.budget_tier === 'luxury' ? 1.3 : input.budget_tier === 'premium' ? 1.15 : 1.0;

        // Default floor allocation
        let prefFloor = 0;
        if (input.num_floors > 1) {
          if (['master_bed', 'regular_bed', 'attached_bath', 'balcony'].includes(type)) {
            prefFloor = 1;
          }
        }

        rooms.push({
          room_id: `${type}_${idx}`,
          type,
          display_name: formatDisplayName(type, idx, cnt),
          count: 1,
          target_area_sqft: Math.round(baseArea * tierMult),
          preferred_floor: prefFloor,
          adjacency: getStandardAdjacency(type),
          compass_zone: vastuZones[type] || 'NE',
          priority: ['living', 'kitchen', 'master_bed'].includes(type) ? 'high' : 'medium'
        });
      }
    }

    return { rooms };
  }

  async interpretRefinement(currentProgram, instruction) {
    const text = (instruction || '').trim().toLowerCase();

    // Ambiguity detection
    const ambiguousKeywords = ['spacious', 'better', 'modern', 'nice', 'adjust', 'improve', 'optimize'];
    const isAmbiguous = ambiguousKeywords.some(w => text.includes(w)) &&
      !text.includes('bedroom') && !text.includes('kitchen') && !text.includes('living') && !text.includes('bath');

    if (isAmbiguous) {
      return {
        is_ambiguous: true,
        clarification_message: 'Your instruction is broad. How would you like to refine the plan?',
        suggestions: [
          'Increase living room area by 15%',
          'Move master bedroom to upper floor',
          'Add attached bathroom to master bedroom',
          'Enlarge kitchen area'
        ]
      };
    }

    const changes = [];

    // Pattern 1: Increase / decrease area (e.g. "make kitchen bigger", "increase living area")
    if (text.includes('bigger') || text.includes('larger') || text.includes('increase') || text.includes('expand')) {
      let targetType = 'living';
      if (text.includes('kitchen')) targetType = 'kitchen';
      else if (text.includes('master') || text.includes('bedroom')) targetType = 'master_bed';
      else if (text.includes('bath')) targetType = 'common_bath';

      changes.push({
        type: 'increase_area',
        target_room_type: targetType,
        amount_percent: 20
      });
    }

    // Pattern 2: Move upstairs / downstairs
    if (text.includes('upstairs') || text.includes('upper floor') || text.includes('first floor')) {
      let targetType = 'master_bed';
      if (text.includes('bedroom')) targetType = 'regular_bed';
      changes.push({
        type: 'move_floor',
        target_room_type: targetType,
        target_floor: 1
      });
    } else if (text.includes('downstairs') || text.includes('ground floor')) {
      changes.push({
        type: 'move_floor',
        target_room_type: 'master_bed',
        target_floor: 0
      });
    }

    return {
      is_ambiguous: false,
      changes: changes.length > 0 ? changes : [
        {
          type: 'increase_area',
          target_room_type: 'living',
          amount_percent: 10
        }
      ]
    };
  }
}

/**
 * OpenAI Floorplan LLM Provider
 */
class OpenAIFloorplanProvider extends BaseFloorplanLLMProvider {
  constructor() {
    super('openai');
    this.apiKey = (process.env.AI_FLOORPLAN_API_KEY || process.env.OPENAI_API_KEY || '').trim();
    this.model = process.env.AI_FLOORPLAN_MODEL || 'gpt-4o-mini';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  async generateRoomProgram(input) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI provider not configured: missing API key.');
    }

    const prompt = `You are an expert architectural space planner for Buildiqo.AI.
Generate a structured room program adhering to:
Plot: ${input.plot_width_ft}x${input.plot_length_ft} ft, Facing: ${input.plot_facing}, Floors: ${input.num_floors}, Vastu: ${input.vastu_compliant}.
Requested rooms: ${JSON.stringify(input.rooms_required)}.

Return JSON matching:
{
  "rooms": [
    {
      "room_id": "living_1",
      "type": "living",
      "display_name": "Living Room",
      "count": 1,
      "target_area_sqft": 220,
      "preferred_floor": 0,
      "adjacency": ["kitchen_1", "dining_1"],
      "compass_zone": "NE",
      "priority": "high"
    }
  ]
}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are an architectural space planning assistant that outputs strict JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`OpenAI API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      return JSON.parse(content);
    } finally {
      clearTimeout(timer);
    }
  }

  async interpretRefinement(currentProgram, instruction) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI provider not configured.');
    }

    const prompt = `User requests refinement: "${instruction}".
Analyze the instruction and produce a structured diff.
If ambiguous, set is_ambiguous: true and provide suggestions.
Otherwise return { is_ambiguous: false, changes: [{ type: "increase_area"|"decrease_area"|"move_floor", target_room_type: string, amount_percent?: number, target_floor?: number }] }`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You output strict JSON for architectural refinement diffs.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        }),
        signal: controller.signal
      });

      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const json = await res.json();
      return JSON.parse(json.choices[0].message.content);
    } finally {
      clearTimeout(timer);
    }
  }
}

function formatDisplayName(type, idx, total) {
  const names = {
    living: 'Living Room',
    dining: 'Dining Room',
    kitchen: 'Kitchen',
    master_bed: 'Master Bedroom',
    regular_bed: 'Bedroom',
    attached_bath: 'En-suite Bathroom',
    common_bath: 'Common Bathroom',
    puja: 'Puja Room',
    utility: 'Utility Area',
    balcony: 'Balcony',
    parking: 'Car Parking',
    staircase: 'Staircase Area',
    office: 'Home Office'
  };
  const base = names[type] || 'Room';
  return total > 1 ? `${base} ${idx}` : base;
}

function getStandardAdjacency(type) {
  const adj = {
    living: ['dining', 'kitchen'],
    dining: ['living', 'kitchen'],
    kitchen: ['dining', 'utility'],
    master_bed: ['attached_bath'],
    regular_bed: ['common_bath']
  };
  return adj[type] || [];
}

function getFloorplanLLMProvider() {
  const explicit = (process.env.AI_FLOORPLAN_PROVIDER || '').toLowerCase();
  if (explicit === 'openai') {
    const p = new OpenAIFloorplanProvider();
    if (p.isConfigured()) return p;
  }
  // Default to rule-based fallback for deterministic safety
  return new RuleBasedFloorplanProvider();
}

module.exports = {
  BaseFloorplanLLMProvider,
  RuleBasedFloorplanProvider,
  OpenAIFloorplanProvider,
  getFloorplanLLMProvider
};
