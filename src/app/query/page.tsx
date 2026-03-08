'use client';

import { useEffect, useState } from 'react';
import { DirtEntry, DirtType } from '@/types';
import { getEntries, initializeWithSeedData, deleteEntry } from '@/lib/storage';
import { seedEntries } from '@/data/seedEntries';
import { projects } from '@/data/projects';
import { superintendents } from '@/data/superintendents';
import { exportToExcel } from '@/lib/export';

export default function QueryPage() {
  const [entries, setEntries] = useState<DirtEntry[]>([]);
  const [filterType, setFilterType] = useState<DirtType | 'all'>('all');
  const [filterProject, setFilterProject] = useState('');
  const [filterSuper, setFilterSuper] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'quantity'>('date');
  const [showContact, setShowContact] = useState<string | null>(null);

  useEffect(() => {
    initializeWithSeedData(seedEntries);
    setEntries(getEntries());
  }, []);

  const projectMap = new Map(projects.map(p => [p.id, p]));

  const filtered = entries
    .filter(e => filterType === 'all' || e.type === filterType)
    .filter(e => !filterProject || e.projectId === filterProject)
    .filter(e => !filterSuper || e.superintendentName.toLowerCase().includes(filterSuper.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return b.quantityCY - a.quantityCY;
    });

  const handleExport = () => {
    exportToExcel(filtered, `dirt-log-${new Date().toISOString().split('T')[0]}`);
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    setEntries(getEntries());
  };

  const getContact = (name: string) => superintendents.find(s => s.name === name);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ps-navy">Query Data</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-ps-lime text-white font-semibold rounded-lg hover:bg-ps-lime-dark transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              filterType === 'all' ? 'bg-ps-navy text-white' : 'bg-ps-gray-100 text-ps-gray-600 hover:bg-ps-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('has')}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              filterType === 'has' ? 'bg-ps-lime text-white' : 'bg-ps-gray-100 text-ps-gray-600 hover:bg-ps-gray-200'
            }`}
          >
            Has Dirt
          </button>
          <button
            onClick={() => setFilterType('needs')}
            className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              filterType === 'needs' ? 'bg-ps-red text-white' : 'bg-ps-gray-100 text-ps-gray-600 hover:bg-ps-gray-200'
            }`}
          >
            Needs Dirt
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-ps-gray-500 block mb-1">Project</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full px-3 py-2 border border-ps-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ps-navy outline-none bg-white"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-ps-gray-500 block mb-1">Superintendent</label>
            <input
              type="text"
              value={filterSuper}
              onChange={(e) => setFilterSuper(e.target.value)}
              placeholder="Search name..."
              className="w-full px-3 py-2 border border-ps-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ps-navy outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-ps-gray-500">Sort:</span>
          <button
            onClick={() => setSortBy('date')}
            className={`text-xs px-3 py-1 rounded ${sortBy === 'date' ? 'bg-ps-navy text-white' : 'bg-ps-gray-100 text-ps-gray-600'}`}
          >
            Date
          </button>
          <button
            onClick={() => setSortBy('quantity')}
            className={`text-xs px-3 py-1 rounded ${sortBy === 'quantity' ? 'bg-ps-navy text-white' : 'bg-ps-gray-100 text-ps-gray-600'}`}
          >
            Quantity
          </button>
          <span className="text-xs text-ps-gray-400 ml-auto">{filtered.length} entries</span>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filtered.map((entry) => {
          const project = projectMap.get(entry.projectId);
          const contact = getContact(entry.superintendentName);
          return (
            <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-ps-gray-200 overflow-hidden">
              <div className={`px-4 py-2 flex items-center justify-between ${
                entry.type === 'has' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    entry.type === 'has' ? 'bg-ps-lime' : 'bg-ps-red'
                  }`}></span>
                  <span className={`text-sm font-bold ${
                    entry.type === 'has' ? 'text-ps-lime-dark' : 'text-ps-red'
                  }`}>
                    {entry.type === 'has' ? 'HAS DIRT' : 'NEEDS DIRT'}
                  </span>
                </div>
                <span className="text-xs text-ps-gray-400">
                  {new Date(entry.timestamp).toLocaleDateString('en-US')}
                </span>
              </div>
              <div className="px-4 py-3">
                <p className="font-semibold text-ps-gray-700">{project?.id} - {project?.name || 'Unknown'}</p>
                <p className="text-xs text-ps-gray-400 mt-1">{project?.address}</p>

                <div className="flex gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-ps-navy">{entry.quantityCY.toLocaleString()}</p>
                    <p className="text-xs text-ps-gray-400">CY</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-ps-navy">{entry.quantityTN.toLocaleString()}</p>
                    <p className="text-xs text-ps-gray-400">TN</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-ps-navy">{entry.quantityLoads.toLocaleString()}</p>
                    <p className="text-xs text-ps-gray-400">Loads</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-ps-gray-100">
                  <span className="text-sm text-ps-gray-600">{entry.superintendentName}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowContact(showContact === entry.id ? null : entry.id)}
                      className="px-3 py-1 bg-ps-navy text-white text-xs rounded-lg hover:bg-ps-navy-light"
                    >
                      Contact
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-3 py-1 bg-ps-gray-200 text-ps-gray-600 text-xs rounded-lg hover:bg-ps-gray-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {showContact === entry.id && contact && (
                  <div className="mt-2 p-3 bg-ps-gray-50 rounded-lg text-sm">
                    <p className="font-semibold">{contact.name}</p>
                    <a href={`tel:${contact.phone}`} className="text-ps-navy underline block">{contact.phone}</a>
                    <a href={`mailto:${contact.email}`} className="text-ps-navy underline block text-xs">{contact.email}</a>
                    <p className="text-xs text-ps-gray-400 mt-1">Projects: {contact.projectIds.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-ps-gray-400 py-8">No entries match your filters</p>
        )}
      </div>
    </div>
  );
}
