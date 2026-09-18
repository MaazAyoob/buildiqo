/**
 * Buildiqo.AI - Phase 2.0 AI Floor Plan Service
 * Orchestrates input validation, LLM room program generation,
 * Python geometry solver communication, and natural language refinement.
 */

const { validateGenerationInput } = require('./roomProgramValidator');
const { getFloorplanLLMProvider } = require('./llmProvider');

// In-memory cache for recent generation sessions (supports regeneration and refinement)
const generationCache = new Map();

function getPythonServiceUrl() {
  return (process.env.FLOORPLAN_SERVICE_URL || 'http://127.0.0.1:5001').replace(/\/+$/, '');
}

function getServiceHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.FLOORPLAN_SERVICE_TOKEN) {
    headers['X-Floorplan-Service-Token'] = process.env.FLOORPLAN_SERVICE_TOKEN;
  }
  return headers;
}

class AIFloorplanService {
  /**
   * Primary generation pipeline:
   * Input -> LLM Room Program -> Python Constraint Solver -> SVG & Geometry
   */
  async generateFloorplan(userInput) {
    const validation = validateGenerationInput(userInput);
    if (!validation.isValid) {
      const err = new Error(validation.errors.join(' '));
      err.statusCode = 400;
      throw err;
    }

    const sanitized = validation.sanitized;
    const provider = getFloorplanLLMProvider();

    // 1. Generate structured room program via LLM or rule fallback
    let roomProgram;
    try {
      roomProgram = await provider.generateRoomProgram(sanitized);
    } catch (llmErr) {
      console.warn('LLM provider failed, falling back to rule-based engine:', llmErr.message);
      const { RuleBasedFloorplanProvider } = require('./llmProvider');
      const fallback = new RuleBasedFloorplanProvider();
      roomProgram = await fallback.generateRoomProgram(sanitized);
    }

    // 2. Call Python FastAPI microservice solver
    const solverPayload = {
      plot_width_ft: sanitized.plot_width_ft,
      plot_length_ft: sanitized.plot_length_ft,
      plot_facing: sanitized.plot_facing,
      num_floors: sanitized.num_floors,
      setback_ft: sanitized.setback_ft,
      rooms_required: sanitized.rooms_required,
      budget_tier: sanitized.budget_tier,
      style_preference: sanitized.style_preference,
      vastu_compliant: sanitized.vastu_compliant,
      seed: sanitized.seed
    };

    const pyUrl = `${getPythonServiceUrl()}/generate-layout`;
    const controller = new AbortController();
    const timeoutMs = parseInt(process.env.FLOORPLAN_SERVICE_TIMEOUT_MS, 10) || 30000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let pyRes;
    try {
      pyRes = await fetch(pyUrl, {
        method: 'POST',
        headers: getServiceHeaders(),
        body: JSON.stringify(solverPayload),
        signal: controller.signal
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      if (fetchErr.name === 'AbortError') {
        const err = new Error('Geometry solver timed out.');
        err.statusCode = 504;
        throw err;
      }
      const err = new Error(`Floor plan microservice unavailable (${fetchErr.message}).`);
      err.statusCode = 503;
      throw err;
    } finally {
      clearTimeout(timer);
    }

    const pyData = await pyRes.json().catch(() => ({}));
    if (!pyRes.ok) {
      const err = new Error(pyData.detail?.message || pyData.detail || 'Geometry solver failed.');
      err.statusCode = pyRes.status || 422;
      err.details = pyData.detail;
      throw err;
    }

    // 3. Cache session for subsequent refine/regenerate
    const genId = pyData.generation_id;
    generationCache.set(genId, {
      request: sanitized,
      roomProgram,
      response: pyData,
      createdAt: Date.now()
    });

    // Prune stale cache entries (> 1 hour)
    if (generationCache.size > 200) {
      const now = Date.now();
      for (const [k, v] of generationCache.entries()) {
        if (now - v.createdAt > 3600000) generationCache.delete(k);
      }
    }

    return pyData;
  }

  /**
   * Regenerates layout using identical requirements but a NEW deterministic seed.
   */
  async regenerateFloorplan(generationId, overrideSeed) {
    const cached = generationCache.get(generationId);
    let baseRequest;

    if (cached) {
      baseRequest = { ...cached.request };
    } else {
      baseRequest = {
        plot_width_ft: 30,
        plot_length_ft: 40,
        plot_facing: 'north',
        num_floors: 1,
        setback_ft: 3,
        rooms_required: [
          { type: 'living', count: 1 },
          { type: 'kitchen', count: 1 },
          { type: 'master_bed', count: 1 },
          { type: 'common_bath', count: 1 }
        ]
      };
    }

    // New seed to ensure variation
    baseRequest.seed = Number.isInteger(overrideSeed) ? overrideSeed : Math.floor(Math.random() * 100000) + 1;
    return this.generateFloorplan(baseRequest);
  }

  /**
   * Refinement pipeline:
   * Natural Language -> LLM Structured Diff -> Program Update -> Solver Re-run
   */
  async refineFloorplan(generationId, instruction) {
    if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
      const err = new Error('Refinement instruction cannot be empty.');
      err.statusCode = 400;
      throw err;
    }

    const cached = generationCache.get(generationId);
    if (!cached) {
      const err = new Error('Generation session expired or not found. Please generate a new layout first.');
      err.statusCode = 404;
      throw err;
    }

    const provider = getFloorplanLLMProvider();
    const refinement = await provider.interpretRefinement(cached.roomProgram, instruction);

    // If instruction is ambiguous, return clarification questions
    if (refinement.is_ambiguous) {
      return {
        success: false,
        is_ambiguous: true,
        clarification_message: refinement.clarification_message,
        suggestions: refinement.suggestions || []
      };
    }

    // Apply structured changes to cached room request
    const updatedReq = { ...cached.request };
    const updatedRooms = [...updatedReq.rooms_required];

    for (const change of (refinement.changes || [])) {
      if (change.type === 'increase_area') {
        const targetType = change.target_room_type || 'living';
        const existing = updatedRooms.find(r => r.type === targetType);
        if (existing) {
          // Increase count or scale
          existing.count = Math.min(existing.count + 1, 5);
        } else {
          updatedRooms.push({ type: targetType, count: 1 });
        }
      } else if (change.type === 'move_floor') {
        updatedReq.num_floors = Math.max(updatedReq.num_floors, (change.target_floor || 1) + 1);
      }
    }

    updatedReq.rooms_required = updatedRooms;
    updatedReq.seed = (cached.request.seed || 42) + 13;

    return this.generateFloorplan(updatedReq);
  }

  /**
   * Fetches DXF export from the Python floorplan microservice.
   */
  async getFloorplanDxf(generationId, floor = 0) {
    const cached = generationCache.get(generationId);
    if (!cached) {
      const err = new Error('Generation session not found or expired.');
      err.statusCode = 404;
      throw err;
    }

    const pyUrl = `${getPythonServiceUrl()}/export/dxf?floor=${floor}`;
    const pyRes = await fetch(pyUrl, {
      method: 'POST',
      headers: getServiceHeaders(),
      body: JSON.stringify(cached.response)
    });

    if (!pyRes.ok) {
      const err = new Error(`DXF export failed: HTTP ${pyRes.status}`);
      err.statusCode = pyRes.status;
      throw err;
    }

    return Buffer.from(await pyRes.arrayBuffer());
  }
}

module.exports = new AIFloorplanService();
