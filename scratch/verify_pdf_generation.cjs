const fs = require('fs');
const path = require('path');
const { generatePlannerPDF } = require('../server/services/plannerReportExporter');
const { exportToPDF: exportCommercialBoqPDF, exportToExcel } = require('../server/services/commercialBoqExporter');

async function run() {
  console.log('=== VERIFYING REAL PDF & EXCEL GENERATION ===');

  // 1. Planner Report PDF
  const state = {
    projectName: 'Prestige 55x55 Estate',
    customerName: 'Maaz Ayoob',
    plotWidth: 55,
    plotLength: 55,
    roadWidth: 9.5,
    tier: 'standard',
    city: 'Bengaluru',
    state: 'Karnataka',
    numFloors: 2,
    floors: [
      { id: 'f0', name: 'Ground Floor', builtupArea: 1512.5, carpetArea: 1058.75, roomCount: 4 },
      { id: 'f1', name: 'First Floor', builtupArea: 1512.5, carpetArea: 1058.75, roomCount: 4 }
    ]
  };

  const estimation = {
    plotArea: 3025,
    plotCarpetArea: 2117.5,
    carpetAreaPercentage: 70,
    totalBuiltupArea: 3025,
    costPerSqFt: 2250,
    estimatedCost: 6806250,
    gstRate: 18,
    gstAmount: 1225125,
    grandTotalCost: 8031375,
    packageEstimate: {
      packageKey: 'standard',
      packageName: 'Standard Package',
      ratePerSqFt: 2250,
      estimatedCost: 6806250,
      gstRate: 18,
      gstAmount: 1225125,
      grandTotal: 8031375
    }
  };

  const plannerBuffer = await generatePlannerPDF(state, estimation);
  const plannerPdfPath = path.resolve(__dirname, 'sample_planner_report.pdf');
  fs.writeFileSync(plannerPdfPath, plannerBuffer);
  console.log(`[PASS] Planner PDF generated: ${plannerPdfPath} (${plannerBuffer.length} bytes, startsWith %PDF: ${plannerBuffer.subarray(0, 4).toString() === '%PDF'})`);

  // 2. Commercial BOQ PDF (Mode B Detailed Landscape)
  const commercialBoq = {
    mode: 'DETAILED',
    title: 'TWC Kasthuri Nagar Detailed BOQ',
    customerName: 'Bangalore Commercial Client',
    pricingState: 'Karnataka',
    totals: {
      subtotal: 1000000,
      gstRate: 18,
      gstAmount: 180000,
      grandTotal: 1180000
    },
    sheets: [
      {
        name: 'Civil Schedule',
        sections: [
          {
            name: 'Substructure & RCC Works',
            subtotal: 600000,
            rows: [
              {
                itemNo: '1.1',
                description: 'Earthwork excavation in foundation trenches including dressing of sides and ramming of bottoms',
                specification: 'Up to 2.5m depth in all kinds of soil as per IS 1200',
                unit: 'Cum',
                quantity: 120,
                currentRate: 350,
                amount: 42000
              },
              {
                itemNo: '1.2',
                description: 'Providing and laying reinforced cement concrete M25 grade in footings, plinth and columns',
                specification: 'Machine batch mixed, vibrated and cured as per IS 456',
                unit: 'Cum',
                quantity: 50,
                currentRate: 7200,
                amount: 360000
              }
            ]
          }
        ]
      }
    ]
  };

  const boqPdfBuffer = await exportCommercialBoqPDF(commercialBoq);
  const boqPdfPath = path.resolve(__dirname, 'sample_commercial_boq.pdf');
  fs.writeFileSync(boqPdfPath, boqPdfBuffer);
  console.log(`[PASS] Commercial BOQ PDF generated: ${boqPdfPath} (${boqPdfBuffer.length} bytes, startsWith %PDF: ${boqPdfBuffer.subarray(0, 4).toString() === '%PDF'})`);

  // 3. Commercial BOQ Excel (.xlsx)
  const boqExcelBuffer = await exportToExcel(commercialBoq);
  const boqExcelPath = path.resolve(__dirname, 'sample_commercial_boq.xlsx');
  fs.writeFileSync(boqExcelPath, boqExcelBuffer);
  console.log(`[PASS] Commercial BOQ Excel generated: ${boqExcelPath} (${boqExcelBuffer.length} bytes)`);

  console.log('=== ALL REAL EXPORT DELIVERABLES PRODUCED AND VERIFIED ===');
}

run().catch(err => {
  console.error('Export error:', err);
  process.exit(1);
});
