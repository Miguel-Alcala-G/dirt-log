'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DirtEntry, DirtUnit, DashboardStats } from '@/types';
import { getEntries, initializeWithSeedData } from '@/lib/storage';
import { seedEntries } from '@/data/seedEntries';
import { projects } from '@/data/projects';
import { getUnitShortLabel, getUnitLabel } from '@/lib/conversions';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

export default function DashboardPage() {
  const [entries, setEntries] = useState<DirtEntry[]>([]);
  const [chartUnit, setChartUnit] = useState<DirtUnit>('CY');
  const [stats, setStats] = useState<DashboardStats>({
    totalAvailableCY: 0,
    totalNeededCY: 0,
    activeProjects: 0,
    recentEntries: 0,
  });

  useEffect(() => {
    initializeWithSeedData(seedEntries);
    const data = getEntries();
    setEntries(data);

    const projectSet = new Set(data.map(e => e.projectId));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    setStats({
      totalAvailableCY: Math.round(data.filter(e => e.type === 'has').reduce((sum, e) => sum + e.quantityCY, 0)),
      totalNeededCY: Math.round(data.filter(e => e.type === 'needs').reduce((sum, e) => sum + e.quantityCY, 0)),
      activeProjects: projectSet.size,
      recentEntries: data.filter(e => new Date(e.timestamp) >= sevenDaysAgo).length,
    });
  }, []);

  // Helper to get the quantity in the selected unit
  const getQty = (entry: DirtEntry): number => {
    switch (chartUnit) {
      case 'TN': return entry.quantityTN;
      case 'LOADS': return entry.quantityLoads;
      default: return entry.quantityCY;
    }
  };

  const unitLabel = getUnitShortLabel(chartUnit);
  const unitFullLabel = getUnitLabel(chartUnit);

  // Stats in selected unit
  const totalAvailable = Math.round(entries.filter(e => e.type === 'has').reduce((sum, e) => sum + getQty(e), 0));
  const totalNeeded = Math.round(entries.filter(e => e.type === 'needs').reduce((sum, e) => sum + getQty(e), 0));

  // Build chart data: net per project in selected unit
  const projectMap = new Map(projects.map(p => [p.id, p.name]));
  const projectCountyMap = new Map(projects.map(p => [p.id, p.county]));
  const projectTotals = new Map<string, { has: number; needs: number }>();
  entries.forEach(entry => {
    const cur = projectTotals.get(entry.projectId) || { has: 0, needs: 0 };
    if (entry.type === 'has') cur.has += getQty(entry);
    else cur.needs += getQty(entry);
    projectTotals.set(entry.projectId, cur);
  });

  const chartData = Array.from(projectTotals.entries())
    .map(([id, totals]) => ({
      name: (projectMap.get(id) || id).substring(0, 20),
      net: Math.round(totals.has - totals.needs),
      fullName: projectMap.get(id) || id,
    }))
    .sort((a, b) => b.net - a.net);

  // Build county chart data: available dirt by county
  const countyTotals = new Map<string, number>();
  entries.filter(e => e.type === 'has').forEach(entry => {
    const county = projectCountyMap.get(entry.projectId) || 'Unknown';
    countyTotals.set(county, (countyTotals.get(county) || 0) + getQty(entry));
  });

  const countyChartData = Array.from(countyTotals.entries())
    .map(([county, available]) => ({ county, available: Math.round(available) }))
    .sort((a, b) => b.available - a.available);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-ps-lime-dark" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-ps-gray-500">Available</p>
              <p className="text-2xl font-bold text-ps-lime-dark">{totalAvailable.toLocaleString()}</p>
              <p className="text-xs text-ps-gray-400">{unitFullLabel}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-ps-red" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-ps-gray-500">Needed</p>
              <p className="text-2xl font-bold text-ps-red">{totalNeeded.toLocaleString()}</p>
              <p className="text-xs text-ps-gray-400">{unitFullLabel}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-ps-navy" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-ps-gray-500">Active Projects</p>
              <p className="text-2xl font-bold text-ps-navy">{stats.activeProjects}</p>
              <p className="text-xs text-ps-gray-400">With entries</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-ps-navy" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-ps-gray-500">Last 7 Days</p>
              <p className="text-2xl font-bold text-ps-navy">{stats.recentEntries}</p>
              <p className="text-xs text-ps-gray-400">Entries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Selector */}
      <div className="flex gap-2 justify-center">
        {(['CY', 'TN', 'LOADS'] as DirtUnit[]).map(unit => (
          <button
            key={unit}
            onClick={() => setChartUnit(unit)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              chartUnit === unit
                ? 'bg-ps-navy text-white'
                : 'bg-gray-100 text-ps-gray-500 hover:bg-gray-200'
            }`}
          >
            {getUnitShortLabel(unit)}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
        <h2 className="text-lg font-bold text-ps-navy mb-4">Net Dirt by Project ({unitLabel})</h2>
        <p className="text-xs text-ps-gray-400 mb-2">Green = Surplus | Red = Deficit</p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 28)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={140}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()} ${unitLabel}`, 'Net']}
                labelFormatter={(label: string) => {
                  const item = chartData.find(d => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Legend />
              <Bar dataKey="net" name={`Net ${unitLabel}`} radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.net >= 0 ? '#7CB342' : '#DC2626'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-ps-gray-400 text-center py-8">No entries yet</p>
        )}
      </div>

      {/* County Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
        <h2 className="text-lg font-bold text-ps-navy mb-1">Available Dirt by County ({unitLabel})</h2>
        <p className="text-xs text-ps-gray-400 mb-4">Surplus inventory by location — useful for identifying potential buyers</p>
        {countyChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={countyChartData} margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="county" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => [`${value.toLocaleString()} ${unitLabel}`, 'Available']} />
              <Bar dataKey="available" name={`Available ${unitLabel}`} fill="#7CB342" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-ps-gray-400 text-center py-8">No available dirt entries</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/entry" className="flex flex-col items-center gap-2 bg-ps-lime text-white font-bold py-4 px-3 rounded-xl shadow-sm hover:bg-ps-lime-dark transition-colors text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="text-sm">Register</span>
        </Link>

        <Link href="/map" className="flex flex-col items-center gap-2 bg-ps-navy text-white font-bold py-4 px-3 rounded-xl shadow-sm hover:bg-ps-navy-light transition-colors text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
          <span className="text-sm">View Map</span>
        </Link>

        <Link href="/query" className="flex flex-col items-center gap-2 bg-ps-navy text-white font-bold py-4 px-3 rounded-xl shadow-sm hover:bg-ps-navy-light transition-colors text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span className="text-sm">Query</span>
        </Link>
      </div>
    </div>
  );
}
