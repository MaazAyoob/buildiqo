/**
 * Comprehensive Indian States & Representative Construction Cities Catalog.
 * Supports all 28 States and 8 Union Territories with ISO state codes, normalized IDs, and representative cities.
 */

const INDIAN_LOCATIONS = [
  // 28 States
  {
    stateId: 'andhra_pradesh',
    stateCode: 'AP',
    stateName: 'Andhra Pradesh',
    cities: [
      { cityId: 'visakhapatnam', cityName: 'Visakhapatnam', tier: 2 },
      { cityId: 'vijayawada', cityName: 'Vijayawada', tier: 2 },
      { cityId: 'guntur', cityName: 'Guntur', tier: 2 },
      { cityId: 'tirupati', cityName: 'Tirupati', tier: 3 }
    ]
  },
  {
    stateId: 'arunachal_pradesh',
    stateCode: 'AR',
    stateName: 'Arunachal Pradesh',
    cities: [
      { cityId: 'itanagar', cityName: 'Itanagar', tier: 3 }
    ]
  },
  {
    stateId: 'assam',
    stateCode: 'AS',
    stateName: 'Assam',
    cities: [
      { cityId: 'guwahati', cityName: 'Guwahati', tier: 2 },
      { cityId: 'silchar', cityName: 'Silchar', tier: 3 },
      { cityId: 'dibrugarh', cityName: 'Dibrugarh', tier: 3 }
    ]
  },
  {
    stateId: 'bihar',
    stateCode: 'BR',
    stateName: 'Bihar',
    cities: [
      { cityId: 'patna', cityName: 'Patna', tier: 2 },
      { cityId: 'gaya', cityName: 'Gaya', tier: 3 },
      { cityId: 'muzaffarpur', cityName: 'Muzaffarpur', tier: 3 },
      { cityId: 'bhagalpur', cityName: 'Bhagalpur', tier: 3 }
    ]
  },
  {
    stateId: 'chhattisgarh',
    stateCode: 'CG',
    stateName: 'Chhattisgarh',
    cities: [
      { cityId: 'raipur', cityName: 'Raipur', tier: 2 },
      { cityId: 'bilaspur', cityName: 'Bilaspur', tier: 3 },
      { cityId: 'bhilai', cityName: 'Bhilai', tier: 3 }
    ]
  },
  {
    stateId: 'goa',
    stateCode: 'GA',
    stateName: 'Goa',
    cities: [
      { cityId: 'panaji', cityName: 'Panaji', tier: 2 },
      { cityId: 'margao', cityName: 'Margao', tier: 3 }
    ]
  },
  {
    stateId: 'gujarat',
    stateCode: 'GJ',
    stateName: 'Gujarat',
    cities: [
      { cityId: 'ahmedabad', cityName: 'Ahmedabad', tier: 1 },
      { cityId: 'surat', cityName: 'Surat', tier: 1 },
      { cityId: 'vadodara', cityName: 'Vadodara', tier: 2 },
      { cityId: 'rajkot', cityName: 'Rajkot', tier: 2 },
      { cityId: 'gandhinagar', cityName: 'Gandhinagar', tier: 2 }
    ]
  },
  {
    stateId: 'haryana',
    stateCode: 'HR',
    stateName: 'Haryana',
    cities: [
      { cityId: 'gurugram', cityName: 'Gurugram', tier: 1 },
      { cityId: 'faridabad', cityName: 'Faridabad', tier: 2 },
      { cityId: 'panipat', cityName: 'Panipat', tier: 3 },
      { cityId: 'karnal', cityName: 'Karnal', tier: 3 },
      { cityId: 'ambala', cityName: 'Ambala', tier: 3 }
    ]
  },
  {
    stateId: 'himachal_pradesh',
    stateCode: 'HP',
    stateName: 'Himachal Pradesh',
    cities: [
      { cityId: 'shimla', cityName: 'Shimla', tier: 3 },
      { cityId: 'dharamshala', cityName: 'Dharamshala', tier: 3 },
      { cityId: 'mandi', cityName: 'Mandi', tier: 3 }
    ]
  },
  {
    stateId: 'jharkhand',
    stateCode: 'JH',
    stateName: 'Jharkhand',
    cities: [
      { cityId: 'ranchi', cityName: 'Ranchi', tier: 2 },
      { cityId: 'jamshedpur', cityName: 'Jamshedpur', tier: 2 },
      { cityId: 'dhanbad', cityName: 'Dhanbad', tier: 3 }
    ]
  },
  {
    stateId: 'karnataka',
    stateCode: 'KA',
    stateName: 'Karnataka',
    cities: [
      { cityId: 'bangalore', cityName: 'Bengaluru', tier: 1 },
      { cityId: 'mysore', cityName: 'Mysuru', tier: 2 },
      { cityId: 'hubli', cityName: 'Hubballi-Dharwad', tier: 2 },
      { cityId: 'mangalore', cityName: 'Mangaluru', tier: 2 },
      { cityId: 'belgaum', cityName: 'Belagavi', tier: 2 }
    ]
  },
  {
    stateId: 'kerala',
    stateCode: 'KL',
    stateName: 'Kerala',
    cities: [
      { cityId: 'kochi', cityName: 'Kochi', tier: 2 },
      { cityId: 'thiruvananthapuram', cityName: 'Thiruvananthapuram', tier: 2 },
      { cityId: 'kozhikode', cityName: 'Kozhikode', tier: 2 },
      { cityId: 'thrissur', cityName: 'Thrissur', tier: 3 }
    ]
  },
  {
    stateId: 'madhya_pradesh',
    stateCode: 'MP',
    stateName: 'Madhya Pradesh',
    cities: [
      { cityId: 'bhopal', cityName: 'Bhopal', tier: 2 },
      { cityId: 'indore', cityName: 'Indore', tier: 2 },
      { cityId: 'gwalior', cityName: 'Gwalior', tier: 2 },
      { cityId: 'jabalpur', cityName: 'Jabalpur', tier: 2 }
    ]
  },
  {
    stateId: 'maharashtra',
    stateCode: 'MH',
    stateName: 'Maharashtra',
    cities: [
      { cityId: 'mumbai', cityName: 'Mumbai', tier: 1 },
      { cityId: 'pune', cityName: 'Pune', tier: 1 },
      { cityId: 'nagpur', cityName: 'Nagpur', tier: 2 },
      { cityId: 'nashik', cityName: 'Nashik', tier: 2 },
      { cityId: 'thane', cityName: 'Thane', tier: 1 },
      { cityId: 'aurangabad', cityName: 'Chhatrapati Sambhajinagar', tier: 2 },
      { cityId: 'navi_mumbai', cityName: 'Navi Mumbai', tier: 1 }
    ]
  },
  {
    stateId: 'manipur',
    stateCode: 'MN',
    stateName: 'Manipur',
    cities: [
      { cityId: 'imphal', cityName: 'Imphal', tier: 3 }
    ]
  },
  {
    stateId: 'meghalaya',
    stateCode: 'ML',
    stateName: 'Meghalaya',
    cities: [
      { cityId: 'shillong', cityName: 'Shillong', tier: 3 }
    ]
  },
  {
    stateId: 'mizoram',
    stateCode: 'MZ',
    stateName: 'Mizoram',
    cities: [
      { cityId: 'aizawl', cityName: 'Aizawl', tier: 3 }
    ]
  },
  {
    stateId: 'nagaland',
    stateCode: 'NL',
    stateName: 'Nagaland',
    cities: [
      { cityId: 'kohima', cityName: 'Kohima', tier: 3 },
      { cityId: 'dimapur', cityName: 'Dimapur', tier: 3 }
    ]
  },
  {
    stateId: 'odisha',
    stateCode: 'OD',
    stateName: 'Odisha',
    cities: [
      { cityId: 'bhubaneswar', cityName: 'Bhubaneswar', tier: 2 },
      { cityId: 'cuttack', cityName: 'Cuttack', tier: 2 },
      { cityId: 'rourkela', cityName: 'Rourkela', tier: 3 }
    ]
  },
  {
    stateId: 'punjab',
    stateCode: 'PB',
    stateName: 'Punjab',
    cities: [
      { cityId: 'ludhiana', cityName: 'Ludhiana', tier: 2 },
      { cityId: 'amritsar', cityName: 'Amritsar', tier: 2 },
      { cityId: 'jalandhar', cityName: 'Jalandhar', tier: 2 },
      { cityId: 'mohali', cityName: 'Mohali', tier: 2 }
    ]
  },
  {
    stateId: 'rajasthan',
    stateCode: 'RJ',
    stateName: 'Rajasthan',
    cities: [
      { cityId: 'jaipur', cityName: 'Jaipur', tier: 1 },
      { cityId: 'jodhpur', cityName: 'Jodhpur', tier: 2 },
      { cityId: 'udaipur', cityName: 'Udaipur', tier: 2 },
      { cityId: 'kota', cityName: 'Kota', tier: 2 }
    ]
  },
  {
    stateId: 'sikkim',
    stateCode: 'SK',
    stateName: 'Sikkim',
    cities: [
      { cityId: 'gangtok', cityName: 'Gangtok', tier: 3 }
    ]
  },
  {
    stateId: 'tamil_nadu',
    stateCode: 'TN',
    stateName: 'Tamil Nadu',
    cities: [
      { cityId: 'chennai', cityName: 'Chennai', tier: 1 },
      { cityId: 'coimbatore', cityName: 'Coimbatore', tier: 2 },
      { cityId: 'madurai', cityName: 'Madurai', tier: 2 },
      { cityId: 'trichy', cityName: 'Tiruchirappalli', tier: 2 },
      { cityId: 'salem', cityName: 'Salem', tier: 2 }
    ]
  },
  {
    stateId: 'telangana',
    stateCode: 'TS',
    stateName: 'Telangana',
    cities: [
      { cityId: 'hyderabad', cityName: 'Hyderabad', tier: 1 },
      { cityId: 'warangal', cityName: 'Warangal', tier: 2 },
      { cityId: 'nizamabad', cityName: 'Nizamabad', tier: 3 }
    ]
  },
  {
    stateId: 'tripura',
    stateCode: 'TR',
    stateName: 'Tripura',
    cities: [
      { cityId: 'agartala', cityName: 'Agartala', tier: 3 }
    ]
  },
  {
    stateId: 'uttar_pradesh',
    stateCode: 'UP',
    stateName: 'Uttar Pradesh',
    cities: [
      { cityId: 'varanasi', cityName: 'Varanasi', tier: 2 },
      { cityId: 'prayagraj', cityName: 'Prayagraj', tier: 2 },
      { cityId: 'lucknow', cityName: 'Lucknow', tier: 1 },
      { cityId: 'kanpur', cityName: 'Kanpur', tier: 2 },
      { cityId: 'noida', cityName: 'Noida', tier: 1 },
      { cityId: 'greater_noida', cityName: 'Greater Noida', tier: 1 },
      { cityId: 'agra', cityName: 'Agra', tier: 2 },
      { cityId: 'ghaziabad', cityName: 'Ghaziabad', tier: 2 },
      { cityId: 'gorakhpur', cityName: 'Gorakhpur', tier: 3 },
      { cityId: 'meerut', cityName: 'Meerut', tier: 2 }
    ]
  },
  {
    stateId: 'uttarakhand',
    stateCode: 'UK',
    stateName: 'Uttarakhand',
    cities: [
      { cityId: 'dehradun', cityName: 'Dehradun', tier: 2 },
      { cityId: 'haridwar', cityName: 'Haridwar', tier: 3 },
      { cityId: 'haldwani', cityName: 'Haldwani', tier: 3 }
    ]
  },
  {
    stateId: 'west_bengal',
    stateCode: 'WB',
    stateName: 'West Bengal',
    cities: [
      { cityId: 'kolkata', cityName: 'Kolkata', tier: 1 },
      { cityId: 'howrah', cityName: 'Howrah', tier: 2 },
      { cityId: 'durgapur', cityName: 'Durgapur', tier: 2 },
      { cityId: 'siliguri', cityName: 'Siliguri', tier: 2 }
    ]
  },

  // 8 Union Territories
  {
    stateId: 'andaman_and_nicobar',
    stateCode: 'AN',
    stateName: 'Andaman and Nicobar Islands',
    cities: [
      { cityId: 'port_blair', cityName: 'Port Blair', tier: 3 }
    ]
  },
  {
    stateId: 'chandigarh',
    stateCode: 'CH',
    stateName: 'Chandigarh',
    cities: [
      { cityId: 'chandigarh', cityName: 'Chandigarh', tier: 2 }
    ]
  },
  {
    stateId: 'dadra_and_nagar_haveli',
    stateCode: 'DN',
    stateName: 'Dadra & Nagar Haveli and Daman & Diu',
    cities: [
      { cityId: 'daman', cityName: 'Daman', tier: 3 },
      { cityId: 'silvassa', cityName: 'Silvassa', tier: 3 }
    ]
  },
  {
    stateId: 'delhi',
    stateCode: 'DL',
    stateName: 'Delhi NCR',
    cities: [
      { cityId: 'new_delhi', cityName: 'New Delhi', tier: 1 },
      { cityId: 'central_delhi', cityName: 'Central Delhi', tier: 1 },
      { cityId: 'south_delhi', cityName: 'South Delhi', tier: 1 }
    ]
  },
  {
    stateId: 'jammu_and_kashmir',
    stateCode: 'JK',
    stateName: 'Jammu and Kashmir',
    cities: [
      { cityId: 'srinagar', cityName: 'Srinagar', tier: 2 },
      { cityId: 'jammu', cityName: 'Jammu', tier: 2 }
    ]
  },
  {
    stateId: 'ladakh',
    stateCode: 'LA',
    stateName: 'Ladakh',
    cities: [
      { cityId: 'leh', cityName: 'Leh', tier: 3 }
    ]
  },
  {
    stateId: 'lakshadweep',
    stateCode: 'LD',
    stateName: 'Lakshadweep',
    cities: [
      { cityId: 'kavaratti', cityName: 'Kavaratti', tier: 3 }
    ]
  },
  {
    stateId: 'puducherry',
    stateCode: 'PY',
    stateName: 'Puducherry',
    cities: [
      { cityId: 'puducherry', cityName: 'Puducherry', tier: 3 }
    ]
  }
];

