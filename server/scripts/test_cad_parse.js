const fs = require('fs');
const path = require('path');
const { parseDxfFallback } = require('../services/aiFloorplan/cadFallbackParser');

const dxfPath = path.resolve(__dirname, '../../floorplan-service/tests/fixtures/sample_floorplan.dxf');
console.log('Testing DXF parse on:', dxfPath);

if (!fs.existsSync(dxfPath)) {
  console.error('Fixture not found at:', dxfPath);
  process.exit(1);
}

const content = fs.readFileSync(dxfPath, 'utf8');
const result = parseDxfFallback(content, 'sample_floorplan.dxf');

console.log('Result success:', result.success);
console.log('Extracted rooms count:', result.rooms.length);
console.log('Total carpet area:', result.total_usable_carpet_sqft, 'sq.ft');
result.rooms.forEach((r, idx) => {
  console.log(`[Room ${idx + 1}] ${r.name} | ${r.width_ft} × ${r.length_ft} ft | ${r.area_sqft} sq.ft | Type: ${r.type}`);
});
