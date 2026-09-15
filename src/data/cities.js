export const CITIES = [
  { id: 'bangalore', name: 'Bengaluru (Bangalore)', state: 'Karnataka', multiplier: 1.00, zone: 'South', description: 'Base benchmark city' },
  { id: 'mumbai', name: 'Mumbai Metro', state: 'Maharashtra', multiplier: 1.22, zone: 'West', description: 'High labor & logistics' },
  { id: 'delhi-ncr', name: 'Delhi NCR (Gurugram/Noida)', state: 'Delhi NCR', multiplier: 1.08, zone: 'North', description: 'Metropolitan pricing' },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', multiplier: 0.96, zone: 'South', description: 'Competitive supply chain' },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', multiplier: 1.02, zone: 'South', description: 'Coastal moisture protection specs' },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', multiplier: 1.05, zone: 'West', description: 'Western corridor benchmark' },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', multiplier: 0.92, zone: 'East', description: 'Eastern regional benchmark' },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', multiplier: 0.95, zone: 'West', description: 'Western industrial hub' },
  { id: 'kochi', name: 'Kochi / Kerala', state: 'Kerala', multiplier: 1.10, zone: 'South', description: 'High rain/waterproofing specs' },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', multiplier: 0.91, zone: 'North', description: 'Stone availability advantage' },
  { id: 'chandigarh', name: 'Chandigarh / Mohali', state: 'Punjab/Haryana', multiplier: 1.04, zone: 'North', description: 'Northern benchmark' },
  { id: 'goa', name: 'Goa', state: 'Goa', multiplier: 1.15, zone: 'West', description: 'Coastal & logistics surcharge' },
  { id: 'custom', name: 'Other Tier 2/3 City', state: 'India', multiplier: 0.90, zone: 'National', description: 'General regional index' }
];

export const SOIL_TYPES = [
  { id: 'medium', name: 'Standard Medium Clay / Red Soil', sbc: '150-200 kN/m²', footingCostMult: 1.00, description: 'Standard isolated or combined footings' },
  { id: 'hard', name: 'Hard Gravel / Rocky Strata', sbc: '> 300 kN/m²', footingCostMult: 0.92, description: 'Shallow footings, minimal excavation cost' },
  { id: 'soft', name: 'Soft Black Cotton Soil / Loose Clay', sbc: '< 100 kN/m²', footingCostMult: 1.25, description: 'Requires deep pile or raft foundation & soil treatment' },
  { id: 'marshy', name: 'Filled-up / Low-lying Sandy Ground', sbc: '< 75 kN/m²', footingCostMult: 1.35, description: 'Requires extensive pile foundation, plinth beams, and grade slab' }
];