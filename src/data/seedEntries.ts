import { DirtEntry } from '@/types';
import { convertUnits, DEFAULT_DENSITY_FACTOR, DEFAULT_WASTE_FACTOR } from '@/lib/conversions';

function createEntry(
  id: string,
  name: string,
  type: 'has' | 'needs',
  projectId: string,
  quantity: number,
  unit: 'CY' | 'TN' | 'LOADS',
  daysAgo: number
): DirtEntry {
  const conv = convertUnits(quantity, unit, DEFAULT_DENSITY_FACTOR, DEFAULT_WASTE_FACTOR);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id,
    superintendentName: name,
    type,
    projectId,
    quantity,
    unit,
    quantityCY: conv.cy,
    quantityTN: conv.tn,
    quantityLoads: conv.loads,
    densityFactor: DEFAULT_DENSITY_FACTOR,
    wasteFactor: DEFAULT_WASTE_FACTOR,
    timestamp: date.toISOString(),
  };
}

export const seedEntries: DirtEntry[] = [
  createEntry("seed-001", "Carlos Martinez", "has", "24000", 500, "CY", 1),
  createEntry("seed-002", "James Thompson", "needs", "24001", 300, "TN", 1),
  createEntry("seed-003", "Robert Jenkins", "has", "24002", 45, "LOADS", 2),
  createEntry("seed-004", "Michael Davis", "needs", "24003", 200, "CY", 2),
  createEntry("seed-005", "David Rodriguez", "has", "24004", 800, "CY", 3),
  createEntry("seed-006", "William Foster", "needs", "24005", 150, "TN", 3),
  createEntry("seed-007", "Daniel Brown", "has", "24006", 1200, "CY", 4),
  createEntry("seed-008", "Chris Walker", "needs", "24008", 50, "LOADS", 4),
  createEntry("seed-009", "Steven Garcia", "has", "24009", 350, "CY", 5),
  createEntry("seed-010", "Jason Mitchell", "needs", "24010", 600, "CY", 5),
  createEntry("seed-011", "Kevin Anderson", "has", "24012", 420, "TN", 6),
  createEntry("seed-012", "Brian Wilson", "needs", "24014", 25, "LOADS", 6),
  createEntry("seed-013", "Mark Taylor", "has", "24015", 180, "CY", 7),
  createEntry("seed-014", "Paul Harris", "needs", "24019", 900, "CY", 7),
  createEntry("seed-015", "Eric Clark", "has", "24021", 550, "TN", 0),
  createEntry("seed-016", "Ryan Lewis", "needs", "24034", 75, "LOADS", 0),
  createEntry("seed-017", "Tommy Robinson", "has", "24035", 280, "CY", 1),
  createEntry("seed-018", "Andrew Martinez", "needs", "24036", 400, "CY", 1),
  createEntry("seed-019", "Jose Hernandez", "has", "24048", 650, "CY", 2),
  createEntry("seed-020", "Frank Cooper", "needs", "24030", 200, "TN", 2),
  createEntry("seed-021", "Carlos Martinez", "has", "24007", 320, "CY", 3),
  createEntry("seed-022", "James Thompson", "needs", "24022", 40, "LOADS", 3),
  createEntry("seed-023", "David Rodriguez", "has", "24023", 750, "CY", 4),
  createEntry("seed-024", "William Foster", "needs", "24020", 500, "CY", 4),
  createEntry("seed-025", "Daniel Brown", "has", "24011", 1000, "CY", 5),
  createEntry("seed-026", "Chris Walker", "needs", "24016", 300, "CY", 5),
  createEntry("seed-027", "Steven Garcia", "has", "24025", 450, "TN", 6),
  createEntry("seed-028", "Mark Taylor", "needs", "24018", 600, "CY", 7),
  createEntry("seed-029", "Eric Clark", "has", "24027", 200, "CY", 0),
  createEntry("seed-030", "Jose Hernandez", "needs", "24049", 350, "CY", 1),
];
