import * as XLSX from 'xlsx';
import { DirtEntry } from '@/types';
import { projects } from '@/data/projects';
import { getUnitLabel } from './conversions';

/**
 * Export dirt entries to an Excel file
 */
export function exportToExcel(entries: DirtEntry[], filename: string = 'dirt-log-export'): void {
  const projectMap = new Map(projects.map(p => [p.id, p]));

  const data = entries.map(entry => {
    const project = projectMap.get(entry.projectId);
    return {
      'Date': new Date(entry.timestamp).toLocaleDateString('en-US'),
      'Time': new Date(entry.timestamp).toLocaleTimeString('en-US'),
      'Superintendent': entry.superintendentName,
      'Type': entry.type === 'has' ? 'HAS DIRT' : 'NEEDS DIRT',
      'Project ID': entry.projectId,
      'Project Name': project?.name || 'Unknown',
      'Project Address': project?.address || 'Unknown',
      'Quantity': entry.quantity,
      'Unit': getUnitLabel(entry.unit),
      'Cubic Yards (CY)': entry.quantityCY,
      'Tons (TN)': entry.quantityTN,
      'Loads': entry.quantityLoads,
      'Density Factor': entry.densityFactor,
      'Waste Factor (%)': entry.wasteFactor,
      'Notes': entry.notes || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 12 }, // Time
    { wch: 20 }, // Superintendent
    { wch: 12 }, // Type
    { wch: 12 }, // Project ID
    { wch: 35 }, // Project Name
    { wch: 40 }, // Project Address
    { wch: 12 }, // Quantity
    { wch: 14 }, // Unit
    { wch: 16 }, // CY
    { wch: 12 }, // TN
    { wch: 10 }, // Loads
    { wch: 14 }, // Density
    { wch: 14 }, // Waste
    { wch: 30 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dirt Log');

  // Add summary sheet
  const summaryData = createSummary(entries, projectMap);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [
    { wch: 12 }, { wch: 35 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary by Project');

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function createSummary(
  entries: DirtEntry[],
  projectMap: Map<string, { id: string; name: string }>
) {
  const projectTotals = new Map<string, { has: number; needs: number }>();

  entries.forEach(entry => {
    const current = projectTotals.get(entry.projectId) || { has: 0, needs: 0 };
    if (entry.type === 'has') {
      current.has += entry.quantityCY;
    } else {
      current.needs += entry.quantityCY;
    }
    projectTotals.set(entry.projectId, current);
  });

  return Array.from(projectTotals.entries()).map(([projectId, totals]) => {
    const project = projectMap.get(projectId);
    return {
      'Project ID': projectId,
      'Project Name': project?.name || 'Unknown',
      'Available (CY)': Math.round(totals.has * 100) / 100,
      'Needed (CY)': Math.round(totals.needs * 100) / 100,
      'Net (CY)': Math.round((totals.has - totals.needs) * 100) / 100,
      'Status': totals.has > totals.needs ? 'SURPLUS' : totals.needs > totals.has ? 'DEFICIT' : 'BALANCED',
    };
  });
}
