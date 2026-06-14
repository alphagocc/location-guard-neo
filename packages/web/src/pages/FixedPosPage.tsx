import L from 'leaflet';
import { useCallback, useEffect, useRef } from 'react';
import { useLocationGuard } from '../hooks/useLocationGuard';

export function FixedPosPage() {
  const { ready, getValue, setValue } = useLocationGuard();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const saveFixedPos = useCallback(async (latlng: L.LatLng) => {
    const wrapped = latlng.wrap();
    await setValue('fixedPos', { latitude: wrapped.lat, longitude: wrapped.lng });
    markerRef.current?.setLatLng(latlng);
  }, [setValue]);

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current)
      return;

    (async () => {
      const fixedPos = await getValue('fixedPos');
      const latlng: L.LatLngExpression = [fixedPos.latitude, fixedPos.longitude];

      const map = L.map(mapRef.current!).setView(latlng, 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker(latlng, { draggable: true }).addTo(map);

      marker.on('dragend', (e) => {
        saveFixedPos((e.target as L.Marker).getLatLng());
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        saveFixedPos(e.latlng);
      });

      marker.bindPopup(
        '<div style="font-size:14px;line-height:1.5">'
        + '<p>This is the location reported when the privacy level is set to <b>"Use fixed location"</b>.</p>'
        + '<p>Click on the map or drag the marker to set a new fixed location.</p>'
        + '</div>',
        { maxWidth: 300 },
      ).openPopup();

      mapInstanceRef.current = map;
      markerRef.current = marker;
    })();
  }, [ready]); // eslint-disable-line react/exhaustive-deps

  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
      return () => clearTimeout(timer);
    }
  });

  return (
    <div className="fixed-page">
      <div className="page-header">
        <h2>Fixed Location</h2>
      </div>
      <div className="page-body">
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Click on the map or drag the marker to set the fixed location.
            This location is used when the privacy level is set to &quot;Use fixed location&quot;.
          </p>
        </div>
        <div ref={mapRef} className="map-container map-container-full" />
      </div>
    </div>
  );
}