/**
 * Normalizes any state name, code, slug, or representative city into standard { stateId, stateName, stateCode }.
 * Does NOT make city a production pricing key: if city is given, it extracts the containing state ONLY.
 */
function normalizeState(input) {
  if (!input || typeof input !== 'string') {
    return { stateId: 'all', stateName: 'National', stateCode: 'NAT' };
  }

  const raw = input.trim().toLowerCase();
  const slug = raw.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  if (raw === 'all' || raw === 'national' || raw === 'india' || !raw) {
    return { stateId: 'all', stateName: 'National', stateCode: 'NAT' };
  }

  // 1. Direct stateId match
  const matchById = INDIAN_LOCATIONS.find(l => l.stateId === slug);
  if (matchById) {
    return { stateId: matchById.stateId, stateName: matchById.stateName, stateCode: matchById.stateCode };
  }

  // 2. Direct stateCode match (e.g. KA, MH, DL, UP)
  const upperCode = input.trim().toUpperCase();
  const matchByCode = INDIAN_LOCATIONS.find(l => l.stateCode === upperCode);
  if (matchByCode) {
    return { stateId: matchByCode.stateId, stateName: matchByCode.stateName, stateCode: matchByCode.stateCode };
  }

  // 3. Match stateName (case-insensitive)
  const matchByName = INDIAN_LOCATIONS.find(l => 
    l.stateName.toLowerCase() === raw ||
    raw.includes(l.stateName.toLowerCase()) ||
    l.stateName.toLowerCase().includes(raw)
  );
  if (matchByName) {
    return { stateId: matchByName.stateId, stateName: matchByName.stateName, stateCode: matchByName.stateCode };
  }

  // 4. Known city mapping -> returns containing state ONLY (city is never the production key)
  for (const loc of INDIAN_LOCATIONS) {
    const cityMatch = loc.cities.find(c => 
      c.cityId === slug ||
      c.cityName.toLowerCase() === raw ||
      raw.includes(c.cityName.toLowerCase())
    );
    if (cityMatch) {
      return { stateId: loc.stateId, stateName: loc.stateName, stateCode: loc.stateCode };
    }
  }

  // Common aliases
  if (raw.includes('bengaluru') || raw.includes('bangalore')) {
    return { stateId: 'karnataka', stateName: 'Karnataka', stateCode: 'KA' };
  }
  if (raw.includes('mumbai') || raw.includes('bombay') || raw.includes('pune')) {
    return { stateId: 'maharashtra', stateName: 'Maharashtra', stateCode: 'MH' };
  }
  if (raw.includes('delhi') || raw.includes('noida') || raw.includes('gurgaon') || raw.includes('gurugram')) {
    return { stateId: 'delhi', stateName: 'Delhi NCR', stateCode: 'DL' };
  }
  if (raw.includes('hyderabad')) {
    return { stateId: 'telangana', stateName: 'Telangana', stateCode: 'TS' };
  }
  if (raw.includes('chennai') || raw.includes('madras')) {
    return { stateId: 'tamil_nadu', stateName: 'Tamil Nadu', stateCode: 'TN' };
  }
  if (raw.includes('kolkata') || raw.includes('calcutta')) {
    return { stateId: 'west_bengal', stateName: 'West Bengal', stateCode: 'WB' };
  }

  // Fallback: slugified input if clean
  return {
    stateId: slug || 'all',
    stateName: input.trim(),
    stateCode: slug.substring(0, 2).toUpperCase()
  };
}

module.exports = {
  INDIAN_LOCATIONS,
  normalizeState
};
