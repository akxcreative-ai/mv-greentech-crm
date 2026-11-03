import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { LiveTrackUser, UserLocationPoint } from '../../lib/types';

interface LiveTrackingMapProps {
  users: LiveTrackUser[];
  selectedUser: LiveTrackUser | null;
  routeHistory: UserLocationPoint[];
  onSelectUser: (user: LiveTrackUser) => void;
}

// Create custom Google-Maps style navigation arrow marker
function createArrowIcon(name: string, heading: number | null = 0, isMoving: boolean, isSelected: boolean) {
  const rotation = heading ?? 0;
  const borderColor = isSelected ? '#10B981' : '#3B82F6';

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer" style="transform: translate(-50%, -50%);">
      <!-- Pulsing Aura -->
      <div class="absolute -inset-2 rounded-full ${
        isMoving ? 'bg-blue-500/30 animate-ping' : 'bg-emerald-500/20'
      }"></div>

      <!-- Navigation Arrow Cursor (Google Maps Style) -->
      <div 
        class="w-10 h-10 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 relative z-10"
        style="
          background: radial-gradient(circle, #2563EB 0%, #1D4ED8 100%);
          border: 2.5px solid #FFFFFF;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.6);
          transform: rotate(${rotation}deg);
        "
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="#FFFFFF" class="drop-shadow">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
        </svg>
      </div>

      <!-- Name Tag Pill -->
      <div 
        class="mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-lg whitespace-nowrap border z-20"
        style="
          background: rgba(15, 23, 42, 0.9);
          border-color: ${borderColor};
          backdrop-filter: blur(8px);
        "
      >
        ${name} ${isMoving ? '🚗' : '📍'}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-navigation-arrow-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// Create Client Visit Marker
function createVisitIcon(label: string) {
  const html = `
    <div class="relative flex flex-col items-center cursor-pointer" style="transform: translate(-50%, -100%);">
      <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
        🏢
      </div>
      <div class="mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900/90 text-emerald-300 border border-emerald-500/30 whitespace-nowrap shadow">
        ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-visit-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  users,
  selectedUser,
  routeHistory,
  onSelectUser,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center on India (e.g., Delhi NCR region)
    const initialLat = 28.6139;
    const initialLng = 77.2090;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 11,
      zoomControl: false,
    });

    // Sleek CartoDB Positron Tiles (Google Maps style clean aesthetic)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom controls on top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Salesperson Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const activeBounds: L.LatLngExpression[] = [];

    users.forEach((u) => {
      if (!u.lastLatitude || !u.lastLongitude) return;

      const lat = u.lastLatitude;
      const lng = u.lastLongitude;
      const isSelected = selectedUser?.id === u.id;
      const isMoving = (u.lastSpeed || 0) > 3;

      activeBounds.push([lat, lng]);

      const marker = L.marker([lat, lng], {
        icon: createArrowIcon(`${u.firstName} ${u.lastName}`, u.lastHeading, isMoving, isSelected),
        zIndexOffset: isSelected ? 1000 : 100,
      });

      const speedText = u.lastSpeed ? `${u.lastSpeed} km/h` : 'Stationary';
      const lastSeen = u.lastLocationAt
        ? new Date(u.lastLocationAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Recently';

      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px; min-width: 180px;">
          <div style="font-weight: bold; font-size: 14px; color: #1E293B;">${u.firstName} ${u.lastName}</div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 6px;">${u.role} &bull; ${u.phone || u.email}</div>
          <div style="display: flex; gap: 8px; font-size: 11px; margin-bottom: 4px;">
            <span style="background: #EFF6FF; color: #1D4ED8; padding: 2px 6px; border-radius: 4px; font-weight: 600;">🚗 ${speedText}</span>
            <span style="background: #F1F5F9; color: #475569; padding: 2px 6px; border-radius: 4px;">🕒 ${lastSeen}</span>
          </div>
          <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">
            Status: <strong style="color: ${u.isTrackingActive ? '#10B981' : '#F59E0B'}">${u.isTrackingActive ? 'Tracking Active' : 'Off Duty'}</strong>
          </div>
        </div>
      `);

      marker.on('click', () => {
        onSelectUser(u);
      });

      marker.addTo(layer);

      // Also render recent customer visit pins if available
      u.customerVisits?.forEach((v) => {
        if (v.latitude && v.longitude) {
          const visitMarker = L.marker([v.latitude, v.longitude], {
            icon: createVisitIcon(v.purpose || 'Client Visit'),
          });
          visitMarker.bindPopup(`
            <div style="font-size: 12px; padding: 4px;">
              <strong>${v.purpose || 'Client Meeting'}</strong><br/>
              <span style="color: #64748B;">Visited by: ${u.firstName} ${u.lastName}</span><br/>
              ${v.outcome ? `<span style="color: #059669; font-size: 11px;">Outcome: ${v.outcome}</span>` : ''}
            </div>
          `);
          visitMarker.addTo(layer);
          activeBounds.push([v.latitude, v.longitude]);
        }
      });
    });

    // Auto fit bounds on initial load if we have points and no specific user selected
    if (!selectedUser && activeBounds.length > 0) {
      try {
        map.fitBounds(L.latLngBounds(activeBounds), { padding: [50, 50], maxZoom: 15 });
      } catch {
        // Fallback
      }
    }
  }, [users, selectedUser, onSelectUser]);

  // Draw Today's Route Polyline for Selected User
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (routeHistory && routeHistory.length > 1) {
      const latLngs: [number, number][] = routeHistory.map((p) => [p.latitude, p.longitude]);

      const polyline = L.polyline(latLngs, {
        color: '#2563EB',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '1, 8', // glowing dashed trajectory
      }).addTo(map);

      routePolylineRef.current = polyline;

      // Pan & zoom to route
      try {
        map.fitBounds(polyline.getBounds(), { padding: [60, 60], maxZoom: 16 });
      } catch {
        // Fallback
      }
    } else if (selectedUser?.lastLatitude && selectedUser?.lastLongitude) {
      map.flyTo([selectedUser.lastLatitude, selectedUser.lastLongitude], 15, {
        duration: 1.2,
      });
    }
  }, [selectedUser, routeHistory]);

  return (
    <div className="relative w-full h-full min-h-[550px] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      <div ref={mapContainerRef} className="w-full h-full min-h-[550px] z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 text-xs text-white/80 shadow-xl flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white flex items-center justify-center text-[8px] text-white">▲</div>
          <span>Sales Rep (Live Arrow)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white"></div>
          <span>Client Visit Site</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-1 bg-blue-500 rounded-full"></div>
          <span>Today's Route</span>
        </div>
      </div>
    </div>
  );
};
