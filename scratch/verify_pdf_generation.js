import fs from 'fs';
import { generatePlannerPDF } from '../server/services/plannerReportExporter.js';
import { exportToPDF as exportCommercialBoqPDF } from '../server/services/commercialBoqExporter.js';

async function main() {
  console.log('Generating sample Planner PDF...');
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
  fs.writeFileSync('./scratch/sample_planner_report.pdf', plannerBuffer);
  console.log(`Planner PDF saved (${plannerBuffer.length} bytes). Starts with: ${plannerBuffer.subarray(0, 4).toString()}`);

  console.log('Generating sample Commercial BOQ PDF...');
  const commercialBoq = {
    mode: 'DETAILED',
    title: 'TWC Kasthuri Nagar Commercial BOQ',
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
                description: 'Earthwork excavation in foundation trenches in all kinds of soil',
                specification: 'Up to 2.5m depth including dressing of sides and ramming of bottoms as per IS 1200',
                unit: 'Cum',
                quantity: 120,
                currentRate: 350,
                amount: 42000
              },
              {
                itemNo: '1.2',
                description: 'Providing and laying reinforced cement concrete M25 grade in footings, plinth and columns',
                specification: 'Machine batch mixed, vibrated and cured for 14 days as per IS 456',
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

  const boqBuffer = await exportCommercialBoqPDF(commercialBoq);
  fs.writeFileSync('./scratch/sample_commercial_boq.pdf', boqBuffer);
  console.log(`Commercial BOQ PDF saved (${boqBuffer.length} bytes). Starts with: ${boqBuffer.subarray(0, 4).toString()}`);
}

main().catch(err => {
  console.error('PDF generation error:', err);
  process.exit(1);
});
