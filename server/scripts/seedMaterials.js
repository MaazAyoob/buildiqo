const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Material = require('../models/Material');
const MaterialRate = require('../models/MaterialRate');

// Default initial catalog sourced from IS 456 & IS 1786 benchmarks
const SEED_CATALOG = [
  {
    category: 'steel',
    unit: '₹ / Tonne',
    options: [
      { code: 'ST-INDUS', name: 'Indus TMT Fe 500D', tier: 'essential', rate: 68000, grade: 'Fe 500D', warranty: '3 yr mill test', desc: 'Economical high-durability TMT bar' },
      { code: 'ST-JSW', name: 'JSW Neosteel Fe 550D', tier: 'standard', rate: 74000, grade: 'Fe 550D', warranty: 'IS Certified', desc: 'Primary producer, superior earthquake resistance' },
      { code: 'ST-TATA', name: 'Tata Tiscon 550D Super Ductile', tier: 'premium', rate: 82000, grade: 'Fe 550D SD', warranty: 'Tata Authenticity Guarantee', desc: 'Highest corrosion resistance and structural ductility' },
      { code: 'ST-JINDAL', name: 'Jindal Panther Fe 550D / CRS', tier: 'luxury', rate: 88000, grade: 'Fe 550D CRS', warranty: 'Corrosion Resistant', desc: 'Corrosion resistant steel rebar for maximum lifespan' }
    ]
  },
  {
    category: 'cement',
    unit: '₹ / Bag (50 kg)',
    options: [
      { code: 'CM-DALMIA', name: 'Dalmia / Penna Super 53', tier: 'essential', rate: 360, grade: 'OPC 53 / PPC', desc: 'Reliable regional structural cement' },
      { code: 'CM-ULTRATECH-STD', name: 'UltraTech PPC / ACC Gold', tier: 'standard', rate: 410, grade: 'High Performance PPC', desc: "India's #1 cement, optimal hydration & low cracks" },
      { code: 'CM-ULTRATECH-SUPER', name: 'UltraTech Super / ACC Concrete Plus', tier: 'premium', rate: 460, grade: 'Weather Pro Micro-fine', desc: 'Denser concrete matrix with water-repellent polymers' },
      { code: 'CM-RMC', name: 'UltraTech WeatherPro / RMC M25 Batching', tier: 'luxury', rate: 520, grade: 'Engineered RMC M25/M30', desc: 'Commercial grade batching plant concrete with durability additives' }
    ]
  },
  {
    category: 'sand',
    unit: '₹ / Cu.Ft',
    options: [
      { code: 'SD-STD', name: 'Standard M-Sand (Concreting) + P-Sand (Plastering)', tier: 'essential', rate: 55, desc: 'Eco-friendly manufactured sand with silt screening' },
      { code: 'SD-DOUBLE', name: 'Double Washed VSI M-Sand & Triple-screened Plaster Sand', tier: 'standard', rate: 68, desc: 'Zero silt, superior particle shape for high bonding' },
      { code: 'SD-RIVER', name: 'VSI M-Sand for Structure + River Sand for Internal Plaster', tier: 'premium', rate: 90, desc: 'Ultra-smooth plaster finish with river sand blend' },
      { code: 'SD-ROBO', name: 'Engineered Micro-silica Sand + Quartz Aggregate Blend', tier: 'luxury', rate: 115, desc: 'High-density aggregate grading for crack-free monolithic strength' }
    ]
  },
  {
    category: 'masonry',
    unit: '₹ / Sq.Ft of Wall',
    options: [
      { code: 'MS-SOLID', name: 'Solid Concrete Blocks (6" Ext / 4" Int)', tier: 'essential', rate: 85, desc: 'High compressive strength, economical local masonry' },
      { code: 'MS-AAC', name: 'Autoclaved Aerated Concrete (AAC) Blocks', tier: 'standard', rate: 98, desc: 'Lightweight, high thermal insulation, reduced dead load' },
      { code: 'MS-REDBRICK', name: 'First-Class Machine Made Wire-cut Red Bricks', tier: 'premium', rate: 125, desc: 'Traditional aesthetic, excellent thermal mass and sound insulation' },
      { code: 'MS-POROTHERM', name: 'Wienerberger Porotherm Thermo-Insulated Clay Blocks', tier: 'luxury', rate: 165, desc: '100% natural clay, 50% cooler interiors, acoustic isolation' }
    ]
  },
  {
    category: 'flooring',
    unit: '₹ / Sq.Ft',
    options: [
      { code: 'FL-VITRIFIED-STD', name: 'Vitrified Tiles (2x2 ft) - Kajaria / Johnson', tier: 'essential', rate: 95, desc: 'Double charged durable vitrified tiles' },
      { code: 'FL-VITRIFIED-GVT', name: 'Glazed Vitrified Tiles (GVT 4x2 ft) - Simpolo / Kajaria', tier: 'standard', rate: 145, desc: 'Seamless large slab format with satin/gloss finish' },
      { code: 'FL-GRANITE', name: 'Large Format Slabs (6x4 ft) + Premium Flamed Granite', tier: 'premium', rate: 230, desc: 'Granite in stairs & common areas, designer porcelain in living' },
      { code: 'FL-MARBLE', name: 'Italian Botticino / Statuario Marble + Teak Hardwood', tier: 'luxury', rate: 480, desc: 'Imported mirror-polished Italian marble slabs + solid wood floors' }
    ]
  },
  {
    category: 'kitchen',
    unit: '₹ / Sq.Ft',
    options: [
      { code: 'KT-GRANITE-STD', name: 'Black Granite Counter + 2 ft Ceramic Dado', tier: 'essential', rate: 180, desc: 'Standard 20mm polished granite with SS sink' },
      { code: 'KT-GRANITE-PRM', name: 'Premium Jet Black / Telephone Black Granite + 2 ft Vitrified Dado', tier: 'standard', rate: 260, desc: 'Double chamfered edge, quartz sink provision' },
      { code: 'KT-QUARTZ', name: 'Engineered Quartz Stone Counter + 4 ft Extended Designer Dado', tier: 'premium', rate: 420, desc: 'Non-porous, stain-proof quartz slab with under-mount sink' },
      { code: 'KT-PORCELAIN', name: 'Dekton / Neolith Porcelain Slabs + Full Ceiling Dado', tier: 'luxury', rate: 750, desc: 'Heat-proof sintered stone with automated touch fixtures' }
    ]
  },
  {
    category: 'bathroom',
    unit: '₹ / Bathroom',
    options: [
      { code: 'BT-CERA', name: 'Ceramic Dado to 7ft + Cera / Parryware Fittings', tier: 'essential', rate: 32000, desc: 'Wall mounted fixtures with chrome CP faucets' },
      { code: 'BT-JAQUAR', name: 'Vitrified Dado to 7ft + Jaquar Continental & Diverters', tier: 'standard', rate: 52000, desc: 'Concealed diverters, soft-close wall hung EWCs' },
      { code: 'BT-KOHLER', name: 'Full Height Dado to 10ft + Kohler / Jaquar Artize Rain Showers', tier: 'premium', rate: 88000, desc: 'Thermostatic diverters, glass shower partition, granite counter basins' },
      { code: 'BT-GROHE', name: 'Full Italian Marble / Sintered Stone + Grohe / Axor Smart Showers', tier: 'luxury', rate: 160000, desc: 'Concealed Geberit systems, Hansgrohe Raindance, jacuzzi provisions' }
    ]
  },
  {
    category: 'electrical',
    unit: '₹ / Sq.Ft of BUA',
    options: [
      { code: 'EL-ANCHOR', name: 'Anchor / Goldmedal Wires + Roma Modular Switches', tier: 'essential', rate: 90, desc: 'Standard ISI certified electrical wiring' },
      { code: 'EL-POLYCAB', name: 'Polycab FRLS Wires + Legrand Mylinc Switches', tier: 'standard', rate: 135, desc: 'Flame retardant low smoke cables with safety shutters' },
      { code: 'EL-FINOLEX', name: 'Finolex FRLS Wires + Schneider AvatarOn / Legrand Arteor', tier: 'premium', rate: 190, desc: 'Ultra-flat frameless modular switches with surge protection' },
      { code: 'EL-SMART', name: 'Lapp Zero-Halogen Cables + Full Zigbee/WiFi Smart Home Automation', tier: 'luxury', rate: 290, desc: 'Smart lighting, automated curtain controls, smart sensors & DBs' }
    ]
  },
  {
    category: 'doors_windows',
    unit: '₹ / Sq.Ft of Openings',
    options: [
      { code: 'DW-STD', name: 'Sal Wood Frame + Flush Doors + Standard Anodized Aluminium Windows', tier: 'essential', rate: 160, desc: 'Teak veneer main door, flush internal doors, sliding windows' },
      { code: 'DW-UPVC-STD', name: 'Teak Main Door + Honne Bedroom Doors + 2.5-Track UPVC Windows', tier: 'standard', rate: 240, desc: 'Solid teak main entrance, waterproof WPC toilet doors, Fenesta UPVC with mosquito mesh' },
      { code: 'DW-UPVC-PRM', name: 'First Quality Teak Wood Frames + 3-Track UPVC with Toughened Glass', tier: 'premium', rate: 360, desc: 'Carved teak main door, veneer finished flush doors, heavy-duty sound-insulated UPVC' },
      { code: 'DW-TEAK-LUX', name: '100% Burma Teak Throughout + Slimline Thermal-Break Aluminium Windows', tier: 'luxury', rate: 620, desc: 'Custom architectural pivot doors, Schuco/Reynaers acoustic double-glazed glass' }
    ]
  },
  {
    category: 'painting',
    unit: '₹ / Sq.Ft of Surface',
    options: [
      { code: 'PT-TRACTOR', name: '2 Coats Putty + Tractor Emulsion (Int) + Apex (Ext)', tier: 'essential', rate: 26, desc: 'Smooth matte finish with standard weather shield' },
      { code: 'PT-ROYALE', name: 'Birla Wall Putty + Asian Paints Royale (Int) + Apex Ultima (Ext)', tier: 'standard', rate: 38, desc: 'Washable luxury sheen with 5-year anti-fungal exterior warranty' },
      { code: 'PT-ASPIRA', name: 'Acrylic Putty + Asian Paints Royale Aspira + Ultima Protek Duralife', tier: 'premium', rate: 58, desc: 'Teflon surface protection, 10-year exterior warranty against peeling & cracks' },
      { code: 'PT-ITALIAN', name: 'Italian Stucco / PU Paint + PU Wood Polish + Jotun Extreme Sheen', tier: 'luxury', rate: 95, desc: 'Bespoke textured walls, ultra-smooth PU coatings for cabinetry & trim' }
    ]
  },
  {
    category: 'waterproofing',
    unit: '₹ / Lump Sum',
    options: [
      { code: 'WP-BASIC', name: 'Dr. Fixit 2-Coat Polymer Slurry for Terrace & Toilets', tier: 'essential', rate: 45000, desc: 'Standard elastomeric cementitious membrane' },
      { code: 'WP-STD', name: 'Dr. Fixit Fastflex + Sump & Retaining Wall Waterproofing', tier: 'standard', rate: 75000, desc: 'Flexible high-elongation membrane with 5-year leak-proof guarantee' },
      { code: 'WP-FOSROC', name: 'Fosroc Brushbond + Geotextile Membrane + Brickbat Coba Insulation', tier: 'premium', rate: 125000, desc: 'Multi-layer structural waterproofing with thermal screed protection' },
      { code: 'WP-SIKA', name: 'Sika Sikalastic PU Liquid Applied Membrane + Food Grade Tank Lining', tier: 'luxury', rate: 195000, desc: 'Polyurethane continuous seamless membrane with 15-year warranty' }
    ]
  }
];

