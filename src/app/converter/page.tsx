'use client';

import { useState } from 'react';
import { DirtUnit } from '@/types';
import {
  convertUnits,
  DEFAULT_DENSITY_FACTOR,
  DEFAULT_WASTE_FACTOR,
  LOAD_SIZE_CY,
} from '@/lib/conversions';

export default function ConverterPage() {
  const [inputValue, setInputValue] = useState<string>('');
  const [inputUnit, setInputUnit] = useState<DirtUnit>('CY');
  const [densityFactor, setDensityFactor] = useState(DEFAULT_DENSITY_FACTOR);
  const [wasteFactor, setWasteFactor] = useState(DEFAULT_WASTE_FACTOR);

  const numValue = parseFloat(inputValue) || 0;
  const result = convertUnits(numValue, inputUnit, densityFactor, wasteFactor);

  const handleUnitClick = (unit: DirtUnit, value: number) => {
    setInputUnit(unit);
    setInputValue(value.toString());
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-ps-navy">Unit Converter</h2>
      <p className="text-sm text-ps-gray-500">FDOT Select Fill / Embankment (Section 120) - Jacksonville, FL</p>

      {/* Input */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
        <label className="block text-sm font-semibold text-ps-gray-600 mb-2">Enter Value</label>
        <div className="flex gap-3">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            className="flex-1 px-4 py-3 border border-ps-gray-300 rounded-lg text-2xl font-bold focus:ring-2 focus:ring-ps-navy focus:border-ps-navy outline-none text-center"
          />
          <select
            value={inputUnit}
            onChange={(e) => setInputUnit(e.target.value as DirtUnit)}
            className="px-4 py-3 border border-ps-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-ps-navy focus:border-ps-navy outline-none bg-white min-w-[130px]"
          >
            <option value="CY">Cubic Yards</option>
            <option value="TN">Tons</option>
            <option value="LOADS">Loads</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4">
        <h3 className="text-sm font-semibold text-ps-gray-600 mb-3">Base Conversion</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleUnitClick('CY', result.cy)}
            className={`p-4 rounded-xl text-center transition-all ${
              inputUnit === 'CY'
                ? 'bg-ps-navy text-white shadow-md'
                : 'bg-ps-gray-50 hover:bg-ps-gray-100 border border-ps-gray-200'
            }`}
          >
            <p className="text-2xl font-bold">{result.cy.toLocaleString()}</p>
            <p className="text-sm mt-1">Cubic Yards</p>
          </button>
          <button
            onClick={() => handleUnitClick('TN', result.tn)}
            className={`p-4 rounded-xl text-center transition-all ${
              inputUnit === 'TN'
                ? 'bg-ps-navy text-white shadow-md'
                : 'bg-ps-gray-50 hover:bg-ps-gray-100 border border-ps-gray-200'
            }`}
          >
            <p className="text-2xl font-bold">{result.tn.toLocaleString()}</p>
            <p className="text-sm mt-1">Tons</p>
          </button>
          <button
            onClick={() => handleUnitClick('LOADS', result.loads)}
            className={`p-4 rounded-xl text-center transition-all ${
              inputUnit === 'LOADS'
                ? 'bg-ps-navy text-white shadow-md'
                : 'bg-ps-gray-50 hover:bg-ps-gray-100 border border-ps-gray-200'
            }`}
          >
            <p className="text-2xl font-bold">{result.loads.toLocaleString()}</p>
            <p className="text-sm mt-1">Loads</p>
          </button>
        </div>
      </div>

      {/* With Waste Factor */}
      {numValue > 0 && (
        <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-4">
          <h3 className="text-sm font-semibold text-yellow-700 mb-3">
            With {wasteFactor}% Waste Factor (Order Quantity)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-lg text-center border border-yellow-200">
              <p className="text-xl font-bold text-yellow-700">{result.cyWithWaste.toLocaleString()}</p>
              <p className="text-xs text-yellow-600">CY</p>
            </div>
            <div className="p-3 bg-white rounded-lg text-center border border-yellow-200">
              <p className="text-xl font-bold text-yellow-700">{result.tnWithWaste.toLocaleString()}</p>
              <p className="text-xs text-yellow-600">TN</p>
            </div>
            <div className="p-3 bg-white rounded-lg text-center border border-yellow-200">
              <p className="text-xl font-bold text-yellow-700">{result.loadsWithWaste.toLocaleString()}</p>
              <p className="text-xs text-yellow-600">Loads</p>
            </div>
          </div>
        </div>
      )}

      {/* Parameters */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-ps-gray-600">Conversion Parameters</h3>

        <div>
          <label className="flex items-center justify-between text-sm text-ps-gray-600 mb-1">
            <span>Density Factor (TN/CY)</span>
            <button
              onClick={() => setDensityFactor(DEFAULT_DENSITY_FACTOR)}
              className="text-xs text-ps-navy underline"
            >
              Reset to 1.2
            </button>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={densityFactor}
            onChange={(e) => setDensityFactor(parseFloat(e.target.value))}
            className="w-full accent-ps-navy"
          />
          <div className="flex justify-between text-xs text-ps-gray-400">
            <span>0.5</span>
            <span className="font-bold text-ps-navy text-sm">{densityFactor}</span>
            <span>2.5</span>
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-sm text-ps-gray-600 mb-1">
            <span>Waste Factor (%)</span>
            <button
              onClick={() => setWasteFactor(DEFAULT_WASTE_FACTOR)}
              className="text-xs text-ps-navy underline"
            >
              Reset to 15%
            </button>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={wasteFactor}
            onChange={(e) => setWasteFactor(parseFloat(e.target.value))}
            className="w-full accent-ps-navy"
          />
          <div className="flex justify-between text-xs text-ps-gray-400">
            <span>0%</span>
            <span className="font-bold text-ps-navy text-sm">{wasteFactor}%</span>
            <span>50%</span>
          </div>
        </div>
      </div>

      {/* Reference Info */}
      <div className="bg-ps-gray-50 rounded-xl border border-ps-gray-200 p-4">
        <h3 className="text-sm font-semibold text-ps-gray-600 mb-2">Reference</h3>
        <div className="text-xs text-ps-gray-500 space-y-1">
          <p>1 Load = {LOAD_SIZE_CY} Cubic Yards (standard tandem dump truck)</p>
          <p>Default Density: {DEFAULT_DENSITY_FACTOR} TN/CY (FDOT Select Fill)</p>
          <p>Default Waste: {DEFAULT_WASTE_FACTOR}% (site conditions allowance)</p>
          <p className="mt-2 font-semibold">Formulas:</p>
          <p>Tons = Cubic Yards × Density Factor</p>
          <p>Cubic Yards = Tons ÷ Density Factor</p>
          <p>Loads = Cubic Yards ÷ {LOAD_SIZE_CY}</p>
          <p>Order Qty = Result × (1 + Waste%/100)</p>
        </div>
      </div>
    </div>
  );
}
