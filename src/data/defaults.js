export const AREA_UNITS = [
  { id: 'sqft', name: 'Sq.Ft (Square Feet)', toSqFt: 1, label: 'sq.ft' },
  { id: 'sqm', name: 'Sq.M (Square Meters)', toSqFt: 10.7639, label: 'sq.m' },
  { id: 'sqyd', name: 'Sq.Yards / Gaj', toSqFt: 9, label: 'sq.yd' },
  { id: 'guntha', name: 'Guntha / Cent', toSqFt: 1089, label: 'guntha' },
  { id: 'acre', name: 'Acre', toSqFt: 43560, label: 'acre' }
];

export const BUILDING_TYPES = [
  { id: 'villa_duplex', name: 'Independent Residence', costMult: 1.00, desc: 'Private family residence; the floor count below controls whether it is single-level or multi-level.' },
  { id: 'bungalow', name: 'Single Floor Luxury Bungalow', costMult: 1.05, desc: 'Spread-out single storey layout with higher foundation footprint.' },
  { id: 'multi_family', name: 'G+X Multi-Storey / Rental Units', costMult: 0.98, desc: 'Multiple independent 1BHK/2BHK flats per floor for rental income.' },
  { id: 'commercial_res', name: 'Commercial-Residential Mixed', costMult: 1.08, desc: 'Ground floor retail shops / commercial with upper residential units.' }
];

export const CONSTRUCTION_TYPES = [
  { id: 'rcc_framed', name: 'Standard RCC Framed Structure (IS 456)', costMult: 1.00, desc: 'Columns, plinth beams, and slabs with non-load-bearing masonry partition walls.' },
  { id: 'load_bearing', name: 'Load Bearing Masonry Construction', costMult: 0.90, desc: 'Thick foundation and brick walls supporting roof slabs (suitable for G+1).' },
  { id: 'composite_steel', name: 'Steel-Concrete Composite Frame', costMult: 1.15, desc: 'Heavy structural I-beams with deck slabs for rapid erection and wide spans.' }
];

export const DEFAULT_ROOM_TYPES = [
  { id: 'master_bed', name: 'Master Bedroom', category: 'bedroom', defaultW: 14, defaultL: 15, minArea: 160, icon: 'BedDouble', desc: 'Spacious bedroom with en-suite bath space' },
  { id: 'regular_bed', name: 'Bedroom / Guest Room', category: 'bedroom', defaultW: 12, defaultL: 13, minArea: 120, icon: 'Bed', desc: 'Standard bedroom' },
  { id: 'living', name: 'Living Room', category: 'common', defaultW: 16, defaultL: 18, minArea: 200, icon: 'Sofa', desc: 'Formal family gathering hall' },
  { id: 'dining', name: 'Dining Room', category: 'common', defaultW: 12, defaultL: 14, minArea: 120, icon: 'UtensilsCrossed', desc: 'Dedicated meal space' },
  { id: 'kitchen', name: 'Kitchen', category: 'utility', defaultW: 10, defaultL: 12, minArea: 90, icon: 'ChefHat', desc: 'Cooking area with counter space' },
  { id: 'utility', name: 'Utility / Dry Balcony', category: 'utility', defaultW: 6, defaultL: 8, minArea: 40, icon: 'WashingMachine', desc: 'Washing machine & sink area' },
  { id: 'attached_bath', name: 'Attached Bathroom', category: 'bath', defaultW: 8, defaultL: 6, minArea: 40, icon: 'Bath', desc: 'En-suite toilet and shower' },
  { id: 'common_bath', name: 'Common Bathroom', category: 'bath', defaultW: 7, defaultL: 5, minArea: 35, icon: 'Bath', desc: 'Guest toilet and wash area' },
  { id: 'balcony', name: 'Balcony', category: 'outdoor', defaultW: 10, defaultL: 5, minArea: 40, icon: 'Sun', desc: 'Open sit-out with railing' },
  { id: 'puja', name: 'Puja Room', category: 'special', defaultW: 6, defaultL: 6, minArea: 30, icon: 'Flame', desc: 'Sanctum prayer space' },
  { id: 'home_theatre', name: 'Home Theatre / Entertainment', category: 'special', defaultW: 14, defaultL: 18, minArea: 220, icon: 'Tv', desc: 'Acoustically isolated media room' },
  { id: 'office', name: 'Study / Home Office', category: 'special', defaultW: 10, defaultL: 12, minArea: 100, icon: 'Briefcase', desc: 'Quiet work from home workspace' },
  { id: 'parking', name: 'Car Parking / Porch', category: 'parking', defaultW: 12, defaultL: 18, minArea: 180, icon: 'Car', desc: 'Covered vehicle parking' },
  { id: 'staircase', name: 'Staircase Area', category: 'circulation', defaultW: 8, defaultL: 14, minArea: 90, icon: 'Footprints', desc: 'Internal or external flight of stairs' },
  { id: 'terrace', name: 'Open Terrace / Deck', category: 'outdoor', defaultW: 20, defaultL: 25, minArea: 300, icon: 'Sparkles', desc: 'Rooftop recreation & garden space' }
];

