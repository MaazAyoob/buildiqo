/**
 * Comprehensive Indian States & Representative Construction Cities Catalog.
 * Note: This serves as reference and UI convenience.
 * The system supports any valid Indian city or state beyond this initial catalog.
 */

const INDIAN_LOCATIONS = [
  {
    stateId: 'uttar_pradesh',
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
    stateId: 'maharashtra',
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
    stateId: 'karnataka',
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
    stateId: 'delhi',
    stateName: 'Delhi NCR',
    cities: [
      { cityId: 'new_delhi', cityName: 'New Delhi', tier: 1 },
      { cityId: 'gurugram', cityName: 'Gurugram', tier: 1 },
      { cityId: 'faridabad', cityName: 'Faridabad', tier: 2 }
    ]
  },
  {
    stateId: 'tamil_nadu',
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
    stateId: 'gujarat',
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
    stateId: 'rajasthan',
    stateName: 'Rajasthan',
    cities: [
      { cityId: 'jaipur', cityName: 'Jaipur', tier: 1 },
      { cityId: 'jodhpur', cityName: 'Jodhpur', tier: 2 },
      { cityId: 'udaipur', cityName: 'Udaipur', tier: 2 },
      { cityId: 'kota', cityName: 'Kota', tier: 2 }
    ]
  },
  {
    stateId: 'telangana',
    stateName: 'Telangana',
    cities: [
      { cityId: 'hyderabad', cityName: 'Hyderabad', tier: 1 },
      { cityId: 'warangal', cityName: 'Warangal', tier: 2 },
      { cityId: 'nizamabad', cityName: 'Nizamabad', tier: 3 }
    ]
  },
  {
    stateId: 'west_bengal',
    stateName: 'West Bengal',
    cities: [
      { cityId: 'kolkata', cityName: 'Kolkata', tier: 1 },
      { cityId: 'howrah', cityName: 'Howrah', tier: 2 },
      { cityId: 'durgapur', cityName: 'Durgapur', tier: 2 },
      { cityId: 'siliguri', cityName: 'Siliguri', tier: 2 }
    ]
  },
  {
    stateId: 'kerala',
    stateName: 'Kerala',
    cities: [
      { cityId: 'kochi', cityName: 'Kochi', tier: 2 },
      { cityId: 'thiruvananthapuram', cityName: 'Thiruvananthapuram', tier: 2 },
      { cityId: 'kozhikode', cityName: 'Kozhikode', tier: 2 }
    ]
  },
  {
    stateId: 'andhra_pradesh',
    stateName: 'Andhra Pradesh',
    cities: [
      { cityId: 'visakhapatnam', cityName: 'Visakhapatnam', tier: 2 },
      { cityId: 'vijayawada', cityName: 'Vijayawada', tier: 2 },
      { cityId: 'guntur', cityName: 'Guntur', tier: 2 }
    ]
  },
  {
    stateId: 'madhya_pradesh',
    stateName: 'Madhya Pradesh',
    cities: [
      { cityId: 'bhopal', cityName: 'Bhopal', tier: 2 },
      { cityId: 'indore', cityName: 'Indore', tier: 2 },
      { cityId: 'gwalior', cityName: 'Gwalior', tier: 2 },
      { cityId: 'jabalpur', cityName: 'Jabalpur', tier: 2 }
    ]
  },
  {
    stateId: 'bihar',
    stateName: 'Bihar',
    cities: [
      { cityId: 'patna', cityName: 'Patna', tier: 2 },
      { cityId: 'gaya', cityName: 'Gaya', tier: 3 },
      { cityId: 'muzaffarpur', cityName: 'Muzaffarpur', tier: 3 }
    ]
  },
  {
    stateId: 'punjab',
    stateName: 'Punjab',
    cities: [
      { cityId: 'ludhiana', cityName: 'Ludhiana', tier: 2 },
      { cityId: 'amritsar', cityName: 'Amritsar', tier: 2 },
      { cityId: 'jalandhar', cityName: 'Jalandhar', tier: 2 }
    ]
  },
  {
    stateId: 'haryana',
    stateName: 'Haryana',
    cities: [
      { cityId: 'faridabad', cityName: 'Faridabad', tier: 2 },
      { cityId: 'panipat', cityName: 'Panipat', tier: 3 },
      { cityId: 'karnal', cityName: 'Karnal', tier: 3 }
    ]
  },
  {
    stateId: 'odisha',
    stateName: 'Odisha',
    cities: [
      { cityId: 'bhubaneswar', cityName: 'Bhubaneswar', tier: 2 },
      { cityId: 'cuttack', cityName: 'Cuttack', tier: 2 },
      { cityId: 'rourkela', cityName: 'Rourkela', tier: 3 }
    ]
  }
];

module.exports = {
  INDIAN_LOCATIONS
};
