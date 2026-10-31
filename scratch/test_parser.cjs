const parser = require('../server/services/aiFloorplan/multiFormatFloorplanParser');
const assert = require('assert');

console.log('--- STARTING MULTI-FORMAT FLOORPLAN PARSER TESTS ---');

// 1. Test DXF
const dxfText = '0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n8\nWALLS\n70\n1\n10\n0\n20\n0\n10\n20\n20\n0\n10\n20\n20\n20\n10\n0\n20\n20\n0\nENDSEC\n0\nEOF';
const dxfRes = parser.parseFloorplan(dxfText, 'test.dxf');
assert.equal(dxfRes.success, true);
assert.equal(dxfRes.rooms.length, 1);
console.log('✓ 1. DXF Test PASSED:', dxfRes.rooms[0].name, dxfRes.rooms[0].area_sqft, 'sqft');

// 2. Test DWG
const dwgBuf = Buffer.from('AC1015_fake_binary_dwg_content_123456');
const dwgRes = parser.parseFloorplan(dwgBuf, 'test.dwg');
assert.equal(dwgRes.success, false);
assert.equal(dwgRes.isDwg, true);
console.log('✓ 2. DWG Test PASSED (Honest ODA check):', dwgRes.error.substring(0, 45) + '...');

// 3. Test Vector PDF
const pdfVectorText = '%PDF-1.4\n1 0 obj\n<< /Type /Page >>\nendobj\nstream\n100 100 200 300 re\n200 200 150 150 re\n300 300 180 200 re\nBT /F1 12 Tf (Living Room) Tj ET\nendstream\nendobj\n%%EOF';
const pdfRes = parser.parseFloorplan(Buffer.from(pdfVectorText), 'test.pdf');
assert.equal(pdfRes.success, true);
assert.equal(pdfRes.source.file_type, 'VECTOR_PDF');
console.log('✓ 3. Vector PDF Test PASSED:', pdfRes.rooms.length, 'rooms detected');

// 4. Test Scanned PDF
const pdfScanText = '%PDF-1.4\n1 0 obj\n<< /Type /Page /Subtype /Image /Width 1600 /Height 1200 >>\nendobj\n%%EOF';
const pdfScanRes = parser.parseFloorplan(Buffer.from(pdfScanText), 'scanned_plan.pdf');
assert.equal(pdfScanRes.success, true);
assert.equal(pdfScanRes.source.file_type, 'SCANNED_PDF');
assert.equal(pdfScanRes.confidence, 'ESTIMATED');
console.log('✓ 4. Scanned PDF Test PASSED:', pdfScanRes.rooms.length, 'rooms, confidence:', pdfScanRes.confidence);

// 5. Test Multi-Page PDF
const multiPagePdfText = '%PDF-1.4\n1 0 obj\n<< /Type /Page >>\nendobj\n2 0 obj\n<< /Type /Page >>\nendobj\n3 0 obj\n<< /Type /Page >>\nendobj\nstream\n100 100 200 300 re\n200 200 150 150 re\n300 300 180 200 re\nendstream\n%%EOF';
const multiPageRes = parser.parseFloorplan(Buffer.from(multiPagePdfText), 'multi_plan.pdf', { pageIndex: 1 });
assert.equal(multiPageRes.isMultiPage, true);
assert.equal(multiPageRes.pageCount, 3);
assert.equal(multiPageRes.selectedPage, 2);
console.log('✓ 5. Multi-Page PDF Test PASSED: Detected', multiPageRes.pageCount, 'pages, selected page:', multiPageRes.selectedPage);

// 6. Test Image (PNG)
const pngBuf = Buffer.alloc(32);
pngBuf.writeUInt8(0x89, 0);
pngBuf.write('PNG', 1);
pngBuf.writeUInt32BE(1920, 16);
pngBuf.writeUInt32BE(1080, 20);
const imgRes = parser.parseFloorplan(pngBuf, 'drawing.png');
assert.equal(imgRes.success, true);
assert.equal(imgRes.confidence, 'ESTIMATED');
console.log('✓ 6. PNG Image Test PASSED:', imgRes.rooms.length, 'rooms, resolution:', imgRes.source.image_resolution);

// 7. Test SVG
const svgText = '<svg viewBox="0 0 1000 800"><rect x="50" y="50" width="300" height="200" id="living" /><text x="60" y="80">Living Room</text></svg>';
const svgRes = parser.parseFloorplan(svgText, 'plan.svg');
assert.equal(svgRes.success, true);
assert.equal(svgRes.confidence, 'HIGH');
console.log('✓ 7. SVG Test PASSED:', svgRes.rooms[0].name, svgRes.rooms[0].area_sqft, 'sqft');

console.log('--- ALL MULTI-FORMAT TESTS PASSED! ---');

