'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DirtUnit, DirtType } from '@/types';
import { projects } from '@/data/projects';
import { superintendents } from '@/data/superintendents';
import {
  convertUnits,
  DEFAULT_DENSITY_FACTOR,
  DEFAULT_WASTE_FACTOR,
  getUnitShortLabel,
} from '@/lib/conversions';
import { saveEntry, generateId, initializeWithSeedData } from '@/lib/storage';
import { seedEntries } from '@/data/seedEntries';

export default function EntryPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<DirtType>('has');
  const [projectId, setProjectId] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState<DirtUnit>('CY');
  const [densityFactor, setDensityFactor] = useState(DEFAULT_DENSITY_FACTOR);
  const [wasteFactor, setWasteFactor] = useState(DEFAULT_WASTE_FACTOR);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);

  useEffect(() => {
    initializeWithSeedData(seedEntries);
  }, []);

  const numQuantity = parseFloat(quantity) || 0;
  const conversion = convertUnits(numQuantity, unit, densityFactor, wasteFactor);

  const filteredProjects = projects.filter(p =>
    projectSearch === '' ||
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.id.includes(projectSearch)
  );

  const handleNameChange = (value: string) => {
    setName(value);
    if (value.length >= 2) {
      const matches = superintendents
        .map(s => s.name)
        .filter(n => n.toLowerCase().includes(value.toLowerCase()));
      setNameSuggestions(matches);
      setShowNameSuggestions(matches.length > 0);
    } else {
      setShowNameSuggestions(false);
    }
  };

  const handleSubmit = () => {
    if (!name || !projectId || !quantity || numQuantity <= 0) return;

    saveEntry({
      id: generateId(),
      superintendentName: name,
      type,
      projectId,
      quantity: numQuantity,
      unit,
      quantityCY: conversion.cy,
      quantityTN: conversion.tn,
      quantityLoads: conversion.loads,
      densityFactor,
      wasteFactor,
      timestamp: new Date().toISOString(),
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Reset form
      setName('');
      setProjectId('');
      setQuantity('');
      setProjectSearch('');
    }, 2000);
  };

  const isValid = name && projectId && numQuantity > 0;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-ps-navy">Register Dirt</h2>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-xl text-center font-semibold animate-pulse">
          Entry registered successfully!
        </div>
      )}

      {/* Superintendent Name */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
        <label className="block text-sm font-semibold text-ps-gray-600 mb-2">
          Superintendent Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
            placeholder="Enter your name..."
            className="w-full px-4 py-3 border border-ps-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-ps-navy focus:border-ps-navy outline-none"
          />
          {showNameSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-ps-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {nameSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setName(suggestion);
                    setShowNameSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-ps-gray-50 text-ps-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Type Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
        <label className="block text-sm font-semibold text-ps-gray-600 mb-3">
          What do you need?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType('has')}
            className={`py-4 px-4 rounded-xl font-bold text-lg transition-all ${
              type === 'has'
                ? 'bg-ps-lime text-white shadow-md scale-105'
                : 'bg-ps-gray-100 text-ps-gray-500 hover:bg-ps-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
            I Have Dirt
          </button>
          <button
            type="button"
            onClick={() => setType('needs')}
            className={`py-4 px-4 rounded-xl font-bold text-lg transition-all ${
              type === 'needs'
                ? 'bg-ps-red text-white shadow-md scale-105'
                : 'bg-ps-gray-100 text-ps-gray-500 hover:bg-ps-gray-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
            I Need Dirt
          </button>
        </div>
      </div>

      {/* Project Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
        <label className="block text-sm font-semibold text-ps-gray-600 mb-2">
          Project
        </label>
        <input
          type="text"
          value={projectSearch}
          onChange={(e) => setProjectSearch(e.target.value)}
          placeholder="Search by name or ID..."
          className="w-full px-4 py-2 mb-2 border border-ps-gray-300 rounded-lg focus:ring-2 focus:ring-ps-navy focus:border-ps-navy outline-none"
        />
        <select
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            const proj = projects.find(p => p.id === e.target.value);
            if (proj) setProjectSearch(proj.name);
          }}
          className="w-full px-4 py-3 border border-ps-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-ps-navy focus:border-ps-navy outline-none bg-white"
        >
          <option value="">Select a project...</option>
          {filteredProjects.map(p => (
            <option key={p.id} value={p.id}>
              {p.id} - {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity & Unit */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
        <label className="block text-sm font-semibold text-ps-gray-600 mb-2">
          Quantity
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            className="flex-1 px-4 py-3 border border-ps-gray-300 rounded-lg text-xl font-bold focus:ring-2 focus:ring-ps-navy focus:border-ps-navy outline-none"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as DirtUnit)}
            className="px-4 py-3 border border-ps-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-ps-navy focus:border-ps-navy outline-none bg-white min-w-[130px]"
          >
            <option value="CY">Cubic Yards</option>
            <option value="TN">Tons</option>
            <option value="LOADS">Loads</option>
          </select>
        </div>

        {/* Live Conversion */}
        {numQuantity > 0 && (
          <div className="mt-3 p-3 bg-ps-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-ps-gray-500 mb-2">Equivalent to:</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`p-2 rounded ${unit === 'CY' ? 'bg-ps-navy text-white' : 'bg-white'}`}>
                <p className="text-lg font-bold">{conversion.cy.toLocaleString()}</p>
                <p className="text-xs">CY</p>
              </div>
              <div className={`p-2 rounded ${unit === 'TN' ? 'bg-ps-navy text-white' : 'bg-white'}`}>
                <p className="text-lg font-bold">{conversion.tn.toLocaleString()}</p>
                <p className="text-xs">Tons</p>
              </div>
              <div className={`p-2 rounded ${unit === 'LOADS' ? 'bg-ps-navy text-white' : 'bg-white'}`}>
                <p className="text-lg font-bold">{conversion.loads.toLocaleString()}</p>
                <p className="text-xs">Loads</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-ps-gray-500"
        >
          <span>Advanced Settings</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showAdvanced && (
          <div className="px-4 pb-4 space-y-3">
            <div>
              <label className="block text-xs text-ps-gray-500 mb-1">
                Density Factor (TN/CY) - Default: 1.2
              </label>
              <input
                type="number"
                value={densityFactor}
                onChange={(e) => setDensityFactor(parseFloat(e.target.value) || DEFAULT_DENSITY_FACTOR)}
                step="0.1"
                min="0.1"
                className="w-full px-3 py-2 border border-ps-gray-300 rounded-lg focus:ring-2 focus:ring-ps-navy outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-ps-gray-500 mb-1">
                Waste Factor (%) - Default: 15%
              </label>
              <input
                type="number"
                value={wasteFactor}
                onChange={(e) => setWasteFactor(parseFloat(e.target.value) || DEFAULT_WASTE_FACTOR)}
                step="1"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-ps-gray-300 rounded-lg focus:ring-2 focus:ring-ps-navy outline-none"
              />
            </div>
            {numQuantity > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs font-semibold text-yellow-700 mb-1">With {wasteFactor}% waste factor:</p>
                <p className="text-sm text-yellow-800">
                  {conversion.cyWithWaste.toLocaleString()} CY | {conversion.tnWithWaste.toLocaleString()} TN | {conversion.loadsWithWaste.toLocaleString()} Loads
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid}
        className={`w-full py-4 rounded-xl font-bold text-xl shadow-md transition-all ${
          isValid
            ? type === 'has'
              ? 'bg-ps-lime text-white hover:bg-ps-lime-dark active:scale-95'
              : 'bg-ps-red text-white hover:bg-red-700 active:scale-95'
            : 'bg-ps-gray-300 text-ps-gray-500 cursor-not-allowed'
        }`}
      >
        {type === 'has' ? 'Register Available Dirt' : 'Register Dirt Needed'}
      </button>
    </div>
  );
}
