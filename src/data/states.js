/**
 * Indian States & Union Territories Catalog for Frontend UI (28 States + 8 UTs)
 */

export const INDIAN_STATES = [
  { id: 'andhra_pradesh', code: 'AP', name: 'Andhra Pradesh' },
  { id: 'arunachal_pradesh', code: 'AR', name: 'Arunachal Pradesh' },
  { id: 'assam', code: 'AS', name: 'Assam' },
  { id: 'bihar', code: 'BR', name: 'Bihar' },
  { id: 'chhattisgarh', code: 'CG', name: 'Chhattisgarh' },
  { id: 'goa', code: 'GA', name: 'Goa' },
  { id: 'gujarat', code: 'GJ', name: 'Gujarat' },
  { id: 'haryana', code: 'HR', name: 'Haryana' },
  { id: 'himachal_pradesh', code: 'HP', name: 'Himachal Pradesh' },
  { id: 'jharkhand', code: 'JH', name: 'Jharkhand' },
  { id: 'karnataka', code: 'KA', name: 'Karnataka' },
  { id: 'kerala', code: 'KL', name: 'Kerala' },
  { id: 'madhya_pradesh', code: 'MP', name: 'Madhya Pradesh' },
  { id: 'maharashtra', code: 'MH', name: 'Maharashtra' },
  { id: 'manipur', code: 'MN', name: 'Manipur' },
  { id: 'meghalaya', code: 'ML', name: 'Meghalaya' },
  { id: 'mizoram', code: 'MZ', name: 'Mizoram' },
  { id: 'nagaland', code: 'NL', name: 'Nagaland' },
  { id: 'odisha', code: 'OD', name: 'Odisha' },
  { id: 'punjab', code: 'PB', name: 'Punjab' },
  { id: 'rajasthan', code: 'RJ', name: 'Rajasthan' },
  { id: 'sikkim', code: 'SK', name: 'Sikkim' },
  { id: 'tamil_nadu', code: 'TN', name: 'Tamil Nadu' },
  { id: 'telangana', code: 'TS', name: 'Telangana' },
  { id: 'tripura', code: 'TR', name: 'Tripura' },
  { id: 'uttar_pradesh', code: 'UP', name: 'Uttar Pradesh' },
  { id: 'uttarakhand', code: 'UK', name: 'Uttarakhand' },
  { id: 'west_bengal', code: 'WB', name: 'West Bengal' },
  // 8 Union Territories
  { id: 'andaman_and_nicobar', code: 'AN', name: 'Andaman & Nicobar Islands' },
  { id: 'chandigarh', code: 'CH', name: 'Chandigarh' },
  { id: 'dadra_and_nagar_haveli', code: 'DN', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { id: 'delhi', code: 'DL', name: 'Delhi NCR' },
  { id: 'jammu_and_kashmir', code: 'JK', name: 'Jammu and Kashmir' },
  { id: 'ladakh', code: 'LA', name: 'Ladakh' },
  { id: 'lakshadweep', code: 'LD', name: 'Lakshadweep' },
  { id: 'puducherry', code: 'PY', name: 'Puducherry' }
];

export function normalizeStateName(input) {
  if (!input || typeof input !== 'string') return 'Karnataka';
  const raw = input.trim().toLowerCase();
  if (raw === 'national' || raw === 'all') return 'National';
  const slug = raw.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const match = INDIAN_STATES.find(s => 
    s.id === slug || 
    s.code.toLowerCase() === raw || 
    s.name.toLowerCase() === raw ||
    raw.includes(s.name.toLowerCase())
  );
  if (match) return match.name;

  if (raw.includes('bengaluru') || raw.includes('bangalore')) return 'Karnataka';
  if (raw.includes('mumbai') || raw.includes('pune')) return 'Maharashtra';
  if (raw.includes('delhi') || raw.includes('noida') || raw.includes('gurugram')) return 'Delhi NCR';
  if (raw.includes('hyderabad')) return 'Telangana';
  if (raw.includes('chennai')) return 'Tamil Nadu';
  if (raw.includes('kolkata')) return 'West Bengal';

  return input.trim();
}
