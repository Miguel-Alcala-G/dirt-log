'use client';

import { useState, useEffect, useMemo } from 'react';
import { DirtUnit, DirtEntry } from '@/types';
import { projects } from '@/data/projects';
import { convertUnits, LOAD_SIZE_CY, DEFAULT_DENSITY_FACTOR } from '@/lib/conversions';
import { getEntries, initializeWithSeedData } from '@/lib/storage';
import { seedEntries } from '@/data/seedEntries';
import {
  calculateCostAnalysis,
  formatCurrency,
  DEFAULT_TRUCK_MPG,
  DEFAULT_AVG_SPEED_MPH,
  DEFAULT_LOAD_UNLOAD_MIN,
  DEFAULT_TRUCK_HOURLY_RATE,
  DEFAULT_FUEL_PRICE,
  DEFAULT_MATERIAL_COST_PER_CY,
  DEFAULT_HAULING_COST_PER_CY,
} from '@/lib/costAnalysis';
import * as XLSX from 'xlsx';

export default function AnalysisPage() {
  // Project selection
  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  // Quantity
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<DirtUnit>('CY');

  // Transport parameters
  const [hourlyRate, setHourlyRate] = useState(DEFAULT_TRUCK_HOURLY_RATE);
  const [fuelPrice, setFuelPrice] = useState(DEFAULT_FUEL_PRICE);
  const [truckMPG, setTruckMPG] = useState(DEFAULT_TRUCK_MPG);
  const [avgSpeed, setAvgSpeed] = useState(DEFAULT_AVG_SPEED_MPH);
  const [loadUnload, setLoadUnload] = useState(DEFAULT_LOAD_UNLOAD_MIN);

  // Buy option
  const [materialCost, setMaterialCost] = useState(DEFAULT_MATERIAL_COST_PER_CY);
  const [haulingCost, setHaulingCost] = useState(DEFAULT_HAULING_COST_PER_CY);

  // UI state
  const [showTransportParams, setShowTransportParams] = useState(false);

  // Entries data — to filter projects that actually have/need dirt
  const [entries, setEntries] = useState<DirtEntry[]>([]);

  useEffect(() => {
    initializeWithSeedData(seedEntries);
    setEntries(getEntries());
  }, []);

  // Projects that have dirt registered (type === 'has')
  const sourceProjectIds = useMemo(() => {
    const ids = new Set(entries.filter(e => e.type === 'has').map(e => e.projectId));
    return ids;
  }, [entries]);

  // Projects that need dirt registered (type === 'needs')
  const destProjectIds = useMemo(() => {
    const ids = new Set(entries.filter(e => e.type === 'needs').map(e => e.projectId));
    return ids;
  }, [entries]);

  const sourceProjects = projects.filter(p => sourceProjectIds.has(p.id));
  const destProjects = projects.filter(p => destProjectIds.has(p.id));

  const numQuantity = parseFloat(quantity) || 0;
  const conversion = convertUnits(numQuantity, unit, DEFAULT_DENSITY_FACTOR, 0);
  const quantityCY = conversion.cy;

  // Filtered suggestions based on search text
  const filteredSource = sourceProjects.filter(p =>
    sourceSearch === '' ||
    p.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
    p.id.includes(sourceSearch)
  );
  const filteredDest = destProjects.filter(p =>
    destSearch === '' ||
    p.name.toLowerCase().includes(destSearch.toLowerCase()) ||
    p.id.includes(destSearch)
  );

  // Get total CY for a project by type
  const getProjectTotal = (projectId: string, type: 'has' | 'needs') => {
    return Math.round(entries.filter(e => e.projectId === projectId && e.type === type).reduce((sum, e) => sum + e.quantityCY, 0));
  };

  const result = useMemo(() => {
    if (!sourceId || !destId || quantityCY <= 0) return null;
    return calculateCostAnalysis({
      sourceProjectId: sourceId,
      destinationProjectId: destId,
      quantityCY,
      truckHourlyRate: hourlyRate,
      fuelPricePerGallon: fuelPrice,
      truckMPG,
      avgSpeedMPH: avgSpeed,
      loadUnloadMinutes: loadUnload,
      materialCostPerCY: materialCost,
      haulingCostPerCY: haulingCost,
    });
  }, [sourceId, destId, quantityCY, hourlyRate, fuelPrice, truckMPG, avgSpeed, loadUnload, materialCost, haulingCost]);

  const sourceProject = projects.find(p => p.id === sourceId);
  const destProject = projects.find(p => p.id === destId);

  const handleExport = () => {
    if (!result || !sourceProject || !destProject) return;
    const data = [
      { 'Parameter': 'Source Project', 'Value': `${sourceProject.id} - ${sourceProject.name}` },
      { 'Parameter': 'Source Address', 'Value': sourceProject.address },
      { 'Parameter': 'Destination Project', 'Value': `${destProject.id} - ${destProject.name}` },
      { 'Parameter': 'Destination Address', 'Value': destProject.address },
      { 'Parameter': '', 'Value': '' },
      { 'Parameter': 'Quantity (CY)', 'Value': quantityCY },
      { 'Parameter': 'Quantity (TN)', 'Value': conversion.tn },
      { 'Parameter': 'Quantity (Loads)', 'Value': conversion.loads },
      { 'Parameter': '', 'Value': '' },
      { 'Parameter': '--- MOVE OPTION ---', 'Value': '' },
      { 'Parameter': 'Distance (one-way)', 'Value': `${result.distanceMiles} mi` },
      { 'Parameter': 'Round Trip Distance', 'Value': `${result.roundTripMiles} mi` },
      { 'Parameter': 'Number of Trips', 'Value': result.numberOfTrips },
      { 'Parameter': 'Total Miles Driven', 'Value': result.totalMilesDriven },
      { 'Parameter': 'Fuel Consumed', 'Value': `${result.totalGallons} gal` },
      { 'Parameter': 'Fuel Cost', 'Value': formatCurrency(result.totalFuelCost) },
      { 'Parameter': 'Total Time', 'Value': `${result.totalTimeAllTrips} hrs` },
      { 'Parameter': 'Labor Cost', 'Value': formatCurrency(result.totalLaborCost) },
      { 'Parameter': 'TOTAL MOVE COST', 'Value': formatCurrency(result.totalMoveCost) },
      { 'Parameter': 'Move Cost/CY', 'Value': formatCurrency(result.moveCostPerCY) },
      { 'Parameter': '', 'Value': '' },
      { 'Parameter': '--- BUY OPTION ---', 'Value': '' },
      { 'Parameter': 'Material Cost', 'Value': formatCurrency(result.totalMaterialCost) },
      { 'Parameter': 'Hauling Cost', 'Value': formatCurrency(result.totalHaulingCost) },
      { 'Parameter': 'TOTAL BUY COST', 'Value': formatCurrency(result.totalBuyCost) },
      { 'Parameter': 'Buy Cost/CY', 'Value': formatCurrency(result.buyCostPerCY) },
      { 'Parameter': '', 'Value': '' },
      { 'Parameter': 'RECOMMENDATION', 'Value': result.recommendation },
      { 'Parameter': 'Savings', 'Value': formatCurrency(Math.abs(result.savings)) },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 25 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cost Analysis');
    XLSX.writeFile(wb, `cost-analysis-${sourceId}-to-${destId}.xlsx`);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-ps-navy">Cost Analysis</h2>
      <p className="text-sm text-ps-gray-500">Compare the cost of moving dirt between projects vs buying from a supplier</p>

      {/* Project Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-ps-gray-600">Select Projects</h3>

        {/* Source */}
        <div className="relative">
          <label className="block text-xs text-ps-lime-dark font-semibold mb-1">
            Source — Has Dirt
            <span className="text-ps-gray-400 font-normal ml-1">({sourceProjects.length} projects)</span>
          </label>
          <input
            type="text"
            value={sourceSearch}
            onChange={(e) => {
              setSourceSearch(e.target.value);
              setShowSourceSuggestions(true);
              if (!e.target.value) setSourceId('');
            }}
            onFocus={() => setShowSourceSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSourceSuggestions(false), 200)}
            placeholder="Type to search projects with available dirt..."
            className="w-full px-3 py-2 border border-ps-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ps-lime outline-none"
          />
          {showSourceSuggestions && filteredSource.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-ps-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredSource.map(p => {
                const totalCY = getProjectTotal(p.id, 'has');
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSourceId(p.id);
                      setSourceSearch(`${p.id} - ${p.name}`);
                      setShowSourceSuggestions(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-green-50 border-b border-ps-gray-50 last:border-0 ${
                      sourceId === p.id ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-ps-gray-700">{p.id} - {p.name}</span>
                      <span className="text-xs font-bold text-ps-lime-dark ml-2 whitespace-nowrap">+{totalCY.toLocaleString()} CY</span>
                    </div>
                    <p className="text-xs text-ps-gray-400 truncate">{p.address}</p>
                  </button>
                );
              })}
            </div>
          )}
          {showSourceSuggestions && sourceSearch && filteredSource.length === 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-ps-gray-200 rounded-lg shadow-lg p-3 text-center text-sm text-ps-gray-400">
              No projects with available dirt match your search
            </div>
          )}
        </div>

        {/* Destination */}
        <div className="relative">
          <label className="block text-xs text-ps-red font-semibold mb-1">
            Destination — Needs Dirt
            <span className="text-ps-gray-400 font-normal ml-1">({destProjects.length} projects)</span>
          </label>
          <input
            type="text"
            value={destSearch}
            onChange={(e) => {
              setDestSearch(e.target.value);
              setShowDestSuggestions(true);
              if (!e.target.value) setDestId('');
            }}
            onFocus={() => setShowDestSuggestions(true)}
            onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
            placeholder="Type to search projects that need dirt..."
            className="w-full px-3 py-2 border border-ps-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ps-red outline-none"
          />
          {showDestSuggestions && filteredDest.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-ps-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredDest.map(p => {
                const totalCY = getProjectTotal(p.id, 'needs');
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setDestId(p.id);
                      setDestSearch(`${p.id} - ${p.name}`);
                      setShowDestSuggestions(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-red-50 border-b border-ps-gray-50 last:border-0 ${
                      destId === p.id ? 'bg-red-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-ps-gray-700">{p.id} - {p.name}</span>
                      <span className="text-xs font-bold text-ps-red ml-2 whitespace-nowrap">-{totalCY.toLocaleString()} CY</span>
                    </div>
                    <p className="text-xs text-ps-gray-400 truncate">{p.address}</p>
                  </button>
                );
              })}
            </div>
          )}
          {showDestSuggestions && destSearch && filteredDest.length === 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-ps-gray-200 rounded-lg shadow-lg p-3 text-center text-sm text-ps-gray-400">
              No projects needing dirt match your search
            </div>
          )}
        </div>

        {/* Distance Badge */}
        {result && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-ps-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-ps-navy" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <span className="text-lg font-bold text-ps-navy">{result.distanceMiles} miles</span>
            <span className="text-xs text-ps-gray-400">(straight line)</span>
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
        <h3 className="text-sm font-semibold text-ps-gray-600 mb-2">Quantity to Move</h3>
        <div className="flex gap-3">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            min="0"
            className="flex-1 px-4 py-3 border border-ps-gray-300 rounded-lg text-xl font-bold focus:ring-2 focus:ring-ps-navy outline-none text-center"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as DirtUnit)}
            className="px-3 py-3 border border-ps-gray-300 rounded-lg font-semibold bg-white focus:ring-2 focus:ring-ps-navy outline-none"
          >
            <option value="CY">CY</option>
            <option value="TN">Tons</option>
            <option value="LOADS">Loads</option>
          </select>
        </div>
        {quantityCY > 0 && (
          <div className="mt-2 flex items-center justify-center gap-3 text-sm text-ps-gray-500">
            <span><strong>{conversion.cy}</strong> CY</span>
            <span>•</span>
            <span><strong>{conversion.tn}</strong> TN</span>
            <span>•</span>
            <span><strong>{conversion.loads}</strong> Loads</span>
            <span>•</span>
            <span className="text-ps-navy font-semibold">{Math.ceil(quantityCY / LOAD_SIZE_CY)} trips</span>
          </div>
        )}
      </div>

      {/* Transport Parameters */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200">
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-ps-gray-600">Transport Costs (Move Option)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ps-gray-500 mb-1">Truck Rate ($/hr)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ps-gray-400">$</span>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 border border-ps-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ps-navy outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-ps-gray-500 mb-1">Fuel Price ($/gal)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ps-gray-400">$</span>
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  className="w-full pl-7 pr-3 py-2 border border-ps-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ps-navy outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced transport params */}
        <button
          onClick={() => setShowTransportParams(!showTransportParams)}
          className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-ps-gray-400 border-t border-ps-gray-100"
        >
          <span>Advanced Parameters</span>
          <svg xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 transition-transform ${showTransportParams ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showTransportParams && (
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className="flex justify-between text-xs text-ps-gray-500 mb-1">
                <span>Truck MPG (loaded)</span>
                <span className="font-bold text-ps-navy">{truckMPG} MPG</span>
              </label>
              <input
                type="range" min="2" max="10" step="0.5" value={truckMPG}
                onChange={(e) => setTruckMPG(parseFloat(e.target.value))}
                className="w-full accent-ps-navy"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs text-ps-gray-500 mb-1">
                <span>Average Speed</span>
                <span className="font-bold text-ps-navy">{avgSpeed} MPH</span>
              </label>
              <input
                type="range" min="15" max="60" step="5" value={avgSpeed}
                onChange={(e) => setAvgSpeed(parseFloat(e.target.value))}
                className="w-full accent-ps-navy"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs text-ps-gray-500 mb-1">
                <span>Load/Unload Time (per trip)</span>
                <span className="font-bold text-ps-navy">{loadUnload} min</span>
              </label>
              <input
                type="range" min="5" max="45" step="5" value={loadUnload}
                onChange={(e) => setLoadUnload(parseFloat(e.target.value))}
                className="w-full accent-ps-navy"
              />
            </div>
          </div>
        )}
      </div>

      {/* Buy Option */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
        <h3 className="text-sm font-semibold text-ps-gray-600 mb-3">Buy Option (Supplier Pricing)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ps-gray-500 mb-1">Material ($/CY)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ps-gray-400">$</span>
              <input
                type="number"
                value={materialCost}
                onChange={(e) => setMaterialCost(parseFloat(e.target.value) || 0)}
                step="0.50"
                className="w-full pl-7 pr-3 py-2 border border-ps-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ps-navy outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ps-gray-500 mb-1">Hauling ($/CY)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ps-gray-400">$</span>
              <input
                type="number"
                value={haulingCost}
                onChange={(e) => setHaulingCost(parseFloat(e.target.value) || 0)}
                step="0.50"
                className="w-full pl-7 pr-3 py-2 border border-ps-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ps-navy outline-none"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-ps-gray-400 mt-2">
          Combined: {formatCurrency(materialCost + haulingCost)}/CY from supplier
        </p>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Recommendation Banner */}
          <div className={`rounded-xl p-4 text-center shadow-md ${
            result.recommendation === 'MOVE'
              ? 'bg-ps-lime text-white'
              : 'bg-ps-red text-white'
          }`}>
            <p className="text-sm font-semibold opacity-90">Recommendation</p>
            <p className="text-3xl font-bold mt-1">
              {result.recommendation === 'MOVE' ? 'MOVE IT' : 'BUY IT'}
            </p>
            <p className="text-lg mt-1">
              Save {formatCurrency(Math.abs(result.savings))}
              <span className="text-sm opacity-80"> ({formatCurrency(Math.abs(result.savings) / quantityCY)}/CY)</span>
            </p>
          </div>

          {/* Side by Side Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* MOVE Card */}
            <div className={`bg-white rounded-xl shadow-sm border-2 ${
              result.recommendation === 'MOVE' ? 'border-ps-lime' : 'border-ps-gray-200'
            } p-4`}>
              <div className="flex items-center gap-2 mb-3">
                {result.recommendation === 'MOVE' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-ps-lime" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <h4 className="font-bold text-ps-navy">MOVE</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ps-gray-500">Distance</span>
                  <span className="font-semibold">{result.distanceMiles} mi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ps-gray-500">Trips</span>
                  <span className="font-semibold">{result.numberOfTrips}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ps-gray-500">Total Miles</span>
                  <span className="font-semibold">{result.totalMilesDriven.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ps-gray-500">Fuel</span>
                  <span className="font-semibold">{result.totalGallons} gal</span>
                </div>
                <div className="flex justify-between text-ps-gray-500">
                  <span>Fuel Cost</span>
                  <span>{formatCurrency(result.totalFuelCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ps-gray-500">Time</span>
                  <span className="font-semibold">{result.totalTimeAllTrips} hrs</span>
                </div>
                <div className="flex justify-between text-ps-gray-500">
                  <span>Labor Cost</span>
                  <span>{formatCurrency(result.totalLaborCost)}</span>
                </div>
                <div className="border-t border-ps-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-ps-navy">TOTAL</span>
                    <span className="font-bold text-ps-navy text-lg">{formatCurrency(result.totalMoveCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-ps-gray-400">
                    <span></span>
                    <span>{formatCurrency(result.moveCostPerCY)}/CY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BUY Card */}
            <div className={`bg-white rounded-xl shadow-sm border-2 ${
              result.recommendation === 'BUY' ? 'border-ps-red' : 'border-ps-gray-200'
            } p-4`}>
              <div className="flex items-center gap-2 mb-3">
                {result.recommendation === 'BUY' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-ps-red" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <h4 className="font-bold text-ps-navy">BUY</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ps-gray-500">Material</span>
                  <span className="font-semibold">{formatCurrency(materialCost)}/CY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ps-gray-500">Hauling</span>
                  <span className="font-semibold">{formatCurrency(haulingCost)}/CY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ps-gray-500">Combined</span>
                  <span className="font-semibold">{formatCurrency(materialCost + haulingCost)}/CY</span>
                </div>
                <div className="h-px"></div>
                <div className="flex justify-between text-ps-gray-500">
                  <span>Material Total</span>
                  <span>{formatCurrency(result.totalMaterialCost)}</span>
                </div>
                <div className="flex justify-between text-ps-gray-500">
                  <span>Hauling Total</span>
                  <span>{formatCurrency(result.totalHaulingCost)}</span>
                </div>
                <div className="h-px"></div>
                <div className="h-px"></div>
                <div className="border-t border-ps-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-ps-navy">TOTAL</span>
                    <span className="font-bold text-ps-navy text-lg">{formatCurrency(result.totalBuyCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-ps-gray-400">
                    <span></span>
                    <span>{formatCurrency(result.buyCostPerCY)}/CY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export */}
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-3 bg-ps-navy text-white font-semibold rounded-xl hover:bg-ps-navy-light transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export Analysis to Excel
          </button>
        </>
      )}

      {/* Empty state */}
      {!result && (
        <div className="bg-ps-gray-50 rounded-xl border border-ps-gray-200 p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-ps-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-ps-gray-400 font-semibold">Select two projects and enter a quantity</p>
          <p className="text-xs text-ps-gray-300 mt-1">The cost analysis will appear here</p>
        </div>
      )}
    </div>
  );
}