async function seedMaterials() {
  let createdMaterials = 0;
  let createdRates = 0;

  for (const cat of SEED_CATALOG) {
    for (const opt of cat.options) {
      // 1. Find or create Material
      let material = await Material.findOne({ materialCode: opt.code });
      if (!material) {
        material = await Material.create({
          materialCode: opt.code,
          name: opt.name,
          category: cat.category,
          unit: cat.unit,
          tier: opt.tier,
          grade: opt.grade || '',
          brand: opt.name.split(' ')[0] || '',
          desc: opt.desc || '',
          warranty: opt.warranty || '',
          benchmarkRate: opt.rate,
          active: true
        });
        createdMaterials++;
      }

      // 2. Ensure initial approved NATIONAL baseline rate exists (stateId: 'all', cityId: 'all')
      const existingApprovedRate = await MaterialRate.findOne({
        materialCode: opt.code,
        $or: [
          { stateId: 'all', cityId: 'all' },
          { cityId: 'all', stateId: { $exists: false } },
          { cityId: 'all', stateId: null }
        ],
        status: 'approved'
      });

      if (!existingApprovedRate) {
        await MaterialRate.create({
          materialId: material._id,
          materialCode: opt.code,
          rate: opt.rate,
          unit: cat.unit,
          location: 'National',
          stateId: 'all',
          cityId: 'all',
          effectiveFrom: new Date('2026-01-01T00:00:00Z'),
          source: 'initial_seed',
          sourceType: 'initial_seed',
          notes: 'Baseline IS benchmark rate (National)',
          status: 'approved',
          currency: 'INR',
          schemaVersion: 1
        });
        createdRates++;
      } else if (existingApprovedRate.stateId !== 'all') {
        // Ensure stateId is explicitly 'all'
        await MaterialRate.updateOne(
          { _id: existingApprovedRate._id },
          { $set: { stateId: 'all', location: 'National' } }
        );
      }
    }
  }

  return {
    success: true,
    createdMaterials,
    createdRates,
    totalCatalogItems: SEED_CATALOG.reduce((sum, c) => sum + c.options.length, 0)
  };
}

// Standalone execution support
if (require.main === module) {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/buildiqo';
  mongoose.connect(mongoUri)
    .then(async () => {
      console.log('Connected to MongoDB. Running material seed...');
      const result = await seedMaterials();
      console.log('Seeding complete:', result);
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exit(1);
    });
}

module.exports = { seedMaterials, SEED_CATALOG };
