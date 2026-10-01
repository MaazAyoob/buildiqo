import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StepReport } from './src/components/planner/StepReport.jsx';
import { INITIAL_PROJECT_STATE } from './src/data/defaults.js';
import { calculateEstimation } from './src/utils/calculator.js';

console.log('Testing StepReport component resilience...');

// Test 1: Normal estimate from defaults
try {
  const normalState = JSON.parse(JSON.stringify(INITIAL_PROJECT_STATE));
  const normalEstimation = calculateEstimation(normalState);
  const html1 = renderToStaticMarkup(
    React.createElement(StepReport, { state: normalState, estimation: normalEstimation })
  );
  console.log('Test 1 PASS: Normal estimate rendered successfully, length:', html1.length);
  if (!html1.includes('PDF') || !html1.includes('Excel') || !html1.includes('WhatsApp')) {
    throw new Error('Export buttons missing from rendered output!');
  }
  console.log('Test 1 PASS: PDF, Excel, and WhatsApp export buttons present.');
} catch (err) {
  console.error('Test 1 FAIL:', err);
  process.exit(1);
}

// Test 2: Incomplete / undefined estimation
try {
  const html2 = renderToStaticMarkup(
    React.createElement(StepReport, { state: {}, estimation: undefined })
  );
  console.log('Test 2 PASS: undefined estimation rendered without crashing, length:', html2.length);
} catch (err) {
  console.error('Test 2 FAIL:', err);
  process.exit(1);
}

// Test 3: Empty object estimation
try {
  const html3 = renderToStaticMarkup(
    React.createElement(StepReport, { state: {}, estimation: {} })
  );
  console.log('Test 3 PASS: empty estimation rendered without crashing, length:', html3.length);
} catch (err) {
  console.error('Test 3 FAIL:', err);
  process.exit(1);
}

// Test 4: Missing coverageCheck & tradePackageCheck
try {
  const html4 = renderToStaticMarkup(
    React.createElement(StepReport, {
      state: { floors: [{ id: 'f1', name: 'Ground', rooms: [] }] },
      estimation: {
        grandTotalCost: 5000000,
        totalBuiltupArea: 2000,
        coverageCheck: undefined,
        tradePackageCheck: undefined,
        floorDetails: undefined,
        boqItems: undefined,
        milestones: undefined,
        materialSummary: undefined
      }
    })
  );
  console.log('Test 4 PASS: Partial/legacy estimation rendered without crashing, length:', html4.length);
} catch (err) {
  console.error('Test 4 FAIL:', err);
  process.exit(1);
}

console.log('ALL TESTS PASSED SUCCESSFULLY!');
