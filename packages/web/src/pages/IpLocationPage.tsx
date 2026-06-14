import L from 'leaflet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocationGuard } from '../hooks/useLocationGuard';

export function IpLocationPage() {
  const { ready, api, getValue } = useLocationGuard();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [ip, setIp] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMarker = useCallback((lat: number, lon: number) => {
    const latlng: L.LatLngExpression = [lat, lon];
    if (markerRef.current) {
      markerRef.current.setLatLng(latlng);
    }
    mapInstanceRef.current?.setView(latlng, 12);
  }, []);

  const fetchPosition = useCallback(async () => {
    if (!api)
      return;
    setLoading(true);
    setError(null);
    try {
      const pos = await api.getIpPosition();
      setIp(pos.ip);
      setCoords({ lat: pos.latitude, lon: pos.longitude });
      updateMarker(pos.latitude, pos.longitude);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch IP location');
    }
    finally {
      setLoading(false);
    }
  }, [api, updateMarker]);

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current)
      return;

    const defaultLatLng: L.LatLngExpression = [0, 0];
    const map = L.map(mapRef.current).setView(defaultLatLng, 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker(defaultLatLng).addTo(map);
    mapInstanceRef.current = map;
    markerRef.current = marker;

    (async () => {
      const cached = await getValue('ipPos');
      if (cached) {
        setIp(cached.ip);
        setCoords({ lat: cached.latitude, lon: cached.longitude });
        marker.setLatLng([cached.latitude, cached.longitude]);
        map.setView([cached.latitude, cached.longitude], 12);
      }
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
        <h2>IP Location</h2>
      </div>
      <div className="page-body">
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            This page shows the location derived from your current public IP address.
            When the privacy level is set to &quot;Use IP-based location&quot;, this is the position reported to websites.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={fetchPosition} disabled={loading || !ready}>
              {loading ? 'Fetching...' : 'Refresh IP Location'}
            </button>
            {ip && (
              <span style={{ fontSize: 14 }}>
                IP:
                {' '}
                <strong>{ip}</strong>
              </span>
            )}
            {coords && (
              <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                (
                {coords.lat.toFixed(4)}
                ,
                {' '}
                {coords.lon.toFixed(4)}
                )
              </span>
            )}
          </div>
          {error && (
            <p style={{ fontSize: 13, color: 'var(--color-danger)', marginTop: 8 }}>{error}</p>
          )}
        </div>
        <div ref={mapRef} className="map-container map-container-full" />
      </div>
    </div>
  );
}
