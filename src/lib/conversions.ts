import { DirtUnit, ConversionResult } from '@/types';

// Default constants
export const DEFAULT_DENSITY_FACTOR = 1.2;  // TN per CY
export const DEFAULT_WASTE_FACTOR = 15;     // percentage
export const LOAD_SIZE_CY = 16;             // CY per Load

/**
 * Convert a quantity from any unit to all three units
 */
export function convertUnits(
  quantity: number,
  fromUnit: DirtUnit,
  densityFactor: number = DEFAULT_DENSITY_FACTOR,
  wasteFactor: number = DEFAULT_WASTE_FACTOR
): ConversionResult {
  let cy: number;

  // First normalize to CY
  switch (fromUnit) {
    case 'CY':
      cy = quantity;
      break;
    case 'TN':
      cy = quantity / densityFactor;
      break;
    case 'LOADS':
      cy = quantity * LOAD_SIZE_CY;
      break;
    default:
      cy = quantity;
  }

  // Calculate all units from CY
  const tn = cy * densityFactor;
  const loads = cy / LOAD_SIZE_CY;

  // Apply waste factor
  const wasteMultiplier = 1 + (wasteFactor / 100);

  return {
    cy: round2(cy),
    tn: round2(tn),
    loads: round2(loads),
    cyWithWaste: round2(cy * wasteMultiplier),
    tnWithWaste: round2(tn * wasteMultiplier),
    loadsWithWaste: round2(loads * wasteMultiplier),
  };
}

/**
 * Convert a quantity from one unit to CY (for normalization/storage)
 */
export function toCY(
  quantity: number,
  fromUnit: DirtUnit,
  densityFactor: number = DEFAULT_DENSITY_FACTOR
): number {
  switch (fromUnit) {
    case 'CY':
      return round2(quantity);
    case 'TN':
      return round2(quantity / densityFactor);
    case 'LOADS':
      return round2(quantity * LOAD_SIZE_CY);
    default:
      return round2(quantity);
  }
}

/**
 * Get unit display label
 */
export function getUnitLabel(unit: DirtUnit): string {
  switch (unit) {
    case 'CY': return 'Cubic Yards';
    case 'TN': return 'Tons';
    case 'LOADS': return 'Loads';
    default: return unit;
  }
}

/**
 * Get short unit label
 */
export function getUnitShortLabel(unit: DirtUnit): string {
  switch (unit) {
    case 'CY': return 'CY';
    case 'TN': return 'TN';
    case 'LOADS': return 'Loads';
    default: return unit;
  }
}

/**
 * Round to 2 decimal places
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate distance between two GPS coordinates (in miles)
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return round2(R * c);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
