export const MATERIAL_CATEGORIES = [
  {
    id: 'steel',
    name: 'Steel Rebar (TMT Bars)',
    unit: '₹ / Tonne',
    description: 'High-yield strength deformed bars for RCC foundation, columns, beams, and slabs (IS 1786).',
    options: [
      { id: 'st-indus', name: 'Indus TMT Fe 500D', tier: 'essential', unitRate: 68000, grade: 'Fe 500D', warranty: '3 yr mill test', desc: 'Economical high-durability TMT bar' },
      { id: 'st-jsw', name: 'JSW Neosteel Fe 550D', tier: 'standard', unitRate: 74000, grade: 'Fe 550D', warranty: 'IS Certified', desc: 'Primary producer, superior earthquake resistance' },
      { id: 'st-tata', name: 'Tata Tiscon 550D Super Ductile', tier: 'premium', unitRate: 82000, grade: 'Fe 550D SD', warranty: 'Tata Authenticity Guarantee', desc: 'Highest corrosion resistance and structural ductility' },
      { id: 'st-jindal', name: 'Jindal Panther Fe 550D / CRS', tier: 'luxury', unitRate: 88000, grade: 'Fe 550D CRS', warranty: 'Corrosion Resistant', desc: 'Corrosion resistant steel rebar for maximum lifespan' }
    ]
  },
  {
    id: 'cement',
    name: 'Cement (Grade 53 & PPC)',
    unit: '₹ / Bag (50 kg)',
    description: 'Structural & masonry binder complying with IS 12269 & IS 1489.',
    options: [
      { id: 'cm-dalmia', name: 'Dalmia / Penna Super 53', tier: 'essential', unitRate: 360, grade: 'OPC 53 / PPC', desc: 'Reliable regional structural cement' },
      { id: 'cm-ultratech-std', name: 'UltraTech PPC / ACC Gold', tier: 'standard', unitRate: 410, grade: 'High Performance PPC', desc: "India's #1 cement, optimal hydration & low cracks" },
      { id: 'cm-ultratech-super', name: 'UltraTech Super / ACC Concrete Plus', tier: 'premium', unitRate: 460, grade: 'Weather Pro Micro-fine', desc: 'Denser concrete matrix with water-repellent polymers' },
      { id: 'cm-rmc', name: 'UltraTech WeatherPro / RMC M25 Batching', tier: 'luxury', unitRate: 520, grade: 'Engineered RMC M25/M30', desc: 'Commercial grade batching plant concrete with durability additives' }
    ]
  },
  {
    id: 'sand',
    name: 'Sand & Aggregates',
    unit: '₹ / Cu.Ft',
    description: 'Graded river sand or eco-friendly manufactured sand (IS 383).',
    options: [
      { id: 'sd-std', name: 'Standard M-Sand (Concreting) + P-Sand (Plastering)', tier: 'essential', unitRate: 55, desc: 'Eco-friendly manufactured sand with silt screening' },
      { id: 'sd-double', name: 'Double Washed VSI M-Sand & Triple-screened Plaster Sand', tier: 'standard', unitRate: 68, desc: 'Zero silt, superior particle shape for high bonding' },
      { id: 'sd-river', name: 'VSI M-Sand for Structure + River Sand for Internal Plaster', tier: 'premium', unitRate: 90, desc: 'Ultra-smooth plaster finish with river sand blend' },
      { id: 'sd-robo', name: 'Engineered Micro-silica Sand + Quartz Aggregate Blend', tier: 'luxury', unitRate: 115, desc: 'High-density aggregate grading for crack-free monolithic strength' }
    ]
  },
  {
    id: 'masonry',
    name: 'Wall Masonry Blocks / Bricks',
    unit: '₹ / Sq.Ft of Wall',
    description: 'External (6"-9") and internal (4") wall envelope blocks.',
    options: [
      { id: 'ms-solid', name: 'Solid Concrete Blocks (6" Ext / 4" Int)', tier: 'essential', unitRate: 85, desc: 'High compressive strength, economical local masonry' },
      { id: 'ms-aac', name: 'Autoclaved Aerated Concrete (AAC) Blocks', tier: 'standard', unitRate: 98, desc: 'Lightweight, high thermal insulation, reduced dead load' },
      { id: 'ms-redbrick', name: 'First-Class Machine Made Wire-cut Red Bricks', tier: 'premium', unitRate: 125, desc: 'Traditional aesthetic, excellent thermal mass and sound insulation' },
      { id: 'ms-porotherm', name: 'Wienerberger Porotherm Thermo-Insulated Clay Blocks', tier: 'luxury', unitRate: 165, desc: '100% natural clay, 50% cooler interiors, acoustic isolation' }
    ]
  },
  {
    id: 'flooring',
    name: 'Flooring & Wall Tiling',
    unit: '₹ / Sq.Ft',
    description: 'Living, bedrooms, kitchen, and common area floor finishes.',
    options: [
      { id: 'fl-vitrified-std', name: 'Vitrified Tiles (2x2 ft) - Kajaria / Johnson', tier: 'essential', unitRate: 95, desc: 'Double charged durable vitrified tiles' },
      { id: 'fl-vitrified-gvt', name: 'Glazed Vitrified Tiles (GVT 4x2 ft) - Simpolo / Kajaria', tier: 'standard', unitRate: 145, desc: 'Seamless large slab format with satin/gloss finish' },
      { id: 'fl-granite', name: 'Large Format Slabs (6x4 ft) + Premium Flamed Granite', tier: 'premium', unitRate: 230, desc: 'Granite in stairs & common areas, designer porcelain in living' },
      { id: 'fl-marble', name: 'Italian Botticino / Statuario Marble + Teak Hardwood', tier: 'luxury', unitRate: 480, desc: 'Imported mirror-polished Italian marble slabs + solid wood floors' }
    ]
  },
  {
    id: 'kitchen',
    name: 'Kitchen Counter & Splashback',
    unit: '₹ / Sq.Ft',
    description: 'Countertop slab, stainless sink, and wall backsplash tiles.',
    options: [
      { id: 'kt-granite-std', name: 'Black Granite Counter + 2 ft Ceramic Dado', tier: 'essential', unitRate: 180, desc: 'Standard 20mm polished granite with SS sink' },
      { id: 'kt-granite-prm', name: 'Premium Jet Black / Telephone Black Granite + 2 ft Vitrified Dado', tier: 'standard', unitRate: 260, desc: 'Double chamfered edge, quartz sink provision' },
      { id: 'kt-quartz', name: 'Engineered Quartz Stone Counter + 4 ft Extended Designer Dado', tier: 'premium', unitRate: 420, desc: 'Non-porous, stain-proof quartz slab with under-mount sink' },
      { id: 'kt-porcelain', name: 'Dekton / Neolith Porcelain Slabs + Full Ceiling Dado', tier: 'luxury', unitRate: 750, desc: 'Heat-proof sintered stone with automated touch fixtures' }
    ]
  },
  {
    id: 'bathroom',
    name: 'Bathroom Dado & Sanitaryware',
    unit: '₹ / Bathroom',
    description: 'Wall tiles to lintel/ceiling, CP faucets, and sanitary ceramic fixtures.',
    options: [
      { id: 'bt-cera', name: 'Ceramic Dado to 7ft + Cera / Parryware Fittings', tier: 'essential', unitRate: 32000, desc: 'Wall mounted fixtures with chrome CP faucets' },
      { id: 'bt-jaquar', name: 'Vitrified Dado to 7ft + Jaquar Continental & Diverters', tier: 'standard', unitRate: 52000, desc: 'Concealed diverters, soft-close wall hung EWCs' },
      { id: 'bt-kohler', name: 'Full Height Dado to 10ft + Kohler / Jaquar Artize Rain Showers', tier: 'premium', unitRate: 88000, desc: 'Thermostatic diverters, glass shower partition, granite counter basins' },
      { id: 'bt-grohe', name: 'Full Italian Marble / Sintered Stone + Grohe / Axor Smart Showers', tier: 'luxury', unitRate: 160000, desc: 'Concealed Geberit systems, Hansgrohe Raindance, jacuzzi provisions' }
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical Conduit, Wiring & Switches',
    unit: '₹ / Sq.Ft of BUA',
    description: 'Fire-retardant wiring, conduits, MCB distribution, and modular switch plates.',
    options: [
      { id: 'el-anchor', name: 'Anchor / Goldmedal Wires + Roma Modular Switches', tier: 'essential', unitRate: 90, desc: 'Standard ISI certified electrical wiring' },
      { id: 'el-polycab', name: 'Polycab FRLS Wires + Legrand Mylinc Switches', tier: 'standard', unitRate: 135, desc: 'Flame retardant low smoke cables with safety shutters' },
      { id: 'el-finolex', name: 'Finolex FRLS Wires + Schneider AvatarOn / Legrand Arteor', tier: 'premium', unitRate: 190, desc: 'Ultra-flat frameless modular switches with surge protection' },
      { id: 'el-smart', name: 'Lapp Zero-Halogen Cables + Full Zigbee/WiFi Smart Home Automation', tier: 'luxury', unitRate: 290, desc: 'Smart lighting, automated curtain controls, smart sensors & DBs' }
    ]
  },
  {
    id: 'doors_windows',
    name: 'Doors, Windows & Fabrication',
    unit: '₹ / Sq.Ft of Openings',
    description: 'Main entrance door, bedroom doors, bathroom doors, and window systems.',
    options: [
      { id: 'dw-std', name: 'Sal Wood Frame + Flush Doors + Standard Anodized Aluminium Windows', tier: 'essential', unitRate: 160, desc: 'Teak veneer main door, flush internal doors, sliding windows' },
      { id: 'dw-upvc-std', name: 'Teak Main Door + Honne Bedroom Doors + 2.5-Track UPVC Windows', tier: 'standard', unitRate: 240, desc: 'Solid teak main entrance, waterproof WPC toilet doors, Fenesta UPVC with mosquito mesh' },
      { id: 'dw-upvc-prm', name: 'First Quality Teak Wood Frames + 3-Track UPVC with Toughened Glass', tier: 'premium', unitRate: 360, desc: 'Carved teak main door, veneer finished flush doors, heavy-duty sound-insulated UPVC' },
      { id: 'dw-teak-lux', name: '100% Burma Teak Throughout + Slimline Thermal-Break Aluminium Windows', tier: 'luxury', unitRate: 620, desc: 'Custom architectural pivot doors, Schuco/Reynaers acoustic double-glazed glass' }
    ]
  },
  {
    id: 'painting',
    name: 'Interior & Exterior Painting',
    unit: '₹ / Sq.Ft of Surface',
    description: 'Wall putty coats, primer, and topcoat acrylic emulsion finishes.',
    options: [
      { id: 'pt-tractor', name: '2 Coats Putty + Tractor Emulsion (Int) + Apex (Ext)', tier: 'essential', unitRate: 26, desc: 'Smooth matte finish with standard weather shield' },
      { id: 'pt-royale', name: 'Birla Wall Putty + Asian Paints Royale (Int) + Apex Ultima (Ext)', tier: 'standard', unitRate: 38, desc: 'Washable luxury sheen with 5-year anti-fungal exterior warranty' },
      { id: 'pt-aspira', name: 'Acrylic Putty + Asian Paints Royale Aspira + Ultima Protek Duralife', tier: 'premium', unitRate: 58, desc: 'Teflon surface protection, 10-year exterior warranty against peeling & cracks' },
      { id: 'pt-italian', name: 'Italian Stucco / PU Paint + PU Wood Polish + Jotun Extreme Sheen', tier: 'luxury', unitRate: 95, desc: 'Bespoke textured walls, ultra-smooth PU coatings for cabinetry & trim' }
    ]
  },
  {
    id: 'waterproofing',
    name: 'Waterproofing & Chemical Treatment',
    unit: '₹ / Lump Sum',
    description: 'Protection for terrace slabs, sunken bathrooms, water tanks, and foundation.',
    options: [
      { id: 'wp-basic', name: 'Dr. Fixit 2-Coat Polymer Slurry for Terrace & Toilets', tier: 'essential', unitRate: 45000, desc: 'Standard elastomeric cementitious membrane' },
      { id: 'wp-std', name: 'Dr. Fixit Fastflex + Sump & Retaining Wall Waterproofing', tier: 'standard', unitRate: 75000, desc: 'Flexible high-elongation membrane with 5-year leak-proof guarantee' },
      { id: 'wp-fosroc', name: 'Fosroc Brushbond + Geotextile Membrane + Brickbat Coba Insulation', tier: 'premium', unitRate: 125000, desc: 'Multi-layer structural waterproofing with thermal screed protection' },
      { id: 'wp-sika', name: 'Sika Sikalastic PU Liquid Applied Membrane + Food Grade Tank Lining', tier: 'luxury', unitRate: 195000, desc: 'Polyurethane continuous seamless membrane with 15-year warranty' }
    ]
  }
];

export const TIER_BENCHMARKS = {
  standard: {
    name: 'Standard Package',
    badge: 'Most Popular',
    ratePerSqFt: 2250,
    desc: 'The gold standard for modern family residences. Optimum balance of premium aesthetics, durability, and brand-name longevity.',
    highlights: ['JSW Neosteel 550D', 'UltraTech Super Cement', 'AAC Lightweight Blocks', '4x2 GVT Tile Slabs', 'Jaquar CP Fittings', 'Fenesta UPVC Windows', 'Asian Paints Royale']
  },
  premium: {
    name: 'Premium Package',
    badge: 'Architectural Elegance',
    ratePerSqFt: 2850,
    desc: 'High-performance architectural residences with designer finishes, acoustic glazing, and premium imported fittings.',
    highlights: ['Tata Tiscon SD Steel', 'Wire-cut Red Bricks', 'Granite & Designer Slabs', 'Kohler Sanitaryware', 'Schneider Frameless Switches', 'First-Class Teak Doors', 'Asian Paints Aspira']
  },
  luxury: {
    name: 'Luxury / Bespoke Package',
    badge: 'Ultra High-End',
    ratePerSqFt: 3800,
    desc: 'Bespoke custom villas with Italian marble, smart home automation, high-insulation Porotherm walls, and zero-compromise engineering.',
    highlights: ['Corrosion Resistant Steel', 'Porotherm Clay Blocks', 'Italian Botticino Marble', 'Grohe / Axor Fixtures', 'Full Smart Home Integration', 'Burma Teak Throughout', 'Schuco Slim Glazing']
  }
};