export const PROFESSIONAL_ROLES = [
  'Architect',
  'Contractor',
  'Builder',
  'Consultant',
  'Developer',
  'Other'
];

export const INITIAL_PROJECT_STATE = {
  projectName: 'My Dream Residence',
  state: 'Karnataka',
  city: 'Bengaluru',
  tier: 'standard', // standard, premium, luxury
  buildingType: 'villa_duplex', // villa_duplex, bungalow, multi_family, commercial_res
  constructionType: 'rcc_framed', // rcc_framed, load_bearing, composite_steel
  
  // Professional & Client Report Metadata
  professionalRole: 'Architect',
  professionalName: '',
  companyName: '',
  customerName: '',
  
  plotLength: 40, // ft
  plotWidth: 30, // ft
  areaUnit: 'sqft', // sqft, sqm, sqyd, guntha, acre
  siteAreaInput: 1200,
  targetBuaInput: 0, // 0 = auto-calculated from spaces
  
  roadWidth: 30, // ft
  facing: 'North', // North, South, East, West
  soilType: 'medium',
  numFloors: 2, // G+1 (2 floors total)
  
  // Custom material selections (override tier defaults if customized)
  customMaterials: {},

  // Floor by floor configuration
  floors: [
    {
      id: 'floor-0',
      name: 'Ground Floor',
      floorNumber: 0,
      targetBua: 950,
      rooms: [
        { id: 'r-g-1', type: 'parking', name: 'Car Porch & Entry', width: 12, length: 16, count: 1 },
        { id: 'r-g-2', type: 'living', name: 'Living Room', width: 15, length: 16, count: 1 },
        { id: 'r-g-3', type: 'dining', name: 'Dining Hall', width: 12, length: 12, count: 1 },
        { id: 'r-g-4', type: 'kitchen', name: 'Modular Kitchen', width: 10, length: 10, count: 1 },
        { id: 'r-g-5', type: 'utility', name: 'Utility Area', width: 6, length: 8, count: 1 },
        { id: 'r-g-6', type: 'master_bed', name: 'Guest Bedroom', width: 12, length: 14, count: 1 },
        { id: 'r-g-7', type: 'attached_bath', name: 'Bathroom 1', width: 8, length: 5, count: 1 },
        { id: 'r-g-8', type: 'puja', name: 'Puja Mandir', width: 5, length: 6, count: 1 },
        { id: 'r-g-9', type: 'staircase', name: 'Internal Staircase', width: 8, length: 12, count: 1 }
      ]
    },
    {
      id: 'floor-1',
      name: '1st Floor',
      floorNumber: 1,
      targetBua: 950,
      rooms: [
        { id: 'r-1-1', type: 'master_bed', name: 'Master Suite + Walk-in', width: 15, length: 16, count: 1 },
        { id: 'r-1-2', type: 'attached_bath', name: 'Master Bath', width: 9, length: 6, count: 1 },
        { id: 'r-1-3', type: 'regular_bed', name: "Kids' Bedroom", width: 12, length: 14, count: 1 },
        { id: 'r-1-4', type: 'attached_bath', name: 'Bathroom 3', width: 8, length: 5, count: 1 },
        { id: 'r-1-5', type: 'living', name: 'Family Lounge', width: 14, length: 12, count: 1 },
        { id: 'r-1-6', type: 'balcony', name: 'Front Balcony', width: 12, length: 5, count: 1 },
        { id: 'r-1-7', type: 'office', name: 'Study / Library', width: 10, length: 10, count: 1 },
        { id: 'r-1-8', type: 'staircase', name: 'Upper Stair Landing', width: 8, length: 12, count: 1 }
      ]
    }
  ],

  // Extra requirements / Site additions (Add / Remove options)
  includeCompoundWall: true,
  compoundWallLength: 140, // ft perimeter
  includeSump: true,
  sumpCapacityLitres: 8000,
  includeOverheadTank: true,
  overheadTankLitres: 2000,
  includeSolarPower: false,
  solarCapacityKw: 3,
  includeRainwaterHarvesting: true,
  includeBorewell: false,
  borewellDepthFt: 600,
  includeElevator: false,
  elevatorStops: 2,

  // Custom User-Added BOQ / Scope Items (Add / Remove in BOQ)
  customBoqItems: [],
  
  // Financial parameters
  contractorMarginPct: 10, // 10% builder / contractor supervision margin
  contingencyPct: 4, // 4% safety contingency
  architectureDesignFeesPct: 2.5 // 2.5% structural & architectural engineering drawings
};