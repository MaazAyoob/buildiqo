/**
 * Buildiqo.AI - Phase 2.0 Room Program and Input Validator
 * Server-authoritative validation for plot parameters, floor bounds,
 * and canonical room type normalization.
 */

const CANONICAL_ROOM_TYPES = [
  'living',
  'dining',
  'kitchen',
  'master_bed',
  'regular_bed',
  'attached_bath',
  'common_bath',
  'puja',
  'utility',
  'balcony',
  'parking',
  'staircase',
  'office'
];

const ROOM_TYPE_SYNONYMS = {
  'living_room': 'living',
  'hall': 'living',
  'drawing': 'living',
  'lounge': 'living',
  'dining_room': 'dining',
  'kitchen': 'kitchen',
  'master_bedroom': 'master_bed',
  'main_bedroom': 'master_bed',
  'master': 'master_bed',
  'bedroom': 'regular_bed',
  'bed': 'regular_bed',
  'guest_room': 'regular_bed',
  'guest_bed': 'regular_bed',
  'washroom': 'common_bath',
  'toilet': 'common_bath',
  'bath': 'common_bath',
  'bathroom': 'common_bath',
  'attached_bathroom': 'attached_bath',
  'attached_bath': 'attached_bath',
  'ensuite': 'attached_bath',
  'pooja': 'puja',
  'pooja_room': 'puja',
  'puja_room': 'puja',
  'prayer_room': 'puja',
  'mandir': 'puja',
  'utility': 'utility',
  'wash_area': 'utility',
  'dry_balcony': 'utility',
  'balcony': 'balcony',
  'deck': 'balcony',
  'parking': 'parking',
  'car_parking': 'parking',
  'porch': 'parking',
  'garage': 'parking',
  'staircase': 'staircase',
  'stairs': 'staircase',
  'office': 'office',
  'study': 'office'
};

function normalizeRoomType(typeStr) {
  if (!typeStr || typeof typeStr !== 'string') return 'regular_bed';
  const clean = typeStr.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return ROOM_TYPE_SYNONYMS[clean] || (CANONICAL_ROOM_TYPES.includes(clean) ? clean : 'regular_bed');
}

function validateGenerationInput(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  const plotWidth = Number(body.plot_width_ft);
  const plotLength = Number(body.plot_length_ft);
  const numFloors = Number(body.num_floors !== undefined ? body.num_floors : 1);
  const setback = Number(body.setback_ft !== undefined ? body.setback_ft : 3.0);
  const facing = (body.plot_facing || 'north').trim().toLowerCase();

  // Dimension checks
  if (isNaN(plotWidth) || plotWidth < 15 || plotWidth > 300) {
    errors.push('plot_width_ft must be a number between 15 and 300 feet.');
  }
  if (isNaN(plotLength) || plotLength < 15 || plotLength > 300) {
    errors.push('plot_length_ft must be a number between 15 and 300 feet.');
  }

  // Setback checks
  if (isNaN(setback) || setback < 0 || setback > 20) {
    errors.push('setback_ft must be between 0 and 20 feet.');
  }

  // Floors check (1 to 5)
  if (isNaN(numFloors) || numFloors < 1 || numFloors > 5 || !Number.isInteger(numFloors)) {
    errors.push('num_floors must be an integer between 1 and 5.');
  }

  // Facing check
  const validFacings = ['north', 'south', 'east', 'west'];
  if (!validFacings.includes(facing)) {
    errors.push(`plot_facing must be one of: ${validFacings.join(', ')}.`);
  }

  // Rooms check
  let normalizedRooms = [];
  if (body.rooms_required !== undefined) {
    if (!Array.isArray(body.rooms_required)) {
      errors.push('rooms_required must be an array.');
    } else {
      let totalRequestedRooms = 0;
      for (const item of body.rooms_required) {
        if (!item || typeof item !== 'object' || !item.type) {
          errors.push('Each room in rooms_required must have a valid type.');
          continue;
        }
        const count = Number(item.count !== undefined ? item.count : 1);
        if (isNaN(count) || count < 1 || count > 10) {
          errors.push(`Room count for '${item.type}' must be between 1 and 10.`);
          continue;
        }
        totalRequestedRooms += count;
        normalizedRooms.push({
          type: normalizeRoomType(item.type),
          count
        });
      }

      if (totalRequestedRooms > 30) {
        errors.push('Maximum total requested rooms limit (30) exceeded.');
      }
    }
  } else {
    // Default standard rooms
    normalizedRooms = [
      { type: 'living', count: 1 },
      { type: 'kitchen', count: 1 },
      { type: 'master_bed', count: 1 },
      { type: 'common_bath', count: 1 }
    ];
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      plot_width_ft: plotWidth,
      plot_length_ft: plotLength,
      plot_facing: facing,
      num_floors: numFloors,
      setback_ft: setback,
      rooms_required: normalizedRooms,
      budget_tier: ['standard', 'premium', 'luxury'].includes((body.budget_tier || '').toLowerCase())
        ? body.budget_tier.toLowerCase()
        : 'standard',
      style_preference: String(body.style_preference || 'modern').trim().slice(0, 50),
      vastu_compliant: Boolean(body.vastu_compliant !== undefined ? body.vastu_compliant : true),
      seed: Number.isInteger(body.seed) ? body.seed : Math.floor(Math.random() * 100000)
    }
  };
}

module.exports = {
  CANONICAL_ROOM_TYPES,
  normalizeRoomType,
  validateGenerationInput
};
