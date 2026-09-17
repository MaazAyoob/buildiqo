import re

# Standard Buildiqo room types mapping
ROOM_TYPE_KEYWORDS = [
    # Master Bedroom
    ('master_bed', [r'\bmaster\s*(bed|bedroom|suite|br)\b', r'\bm\.?\s*bed\b']),
    # Regular Bedroom
    ('regular_bed', [r'\b(bed|bedroom|guest\s*bed|guest\s*room|guest\s*suite|kid\'?s?\s*bed|children\'?s?\s*bed|br)\b']),
    # Living room / Lounge
    ('living', [r'\b(living|hall|drawing|lounge|family\s*room|sitting)\b']),
    # Dining
    ('dining', [r'\b(dining|dinning|meal)\b']),
    # Kitchen
    ('kitchen', [r'\b(kitchen|modular\s*kitchen|kit|pantry)\b']),
    # Utility / Dry Balcony
    ('utility', [r'\b(utility|wash|laundry|dry\s*balcony)\b']),
    # Attached Bath / Toilet
    ('attached_bath', [r'\b(attached\s*bath|attached\s*toilet|ensuite|en-suite|m\.?\s*bath|m\.?\s*toilet)\b']),
    # Common Bath / Toilet / Powder
    ('common_bath', [r'\b(bath|bathroom|toilet|wc|powder\s*room|washroom|c\.?\s*bath|c\.?\s*toilet)\b']),
    # Balcony / Sit-out
    ('balcony', [r'\b(balcony|sitout|sit-out|deck|verandah|veranda|patio)\b']),
    # Puja
    ('puja', [r'\b(puja|pooja|mandir|prayer)\b']),
    # Car Parking / Porch
    ('parking', [r'\b(car\s*parking|parking|porch|garage|car\s*porch|portico)\b']),
    # Staircase
    ('staircase', [r'\b(stair|stairs|staircase|stair\s*case|steps)\b']),
    # Study / Office
    ('office', [r'\b(study|office|library|work)\b']),
    # Store
    ('utility', [r'\b(store|storage)\b'])
]

def classify_room_type(label: str) -> str:
    """
    Deterministic room type classification based on normalized keyword matching.
    Never uses an LLM. Defaults to 'custom' if no confident pattern matches.
    """
    if not label or not label.strip():
        return 'custom'
    
    clean_label = re.sub(r'[^a-zA-Z0-9\s\.\-]', ' ', label.lower())
    clean_label = re.sub(r'\s+', ' ', clean_label).strip()

    for room_type, patterns in ROOM_TYPE_KEYWORDS:
        for pattern in patterns:
            if re.search(pattern, clean_label):
                return room_type
                
    return 'custom'
