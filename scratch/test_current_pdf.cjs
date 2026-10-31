const fs = require('fs');
const path = require('path');
const { generatePlannerPDF } = require('../server/services/plannerReportExporter');

async function testCurrent() {
  const state = {
    projectName: 'Bangalore Luxury Residence',
    customerName: 'High Net Worth Client',
    plotWidth: 55,
    plotLength: 55,
    roadWidth: 30,
    tier: 'standard',
    city: 'Bengaluru',
    state: 'Karnataka',
    numFloors: 2,
    floors: [
      { id: 'floor-0', name: 'Ground Floor', builtupArea: 3025, carpetArea: 2117.5, roomCount: 9 },
      { id: 'floor-1', name: '1st Floor', builtupArea: 3025, carpetArea: 2117.5, roomCount: 8 }
    ]
  };

  const estimation = {
    plotArea: 3025,
    plotCarpetArea: 4235,
    carpetAreaPercentage: 70,
    totalBuiltupArea: 6050,
    costPerSqFt: 2250,
    estimatedCost: 13612500,
    gstRate: 18,
    gstAmount: 2450250,
    grandTotalCost: 16062750,
    packageEstimate: {
      packageKey: 'standard',
      packageName: 'Standard Package',
      ratePerSqFt: 2250,
      estimatedCost: 13612500,
      gstRate: 18,
      gstAmount: 2450250,
      grandTotal: 16062750
    },
    floors: [
      { name: 'Ground Floor', builtupArea: 3025, carpetArea: 2117.5, roomCount: 9 },
      { name: '1st Floor', builtupArea: 3025, carpetArea: 2117.5, roomCount: 8 }
    ]
  };

  const pdfBuffer = await generatePlannerPDF(state, estimation);
  fs.writeFileSync(path.join(__dirname, 'test_output_current.pdf'), pdfBuffer);
  console.log(`Generated PDF: ${pdfBuffer.length} bytes`);
}

testCurrent().catch(console.error);

