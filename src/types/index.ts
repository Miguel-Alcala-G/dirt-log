// ============================================================
// Dirt Log - Type Definitions
// ============================================================

export type DirtType = 'has' | 'needs';
export type DirtUnit = 'TN' | 'CY' | 'LOADS';

export interface Project {
  id: string;         // e.g., "24000"
  name: string;       // e.g., "Riverside Commons Phase II"
  address: string;
  lat: number;
  lng: number;
  county: string;     // e.g., "Duval", "St. Johns", "Clay", "Nassau"
}

export interface Superintendent {
  id: string;
  name: string;
  phone: string;      // (904) xxx-xxxx
  email: string;
  projectIds: string[];
}

export interface DirtEntry {
  id: string;
  superintendentName: string;
  type: DirtType;           // 'has' or 'needs'
  projectId: string;
  quantity: number;
  unit: DirtUnit;
  quantityCY: number;       // normalized to CY for comparison
  quantityTN: number;       // converted
  quantityLoads: number;    // converted
  densityFactor: number;    // default 1.2
  wasteFactor: number;      // default 15
  timestamp: string;        // ISO string
  notes?: string;
}

export interface ConversionResult {
  cy: number;
  tn: number;
  loads: number;
  cyWithWaste: number;
  tnWithWaste: number;
  loadsWithWaste: number;
}

export interface DashboardStats {
  totalAvailableCY: number;
  totalNeededCY: number;
  activeProjects: number;
  recentEntries: number;
}

// ============================================================
// Cost Analysis Types
// ============================================================

export interface CostInputs {
  sourceProjectId: string;
  destinationProjectId: string;
  quantityCY: number;
  truckHourlyRate: number;       // $/hr
  fuelPricePerGallon: number;    // $/gal
  truckMPG: number;              // miles per gallon (default 5)
  avgSpeedMPH: number;           // average truck speed (default 35)
  loadUnloadMinutes: number;     // per round trip (default 20)
  materialCostPerCY: number;     // $/CY from supplier
  haulingCostPerCY: number;      // $/CY supplier hauling
}

export interface CostResult {
  // Distance
  distanceMiles: number;
  roundTripMiles: number;
  // Trips
  numberOfTrips: number;
  totalMilesDriven: number;
  // Fuel
  totalGallons: number;
  totalFuelCost: number;
  // Time
  driveTimePerTrip: number;      // minutes (round trip)
  loadUnloadPerTrip: number;     // minutes
  totalTimePerTrip: number;      // minutes
  totalTimeAllTrips: number;     // hours
  totalLaborCost: number;
  // Move totals
  totalMoveCost: number;
  moveCostPerCY: number;
  moveCostPerTN: number;
  // Buy totals
  totalMaterialCost: number;
  totalHaulingCost: number;
  totalBuyCost: number;
  buyCostPerCY: number;
  // Comparison
  savings: number;               // positive = moving is cheaper
  recommendation: 'MOVE' | 'BUY';
}
