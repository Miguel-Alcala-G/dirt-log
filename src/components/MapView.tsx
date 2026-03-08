'use client';

import { useEffect, useRef, useState } from 'react';
import { DirtEntry } from '@/types';
import { projects } from '@/data/projects';
import { superintendents } from '@/data/superintendents';
import L from 'leaflet';

interface MapViewProps {
  entries: DirtEntry[];
  userLat?: number;
  userLng?: number;
}

export default function MapView({ entries, userLat, userLng }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map centered on Jacksonville
    const map = L.map(mapRef.current).setView([30.3322, -81.6557], 11);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Aggregate entries by project
    const projectTotals = new Map<string, { has: number; needs: number; entries: DirtEntry[] }>();
    entries.forEach(entry => {
      const cur = projectTotals.get(entry.projectId) || { has: 0, needs: 0, entries: [] };
      if (entry.type === 'has') cur.has += entry.quantityCY;
      else cur.needs += entry.quantityCY;
      cur.entries.push(entry);
      projectTotals.set(entry.projectId, cur);
    });

    // Add markers for each project with entries
    const projectMap = new Map(projects.map(p => [p.id, p]));

    projectTotals.forEach((totals, projectId) => {
      const project = projectMap.get(projectId);
      if (!project) return;

      const net = totals.has - totals.needs;
      const isHas = net >= 0;
      const maxQty = Math.max(totals.has, totals.needs);
      const radius = Math.min(Math.max(8, Math.sqrt(maxQty) * 1.5), 35);

      const color = isHas ? '#7CB342' : '#DC2626';
      const fillColor = isHas ? '#9CCC65' : '#EF4444';

      // Find superintendent for this project
      const superNames = new Set(totals.entries.map(e => e.superintendentName));
      const superInfo = superintendents.find(s =>
        s.projectIds.includes(projectId) || superNames.has(s.name)
      );

      const marker = L.circleMarker([project.lat, project.lng], {
        radius,
        color,
        fillColor,
        fillOpacity: 0.6,
        weight: 2,
      }).addTo(map);

      const popupContent = `
        <div style="min-width: 220px; font-family: Arial, sans-serif;">
          <div style="background: ${isHas ? '#7CB342' : '#DC2626'}; color: white; padding: 8px 12px; margin: -1px; border-radius: 4px 4px 0 0;">
            <strong>${isHas ? 'HAS DIRT' : 'NEEDS DIRT'}</strong>
          </div>
          <div style="padding: 10px;">
            <p style="font-weight: bold; font-size: 14px; margin: 0 0 4px;">${project.id} - ${project.name}</p>
            <p style="color: #666; font-size: 12px; margin: 0 0 8px;">${project.address}</p>
            <div style="display: flex; gap: 12px; margin-bottom: 8px;">
              <div>
                <span style="color: #7CB342; font-weight: bold;">${Math.round(totals.has).toLocaleString()} CY</span>
                <br/><small style="color: #888;">Available</small>
              </div>
              <div>
                <span style="color: #DC2626; font-weight: bold;">${Math.round(totals.needs).toLocaleString()} CY</span>
                <br/><small style="color: #888;">Needed</small>
              </div>
            </div>
            ${superInfo ? `
              <div style="border-top: 1px solid #eee; padding-top: 8px;">
                <p style="margin: 0 0 2px; font-weight: 600;">${superInfo.name}</p>
                <p style="margin: 0 0 2px;"><a href="tel:${superInfo.phone}" style="color: #003366;">${superInfo.phone}</a></p>
                <p style="margin: 0;"><a href="mailto:${superInfo.email}" style="color: #003366; font-size: 12px;">${superInfo.email}</a></p>
              </div>
            ` : `
              <div style="border-top: 1px solid #eee; padding-top: 8px;">
                <p style="margin: 0; color: #888; font-size: 12px;">Reported by: ${Array.from(superNames).join(', ')}</p>
              </div>
            `}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
    });

    // Add user location marker
    if (userLat && userLng) {
      L.circleMarker([userLat, userLng], {
        radius: 10,
        color: '#003366',
        fillColor: '#4A90D9',
        fillOpacity: 0.9,
        weight: 3,
      }).addTo(map).bindPopup('<strong>Your Location</strong>');
    }
  }, [entries, userLat, userLng]);

  return <div ref={mapRef} style={{ height: '100%', minHeight: '400px' }} />;
}
