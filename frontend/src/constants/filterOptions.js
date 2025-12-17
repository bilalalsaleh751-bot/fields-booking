// ============================================================
// SHARED FILTER OPTIONS
// Single source of truth for all filter dropdowns across the app
// Used by: Home, Discover, OwnerFields (Add Field form)
// ============================================================

// Sport types available in the system
export const SPORT_TYPES = [
  "Football",
  "Basketball",
  "Tennis",
  "Padel",
  "Volleyball",
  "Swimming",
  "Squash",
  "Badminton",
  "Cricket",
  "Rugby",
  "Multi-Purpose",
];

// Surface types for fields
export const SURFACE_TYPES = [
  "Natural Grass",
  "Artificial Turf",
  "Hard Court",
  "Clay",
  "Sand",
  "Hardwood",
  "Concrete",
  "Tiled",
  "Glass Court",
  "Indoor Court",
];

// Cities in Lebanon
export const CITIES_LIST = [
  "Beirut",
  "Tripoli",
  "Sidon",
  "Jounieh",
  "Byblos",
  "Zahle",
  "Baalbek",
  "Tyre",
  "Nabatieh",
  "Aley",
];

// Areas by city
export const AREAS_BY_CITY = {
  Beirut: ["Hamra", "Achrafieh", "Verdun", "Downtown", "Mar Mikhael", "Badaro"],
  Tripoli: ["El Mina", "Al Tall", "Old City", "Al Bahsas"],
  Sidon: ["Abra", "Old Souk", "Majdelyoun"],
  Jounieh: ["Kaslik", "Haret Sakher", "Maameltein"],
  Byblos: ["Old Souk", "Jbeil Port", "Blat"],
  Zahle: ["Ksara", "Maallaqa", "Boulevard"],
  Baalbek: ["City Center", "Ras Al Ain"],
  Tyre: ["Al Bass", "Old City"],
  Nabatieh: ["City Center"],
  Aley: ["Aley Center", "Sofar"],
};

// Common amenities
export const AMENITIES = [
  "Parking",
  "Changing Rooms",
  "Showers",
  "Floodlights",
  "Water Station",
  "Spectator Area",
  "Cafe/Snack Bar",
  "Equipment Rental",
  "First Aid",
  "Lockers",
  "AC",
  "WiFi",
];

// Max players options
export const MAX_PLAYERS_OPTIONS = [4, 5, 6, 7, 8, 10, 11, 12, 14, 16, 20, 22];

// Price range options
export const PRICE_RANGES = [10, 15, 20, 25, 30, 35, 40, 50, 60, 75, 100, 125, 150, 200];

// Allowed booking durations (in hours)
export const DURATION_OPTIONS = [1, 1.5, 2, 2.5, 3];

// Rating options for filters
export const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "4", label: "4+ Stars" },
  { value: "3", label: "3+ Stars" },
  { value: "2", label: "2+ Stars" },
];

// Sort options for search results
export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" },
  { value: "distance", label: "Nearest First" },
];

