'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DirtEntry } from '@/types';
import { getEntries, initializeWithSeedData } from '@/lib/storage';
import { seedEntries } from '@/data/seedEntries';
import { projects } from '@/data/projects';
import { calculateDistance } from '@/lib/conversions';
import { superintendents } from '@/data/superintendents';

// Dynamic import for Leaflet (no SSR)
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function MapPage() {
  const [entries, setEntries] = useState<DirtEntry[]>([]);
  const [userLat, setUserLat] = useState<number | undefined>();
  const [userLng, setUserLng] = useState<number | undefined>();
  const [nearbyList, setNearbyList] = useState<
    { projectId: string; name: string; distance: number; type: 'has' | 'needs' | 'both'; cy: number; superName: string }[]
  >([]);
  const [showContact, setShowContact] = useState<string | null>(null);

  useEffect(() => {
    initializeWithSeedData(seedEntries);
    setEntries(getEntries());

    // Request GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        () => {
          // Default to downtown Jacksonville if GPS denied
          setUserLat(30.3322);
          setUserLng(-81.6557);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (!userLat || !userLng || entries.length === 0) return;

    const projectMap = new Map(projects.map(p => [p.id, p]));
    const projectTotals = new Map<string, { has: number; needs: number; superNames: Set<string> }>();

    entries.forEach(entry => {
      const cur = projectTotals.get(entry.projectId) || { has: 0, needs: 0, superNames: new Set<string>() };
      if (entry.type === 'has') cur.has += entry.quantityCY;
      else cur.needs += entry.quantityCY;
      cur.superNames.add(entry.superintendentName);
      projectTotals.set(entry.projectId, cur);
    });

    const nearby = Array.from(projectTotals.entries())
      .map(([projectId, totals]) => {
        const project = projectMap.get(projectId);
        if (!project) return null;
        const distance = calculateDistance(userLat, userLng, project.lat, project.lng);
        return {
          projectId,
          name: project.name,
          distance,
          type: totals.has > 0 && totals.needs > 0 ? 'both' as const
            : totals.has > 0 ? 'has' as const : 'needs' as const,
          cy: Math.round(Math.abs(totals.has - totals.needs)),
          superName: Array.from(totals.superNames)[0],
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.distance - b!.distance) as typeof nearbyList;

    setNearbyList(nearby);
  }, [entries, userLat, userLng]);

  const getContactInfo = (name: string) => {
    return superintendents.find(s => s.name === name);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ps-navy">Project Map</h2>

      {/* Map */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200 overflow-hidden" style={{ height: '450px' }}>
        <MapView entries={entries} userLat={userLat} userLng={userLng} />
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-ps-lime"></div>
          <span>Has Dirt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-ps-red"></div>
          <span>Needs Dirt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span>You</span>
        </div>
      </div>

      {/* Nearby Projects List */}
      <div className="bg-white rounded-xl shadow-sm border border-ps-gray-200">
        <div className="px-4 py-3 border-b border-ps-gray-200">
          <h3 className="font-bold text-ps-navy">Nearby Projects</h3>
          <p className="text-xs text-ps-gray-400">Sorted by distance from your location</p>
        </div>
        <div className="divide-y divide-ps-gray-100 max-h-96 overflow-y-auto">
          {nearbyList.map((item) => (
            <div key={item.projectId} className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.type === 'has' ? 'bg-ps-lime' : item.type === 'needs' ? 'bg-ps-red' : 'bg-yellow-500'
                    }`}></div>
                    <span className="font-semibold text-sm text-ps-gray-700">{item.name}</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-ps-gray-500">
                    <span>{item.distance} mi away</span>
                    <span className={item.type === 'has' ? 'text-ps-lime-dark font-semibold' : item.type === 'needs' ? 'text-ps-red font-semibold' : 'text-yellow-600 font-semibold'}>
                      {item.type === 'has' ? `+${item.cy} CY` : item.type === 'needs' ? `-${item.cy} CY` : 'Mixed'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowContact(showContact === item.projectId ? null : item.projectId)}
                  className="px-3 py-1 bg-ps-navy text-white text-xs rounded-lg hover:bg-ps-navy-light"
                >
                  Contact
                </button>
              </div>
              {showContact === item.projectId && (() => {
                const contact = getContactInfo(item.superName);
                return contact ? (
                  <div className="mt-2 p-3 bg-ps-gray-50 rounded-lg text-sm">
                    <p className="font-semibold">{contact.name}</p>
                    <a href={`tel:${contact.phone}`} className="text-ps-navy underline block">{contact.phone}</a>
                    <a href={`mailto:${contact.email}`} className="text-ps-navy underline block text-xs">{contact.email}</a>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-ps-gray-50 rounded-lg text-sm text-ps-gray-500">
                    Reported by: {item.superName}
                  </div>
                );
              })()}
            </div>
          ))}
          {nearbyList.length === 0 && (
            <p className="text-center text-ps-gray-400 py-6">Loading nearby projects...</p>
          )}
        </div>
      </div>
    </div>
  );
}
