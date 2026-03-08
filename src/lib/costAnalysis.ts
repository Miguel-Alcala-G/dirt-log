import { CostInputs, CostResult } from '@/types';
import { calculateDistance, LOAD_SIZE_CY, DEFAULT_DENSITY_FACTOR } from './conversions';
import { projects } from '@/data/projects';

// Default constants
export const DEFAULT_TRUCK_MPG = 5;
export const DEFAULT_AVG_SPEED_MPH = 35;
export const DEFAULT_LOAD_UNLOAD_MIN = 20;
export const DEFAULT_TRUCK_HOURLY_RATE = 85;
export const DEFAULT_FUEL_PRICE = 3.50;
export const DEFAULT_MATERIAL_COST_PER_CY = 8.50;
export const DEFAULT_HAULING_COST_PER_CY = 4.00;

/**
 * Calculate the full cost analysis for moving dirt between two projects
 * vs buying from a supplier.
 */
export function calculateCostAnalysis(inputs: CostInputs): CostResult | null {
  const sourceProject = projects.find(p => p.id === inputs.sourceProjectId);
  const destProject = projects.find(p => p.id === inputs.destinationProjectId);

  if (!sourceProject || !destProject || inputs.quantityCY <= 0) {
    return null;
  }

  // Distance
  const distanceMiles = calculateDistance(
    sourceProject.lat, sourceProject.lng,
    destProject.lat, destProject.lng
  );
  const roundTripMiles = round2(distanceMiles * 2);

  // Trips
  const numberOfTrips = Math.ceil(inputs.quantityCY / LOAD_SIZE_CY);
  const totalMilesDriven = round2(roundTripMiles * numberOfTrips);

  // Fuel
  const totalGallons = round2(totalMilesDriven / inputs.truckMPG);
  const totalFuelCost = round2(totalGallons * inputs.fuelPricePerGallon);

  // Time
  const driveTimePerTrip = round2((roundTripMiles / inputs.avgSpeedMPH) * 60); // minutes
  const loadUnloadPerTrip = inputs.loadUnloadMinutes;
  const totalTimePerTrip = round2(driveTimePerTrip + loadUnloadPerTrip); // minutes
  const totalTimeAllTrips = round2((totalTimePerTrip * numberOfTrips) / 60); // hours
  const totalLaborCost = round2(totalTimeAllTrips * inputs.truckHourlyRate);

  // Move totals
  const totalMoveCost = round2(totalFuelCost + totalLaborCost);
  const moveCostPerCY = round2(totalMoveCost / inputs.quantityCY);
  const moveCostPerTN = round2(moveCostPerCY / DEFAULT_DENSITY_FACTOR);

  // Buy totals
  const totalMaterialCost = round2(inputs.quantityCY * inputs.materialCostPerCY);
  const totalHaulingCost = round2(inputs.quantityCY * inputs.haulingCostPerCY);
  const totalBuyCost = round2(totalMaterialCost + totalHaulingCost);
  const buyCostPerCY = round2(totalBuyCost / inputs.quantityCY);

  // Comparison
  const savings = round2(totalBuyCost - totalMoveCost);
  const recommendation = savings > 0 ? 'MOVE' as const : 'BUY' as const;

  return {
    distanceMiles,
    roundTripMiles,
    numberOfTrips,
    totalMilesDriven,
    totalGallons,
    totalFuelCost,
    driveTimePerTrip,
    loadUnloadPerTrip,
    totalTimePerTrip,
    totalTimeAllTrips,
    totalLaborCost,
    totalMoveCost,
    moveCostPerCY,
    moveCostPerTN,
    totalMaterialCost,
    totalHaulingCost,
    totalBuyCost,
    buyCostPerCY,
    savings,
    recommendation,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Format a number as USD currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
